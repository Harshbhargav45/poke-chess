use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::*;
use crate::errors::PokeChessError;

declare_id!("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

#[derive(Accounts)]
pub struct DelegateGame<'info> {
    #[account(
        mut,
        has_one = host,
        seeds = [b"game", host.key().as_ref()],
        bump = game.game_bump
    )]
    pub game: Account<'info, GameAccount>,

    #[account(mut)]
    pub host: Signer<'info>,

    /// CHECK: Delegation program
    #[account(address = crate::delegate::ID)]
    pub delegation_program: AccountInfo<'info>,

    /// CHECK: Buffer PDA for delegation
    #[account(
        mut,
        seeds = [b"buffer", game.key().as_ref()],
        bump
    )]
    pub buffer_pda: AccountInfo<'info>,

    /// CHECK: Delegation record PDA
    #[account(
        mut,
        seeds = [b"delegation_record", game.key().as_ref()],
        bump
    )]
    pub delegation_record_pda: AccountInfo<'info>,

    /// CHECK: Delegation metadata PDA
    #[account(
        mut,
        seeds = [b"delegation_metadata", game.key().as_ref()],
        bump
    )]
    pub delegation_metadata_pda: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn delegate_game(ctx: Context<DelegateGame>) -> Result<()> {
    let game = &ctx.accounts.game;

    require!(
        matches!(
            game.status,
            GameStatus::WaitingForJoiner | GameStatus::Active | GameStatus::InCheck
        ),
        PokeChessError::CannotCancel
    );

    let game_info = ctx.accounts.game.to_account_info();
    let game_lamports = **game_info.lamports.borrow();
    let game_data_len = game_info.data_len();

    let rent = Rent::get()?;
    let min_rent = rent.minimum_balance(game_data_len);

    if game_lamports < min_rent {
        let deficit = min_rent - game_lamports;
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.host.to_account_info(),
                    to: game_info.clone(),
                },
            ),
            deficit,
        )?;
    }

    msg!("Game delegated to ER - account ready for ephemeral rollup transactions");

    let game = &mut ctx.accounts.game;
    game.is_delegated = true;

    Ok(())
}
