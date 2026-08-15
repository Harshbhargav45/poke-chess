use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(
        mut,
        seeds = [b"game", game.host.as_ref()],
        bump = game.game_bump
    )]
    pub game: Account<'info, GameAccount>,
    pub player: Signer<'info>,
}

pub fn make_move(ctx: Context<MakeMove>, from: u8, to: u8, promotion_piece: Option<u8>) -> Result<()> {
    let game = &mut ctx.accounts.game;

    require!(
        matches!(game.status, GameStatus::Active | GameStatus::InCheck),
        PokeChessError::GameNotActive
    );
    require!(game.joiner.is_some(), PokeChessError::InvalidJoinPhase);
    require!(game.turn == ctx.accounts.player.key(), PokeChessError::NotYourTurn);

    let from_idx = from as usize;
    let to_idx = to as usize;
    require!(from_idx < BOARD_SIZE && to_idx < BOARD_SIZE, PokeChessError::InvalidIndex);
    require!(from_idx != to_idx, PokeChessError::InvalidMove);

    let piece = game.board[from_idx];
    require!(piece != EMPTY, PokeChessError::InvalidMove);

    let piece_color = piece & 24;
    let piece_type = piece & 7;

    let player_is_host = ctx.accounts.player.key() == game.host;
    let is_host_piece = piece_color == WHITE;
    let is_joiner_piece = piece_color == BLACK;

    require!(
        (is_host_piece && player_is_host) || (is_joiner_piece && Some(ctx.accounts.player.key()) == game.joiner),
        PokeChessError::NotYourPiece
    );

    let destination_piece = game.board[to_idx];
    if destination_piece != EMPTY {
        let dest_color = destination_piece & 24;
        require!(piece_color != dest_color, PokeChessError::InvalidDestination);
    }

    // Handle castling
    if piece_type == KING && (to as i8 - from as i8).abs() == 2 {
        require!(
            is_valid_castling(&game.board, from_idx, to_idx, piece_color, game),
            PokeChessError::InvalidMove
        );

        // Execute castling
        let (rook_from, rook_to) = if to > from {
            // Kingside
            (from_idx + 3, from_idx + 1)
        } else {
            // Queenside
            (from_idx - 4, from_idx - 1)
        };

        let rook = game.board[rook_from];
        game.board[rook_from] = EMPTY;
        game.board[rook_to] = rook;
    } else {
        require!(
            is_valid_move(&game.board, from_idx, to_idx, piece_type, piece_color, game),
            PokeChessError::InvalidMove
        );
    }

    // Handle en passant capture
    if piece_type == PAWN && game.en_passant_square == Some(to) {
        let captured_pawn_row = from_idx / 8;
        let captured_pawn_idx = (captured_pawn_row * 8) + (to_idx % 8);
        game.board[captured_pawn_idx] = EMPTY;
    }

    // Execute the move
    let moving_piece = game.board[from_idx];
    game.board[from_idx] = EMPTY;
    game.board[to_idx] = moving_piece;

    // Handle pawn promotion
    if piece_type == PAWN {
        let promotion_row = if piece_color == WHITE { 7 } else { 0 };
        if to_idx / 8 == promotion_row {
            let promo = promotion_piece.unwrap_or(QUEEN);
            let promo_type = promo.min(QUEEN).max(KNIGHT);
            game.board[to_idx] = piece_color | promo_type;
        }
    }

    // Update en passant square
    if piece_type == PAWN && (to as i8 - from as i8).abs() == 2 {
        game.en_passant_square = Some(((from_idx + to_idx) / 2) as u8);
    } else {
        game.en_passant_square = None;
    }

    // Update castling rights
    if piece_type == KING {
        game.has_king_moved = true;
    }
    if piece_type == ROOK {
        if from_idx == 0 { game.has_white_queenside_rook_moved = true; }
        if from_idx == 7 { game.has_white_kingside_rook_moved = true; }
        if from_idx == 56 { game.has_black_kingside_rook_moved = true; }
        if from_idx == 63 { game.has_black_queenside_rook_moved = true; }
    }
    // If a rook is captured
    if destination_piece == WHITE_ROOK {
        if to_idx == 0 { game.has_white_queenside_rook_moved = true; }
        if to_idx == 7 { game.has_white_kingside_rook_moved = true; }
    }
    if destination_piece == BLACK_ROOK {
        if to_idx == 56 { game.has_black_kingside_rook_moved = true; }
        if to_idx == 63 { game.has_black_queenside_rook_moved = true; }
    }

    // Store last move
    game.last_move_from = Some(from);
    game.last_move_to = Some(to);

    // Record timestamp for time controls
    let clock = Clock::get()?;
    game.last_move_timestamp = clock.unix_timestamp;

    // Check for king capture (legacy win condition)
    if destination_piece == BLACK_KING || destination_piece == WHITE_KING {
        game.status = GameStatus::Finished;
        game.winner = Some(ctx.accounts.player.key());

        emit!(MoveMadeEvent {
            game: game.key(),
            player: ctx.accounts.player.key(),
            from,
            to,
            status: GameStatus::Finished,
        });

        emit!(GameOverEvent {
            game: game.key(),
            winner: game.winner,
            status: GameStatus::Finished,
        });

        return Ok(());
    }

    // Determine opponent color
    let opponent_color = if piece_color == WHITE { BLACK } else { WHITE };

    // Check if opponent is in check
    let opponent_king_pos = find_king(&game.board, opponent_color);
    let in_check = is_square_attacked(&game.board, opponent_king_pos, piece_color);

    // Check for checkmate or stalemate
    let has_legal = has_legal_moves(&game.board, opponent_color, game);

    if in_check && !has_legal {
        // Checkmate
        game.status = GameStatus::Finished;
        game.winner = Some(ctx.accounts.player.key());

        emit!(GameOverEvent {
            game: game.key(),
            winner: game.winner,
            status: GameStatus::Finished,
        });
    } else if !in_check && !has_legal {
        // Stalemate - draw
        game.status = GameStatus::Draw;

        emit!(GameOverEvent {
            game: game.key(),
            winner: None,
            status: GameStatus::Draw,
        });
    } else if in_check {
        game.status = GameStatus::InCheck;
        // Switch turn
        if let Some(j) = game.joiner {
            game.turn = if game.turn == game.host { j } else { game.host };
        }
    } else {
        game.status = GameStatus::Active;
        // Switch turn
        if let Some(j) = game.joiner {
            game.turn = if game.turn == game.host { j } else { game.host };
        }
    }

    emit!(MoveMadeEvent {
        game: game.key(),
        player: ctx.accounts.player.key(),
        from,
        to,
        status: game.status,
    });

    Ok(())
}

