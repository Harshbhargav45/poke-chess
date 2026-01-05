use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccount>,
    #[account(mut)]
    pub vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub winner: Signer<'info>,
}

pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    let game = &ctx.accounts.game;

    require!(game.status == GameStatus::Finished, PokeChessError::GameNotFinished);
    require!(Some(ctx.accounts.winner.key()) == game.winner, PokeChessError::Unauthorized);

    let vault_info = ctx.accounts.vault.to_account_info();
    let winner_info = ctx.accounts.winner.to_account_info();

    let amount = **vault_info.lamports.borrow();

    **vault_info.try_borrow_mut_lamports()? -= amount;
    **winner_info.try_borrow_mut_lamports()? += amount;

    Ok(())
}
