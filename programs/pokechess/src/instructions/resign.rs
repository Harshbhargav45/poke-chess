use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokeChessError;

#[derive(Accounts)]
pub struct Resign<'info> {
    #[account(
        mut,
        seeds = [b"game", game.host.as_ref()],
        bump = game.game_bump
    )]
    pub game: Account<'info, GameAccount>,
    pub player: Signer<'info>,
}

pub fn resign(ctx: Context<Resign>) -> Result<()> {
    let game = &mut ctx.accounts.game;

    require!(
        matches!(game.status, GameStatus::Active | GameStatus::InCheck),
        PokeChessError::CannotResign
    );

    let player_key = ctx.accounts.player.key();

    let is_host = player_key == game.host;
    let is_joiner = game.joiner.map_or(false, |j| j == player_key);

    require!(is_host || is_joiner, PokeChessError::Unauthorized);

    let winner = if is_host { game.joiner } else { Some(game.host) };
    game.winner = winner;
    game.status = GameStatus::Finished;

    Ok(())
}
