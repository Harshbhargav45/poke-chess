use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct ClaimReward<'info> {
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
    pub winner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    let game = &ctx.accounts.game;

    require!(game.status == GameStatus::Finished, PokeChessError::GameNotFinished);
    require!(Some(ctx.accounts.winner.key()) == game.winner, PokeChessError::Unauthorized);

    let vault_info = ctx.accounts.vault.to_account_info();

    let amount = **vault_info.lamports.borrow();

    let game_key = ctx.accounts.game.key();
    let vault_bump = ctx.accounts.game.vault_bump;
    let seeds = &[
        b"vault",
        game_key.as_ref(),
        &[vault_bump],
    ];
    let signer_seeds = &[&seeds[..]];

    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: vault_info.clone(),
                to: ctx.accounts.winner.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}