fn find_king(board: &[u8; 64], color: u8) -> usize {
    let king = color | KING;
    for i in 0..64 {
        if board[i] == king {
            return i;
        }
    }
    0
}

fn is_square_attacked(board: &[u8; 64], square: usize, attacker_color: u8) -> bool {
    let sq_r = (square / 8) as i8;
    let sq_c = (square % 8) as i8;

    // Check knight attacks
    let knight = attacker_color | KNIGHT;
    let knight_moves: [(i8, i8); 8] = [
        (-2, -1), (-2, 1), (-1, -2), (-1, 2),
        (1, -2), (1, 2), (2, -1), (2, 1),
    ];
    for (dr, dc) in knight_moves.iter() {
        let r = sq_r + dr;
        let c = sq_c + dc;
        if r >= 0 && r < 8 && c >= 0 && c < 8 {
            if board[(r * 8 + c) as usize] == knight {
                return true;
            }
        }
    }

    // Check pawn attacks
    let pawn = attacker_color | PAWN;
    let pawn_dir = if attacker_color == WHITE { -1 } else { 1 };
    for dc in [-1, 1] {
        let r = sq_r + pawn_dir;
        let c = sq_c + dc;
        if r >= 0 && r < 8 && c >= 0 && c < 8 {
            if board[(r * 8 + c) as usize] == pawn {
                return true;
            }
        }
    }

    // Check king attacks
    let king = attacker_color | KING;
    for dr in -1..=1 {
        for dc in -1..=1 {
            if dr == 0 && dc == 0 { continue; }
            let r = sq_r + dr;
            let c = sq_c + dc;
            if r >= 0 && r < 8 && c >= 0 && c < 8 {
                if board[(r * 8 + c) as usize] == king {
                    return true;
                }
            }
        }
    }

    // Check sliding pieces (bishop, rook, queen)
    let bishop = attacker_color | BISHOP;
    let rook = attacker_color | ROOK;
    let queen = attacker_color | QUEEN;

    // Diagonal attacks (bishop, queen)
    let diag_dirs: [(i8, i8); 4] = [(-1, -1), (-1, 1), (1, -1), (1, 1)];
    for (dr, dc) in diag_dirs.iter() {
        let mut r = sq_r + dr;
        let mut c = sq_c + dc;
        while r >= 0 && r < 8 && c >= 0 && c < 8 {
            let piece = board[(r * 8 + c) as usize];
            if piece != EMPTY {
                if piece == bishop || piece == queen {
                    return true;
                }
                break;
            }
            r += dr;
            c += dc;
        }
    }

    // Straight attacks (rook, queen)
    let straight_dirs: [(i8, i8); 4] = [(-1, 0), (1, 0), (0, -1), (0, 1)];
    for (dr, dc) in straight_dirs.iter() {
        let mut r = sq_r + dr;
        let mut c = sq_c + dc;
        while r >= 0 && r < 8 && c >= 0 && c < 8 {
            let piece = board[(r * 8 + c) as usize];
            if piece != EMPTY {
                if piece == rook || piece == queen {
                    return true;
                }
                break;
            }
            r += dr;
            c += dc;
        }
    }

    false
}

