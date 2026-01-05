use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccount>,
    pub player: Signer<'info>,
}

pub fn make_move(ctx: Context<MakeMove>, from: u8, to: u8) -> Result<()> {
    let game = &mut ctx.accounts.game;

    require!(game.status == GameStatus::Active, PokeChessError::GameNotActive);
    require!(game.turn == ctx.accounts.player.key(), PokeChessError::NotYourTurn);

    let piece = game.board[from as usize];
    require!(piece != EMPTY, PokeChessError::InvalidMove);

    game.board[from as usize] = EMPTY;
    game.board[to as usize] = piece;

    if piece == WHITE_SNORLAX || piece == BLACK_SNORLAX {
        game.status = GameStatus::Finished;
        game.winner = Some(ctx.accounts.player.key());
    }

    if let Some(j) = game.joiner {
        game.turn = if game.turn == game.host { j } else { game.host };
    }

    Ok(())
}
