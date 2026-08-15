use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::*;
use crate::errors::PokeChessError;

#[derive(Accounts)]
pub struct CancelGame<'info> {
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

pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()> {
    let game = &ctx.accounts.game;

    require!(
        matches!(
            game.status,
            GameStatus::WaitingForHostStake | GameStatus::WaitingForJoiner
        ),
        PokeChessError::CannotCancel
    );

    let vault_info = ctx.accounts.vault.to_account_info();
    let vault_lamports = **vault_info.lamports.borrow();

    if vault_lamports > 0 {
        let game_key = game.key();
        let vault_bump = game.vault_bump;
        let seeds = &[
            b"vault",
            game_key.as_ref(),
            &[vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: vault_info.clone(),
                    to: ctx.accounts.host.to_account_info(),
                },
                signer_seeds,
            ),
            vault_lamports,
        )?;
    }

    let game = &mut ctx.accounts.game;
    game.status = GameStatus::Cancelled;

    Ok(())
}
