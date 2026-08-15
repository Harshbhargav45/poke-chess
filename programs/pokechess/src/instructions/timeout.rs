use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokeChessError;

#[derive(Accounts)]
pub struct ClaimTimeout<'info> {
    #[account(
        mut,
        seeds = [b"game", game.host.as_ref()],
        bump = game.game_bump
    )]
    pub game: Account<'info, GameAccount>,
    pub player: Signer<'info>,
}

pub fn claim_timeout(ctx: Context<ClaimTimeout>) -> Result<()> {
    let game = &mut ctx.accounts.game;

    require!(
        matches!(game.status, GameStatus::Active | GameStatus::InCheck),
        PokeChessError::GameNotActive
    );

    let player_key = ctx.accounts.player.key();
    let is_host = player_key == game.host;
    let is_joiner = game.joiner.map_or(false, |j| j == player_key);
    require!(is_host || is_joiner, PokeChessError::Unauthorized);

    // Check that it's the opponent's turn (player is claiming opponent timed out)
    require!(game.turn != player_key, PokeChessError::NotYourTurn);

    // Check that there's a valid timestamp
    require!(game.last_move_timestamp > 0, PokeChessError::GameNotActive);

    let clock = Clock::get()?;
    let elapsed = clock.unix_timestamp - game.last_move_timestamp;

    require!(elapsed >= game.move_time_limit, PokeChessError::GameNotActive);

    // Player wins by timeout
    game.winner = Some(player_key);
    game.status = GameStatus::Finished;

    Ok(())
}