fn has_legal_moves(board: &[u8; 64], color: u8, game: &GameAccount) -> bool {
    for from in 0..64 {
        let piece = board[from];
        if piece == EMPTY || (piece & 24) != color {
            continue;
        }

        for to in 0..64 {
            if from == to { continue; }
            let dest = board[to];
            if dest != EMPTY && (dest & 24) == color { continue; }

            let piece_type = piece & 7;

            // Try the move on a copy
            let mut test_board = *board;
            test_board[from] = EMPTY;
            test_board[to] = piece;

            // Handle en passant in test
            if piece_type == PAWN && game.en_passant_square == Some(to as u8) {
                let captured_row = from / 8;
                let captured_idx = (captured_row * 8) + (to % 8);
                test_board[captured_idx] = EMPTY;
            }

            // Handle castling in test
            if piece_type == KING && (to as i8 - from as i8).abs() == 2 {
                if !is_valid_castling(board, from, to, color, game) {
                    continue;
                }
                let (rook_from, rook_to) = if to > from {
                    (from + 3, from + 1)
                } else {
                    (from - 4, from - 1)
                };
                let rook = test_board[rook_from];
                test_board[rook_from] = EMPTY;
                test_board[rook_to] = rook;
            } else if !is_valid_move(board, from, to, piece_type, color, game) {
                continue;
            }

            // After the move, check if own king is in check
            let king_pos = find_king(&test_board, color);
            let opponent_color = if color == WHITE { BLACK } else { WHITE };
            if !is_square_attacked(&test_board, king_pos, opponent_color) {
                return true;
            }
        }
    }
    false
}

fn is_valid_castling(board: &[u8; 64], from: usize, to: usize, color: u8, game: &GameAccount) -> bool {
    // King must not have moved
    if game.has_king_moved { return false; }

    let is_kingside = to > from;

    // Check if rook has moved
    if is_kingside {
        if color == WHITE && game.has_white_kingside_rook_moved { return false; }
        if color == BLACK && game.has_black_kingside_rook_moved { return false; }
    } else {
        if color == WHITE && game.has_white_queenside_rook_moved { return false; }
        if color == BLACK && game.has_black_queenside_rook_moved { return false; }
    }

    // Check rook is present
    let rook_idx = if is_kingside { from + 3 } else { from - 4 };
    let rook = color | ROOK;
    if board[rook_idx] != rook { return false; }

    // Check squares between king and rook are empty
    if is_kingside {
        for i in (from + 1)..rook_idx {
            if board[i] != EMPTY { return false; }
        }
    } else {
        for i in (rook_idx + 1)..from {
            if board[i] != EMPTY { return false; }
        }
    }

    // King must not be in check
    let opponent_color = if color == WHITE { BLACK } else { WHITE };
    if is_square_attacked(board, from, opponent_color) { return false; }

    // King must not pass through or land on attacked square
    let step = if is_kingside { 1 } else { -1 };
    let mut check_sq = from as i8;
    for _ in 0..2 {
        check_sq += step;
        if is_square_attacked(board, check_sq as usize, opponent_color) {
            return false;
        }
    }

    true
}

fn is_valid_move(board: &[u8; 64], from: usize, to: usize, ptype: u8, color: u8, game: &GameAccount) -> bool {
    let from_r = (from / 8) as i8;
    let from_c = (from % 8) as i8;
    let to_r = (to / 8) as i8;
    let to_c = (to % 8) as i8;
    
    let dr = to_r - from_r;
    let dc = to_c - from_c;

    match ptype {
        PAWN => {
            let dir: i8 = if color == WHITE { 1 } else { -1 };
            let start_row: i8 = if color == WHITE { 1 } else { 6 };
            
            // Forward move
            if dc == 0 {
                if dr == dir && board[to] == EMPTY {
                    return true;
                }
                if dr == 2 * dir && from_r == start_row && board[to] == EMPTY && board[(from as i8 + dir * 8) as usize] == EMPTY {
                    return true;
                }
            } else if dc.abs() == 1 && dr == dir {
                // Diagonal capture
                if board[to] != EMPTY {
                    return true;
                }
                // En passant
                if game.en_passant_square == Some(to as u8) {
                    return true;
                }
            }
            false
        },
        KNIGHT => {
            (dr.abs() == 2 && dc.abs() == 1) || (dr.abs() == 1 && dc.abs() == 2)
        },
        BISHOP => {
            if dr.abs() != dc.abs() { return false; }
            is_path_clear(board, from_r, from_c, to_r, to_c)
        },
        ROOK => {
            if dr != 0 && dc != 0 { return false; }
            is_path_clear(board, from_r, from_c, to_r, to_c)
        },
        QUEEN => {
            if dr != 0 && dc != 0 && dr.abs() != dc.abs() { return false; }
            is_path_clear(board, from_r, from_c, to_r, to_c)
        },
        KING => {
            dr.abs() <= 1 && dc.abs() <= 1
        },
        _ => false,
    }
}

fn is_path_clear(board: &[u8; 64], r1: i8, c1: i8, r2: i8, c2: i8) -> bool {
    let dr = (r2 - r1).signum();
    let dc = (c2 - c1).signum();
    let mut rr = r1 + dr;
    let mut cc = c1 + dc;
    while rr != r2 || cc != c2 {
        if board[(rr * 8 + cc) as usize] != EMPTY {
            return false;
        }
        rr += dr;
        cc += dc;
    }
    true
}
