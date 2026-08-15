use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokeChessError;

#[derive(Accounts)]
pub struct CloseGame<'info> {
    #[account(
        mut,
        has_one = host,
        seeds = [b"game", host.key().as_ref()],
        bump = game.game_bump,
        close = host
    )]
    pub game: Account<'info, GameAccount>,
    #[account(
        mut,
        seeds = [b"vault", game.key().as_ref()],
        bump = game.vault_bump,
        close = host
    )]
    pub vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub host: Signer<'info>,
}

pub fn close_game(ctx: Context<CloseGame>) -> Result<()> {
    let game = &ctx.accounts.game;

    require!(
        matches!(
            game.status,
            GameStatus::Claimed | GameStatus::Cancelled | GameStatus::Draw
        ),
        PokeChessError::GameAlreadyClaimed
    );

    Ok(())
}
