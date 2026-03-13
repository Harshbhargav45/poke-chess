use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::*;
use crate::errors::PokeChessError;

#[derive(Accounts)]
pub struct StakeHost<'info> {
    #[account(
        mut,
        has_one = host,
        seeds = [b"game", host.key().as_ref()],
        bump = game.game_bump
    )]
    pub game: Account<'info, GameAccount>,
    #[account(
        mut,
        seeds = [b"vault", game.key().as_ref()],
        bump = game.vault_bump
    )]
    pub vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub host: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn stake_host(ctx: Context<StakeHost>) -> Result<()> {
    require!(
        matches!(ctx.accounts.game.status, GameStatus::WaitingForHostStake),
        PokeChessError::InvalidHostStakePhase
    );

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
    #[account(
        mut,
        seeds = [b"game", game.host.as_ref()],
        bump = game.game_bump
    )]
    pub game: Account<'info, GameAccount>,
    #[account(
        mut,
        seeds = [b"vault", game.key().as_ref()],
        bump = game.vault_bump
    )]
    pub vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub joiner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn join_and_stake(ctx: Context<JoinAndStake>) -> Result<()> {
    require!(
        matches!(ctx.accounts.game.status, GameStatus::WaitingForJoiner),
        PokeChessError::InvalidJoinPhase
    );
    require!(ctx.accounts.game.joiner.is_none(), PokeChessError::JoinerAlreadySet);
    require!(ctx.accounts.joiner.key() != ctx.accounts.game.host, PokeChessError::JoinerIsHost);

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
