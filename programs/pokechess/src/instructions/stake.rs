use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::*;

#[derive(Accounts)]
pub struct StakeHost<'info> {
    #[account(mut, has_one = host)]
    pub game: Account<'info, GameAccount>,
    /// CHECK: Vault PDA
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    #[account(mut)]
    pub host: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn stake_host(ctx: Context<StakeHost>) -> Result<()> {
    let amount = ctx.accounts.game.stake_amount;

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.host.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        amount,
    )?;

    ctx.accounts.game.status = GameStatus::WaitingForJoiner;
    Ok(())
}

#[derive(Accounts)]
pub struct JoinAndStake<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccount>,
    /// CHECK: Vault PDA
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    #[account(mut)]
    pub joiner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn join_and_stake(ctx: Context<JoinAndStake>) -> Result<()> {
    let amount = ctx.accounts.game.stake_amount;

    ctx.accounts.game.joiner = Some(ctx.accounts.joiner.key());

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.joiner.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        amount,
    )?;

    ctx.accounts.game.status = GameStatus::Active;
    Ok(())
}
