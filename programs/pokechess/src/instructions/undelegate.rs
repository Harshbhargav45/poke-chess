use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokeChessError;

#[derive(Accounts)]
pub struct UndelegateGame<'info> {
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

    /// CHECK: Buffer PDA
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

pub fn undelegate_game(ctx: Context<UndelegateGame>) -> Result<()> {
    let game = &ctx.accounts.game;

    require!(game.is_delegated, PokeChessError::CannotCancel);

    msg!("Game undelegated from ER - state committed back to base layer");

    let game = &mut ctx.accounts.game;
    game.is_delegated = false;

    Ok(())
}
