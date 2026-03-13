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

pub fn make_move(ctx: Context<MakeMove>, from: u8, to: u8) -> Result<()> {
    let game = &mut ctx.accounts.game;

    require!(game.status == GameStatus::Active, PokeChessError::GameNotActive);
    require!(game.joiner.is_some(), PokeChessError::InvalidJoinPhase);
    require!(game.turn == ctx.accounts.player.key(), PokeChessError::NotYourTurn);

    let from_idx = from as usize;
    let to_idx = to as usize;
    require!(from_idx < BOARD_SIZE && to_idx < BOARD_SIZE, PokeChessError::InvalidIndex);
    require!(from_idx != to_idx, PokeChessError::InvalidMove);

    let piece = game.board[from_idx];
    require!(piece != EMPTY, PokeChessError::InvalidMove);

    let piece_color = piece & 24; // 8 = WHITE, 16 = BLACK
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

    require!(is_valid_move(&game.board, from_idx, to_idx, piece_type, piece_color), PokeChessError::InvalidMove);

    game.board[from_idx] = EMPTY;
    game.board[to_idx] = piece;

    if destination_piece == BLACK_KING || destination_piece == WHITE_KING {
        game.status = GameStatus::Finished;
        game.winner = Some(ctx.accounts.player.key());
    }

    if let Some(j) = game.joiner {
        game.turn = if game.turn == game.host { j } else { game.host };
    }

    Ok(())
}

fn is_valid_move(board: &[u8; 64], from: usize, to: usize, ptype: u8, color: u8) -> bool {
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
