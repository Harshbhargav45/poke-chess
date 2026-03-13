use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(stake_amount: u64)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = host,
        space = GameAccount::SIZE,
        seeds = [b"game", host.key().as_ref()],
        bump
    )]
    pub game: Account<'info, GameAccount>,

    #[account(
        init,
        payer = host,
        space = VaultAccount::SIZE,
        seeds = [b"vault", game.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub host: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateGame>, stake_amount: u64) -> Result<()> {
    let game = &mut ctx.accounts.game;

    game.host = ctx.accounts.host.key();
    game.joiner = None;
    game.winner = None;

    let mut board = [EMPTY; 64];

    board[0] = WHITE_ROOK; board[1] = WHITE_KNIGHT; board[2] = WHITE_BISHOP; board[3] = WHITE_QUEEN;
    board[4] = WHITE_KING; board[5] = WHITE_BISHOP; board[6] = WHITE_KNIGHT; board[7] = WHITE_ROOK;
    for i in 8..16 { board[i] = WHITE_PAWN; }

    for i in 48..56 { board[i] = BLACK_PAWN; }
    board[56] = BLACK_ROOK; board[57] = BLACK_KNIGHT; board[58] = BLACK_BISHOP; board[59] = BLACK_QUEEN;
    board[60] = BLACK_KING; board[61] = BLACK_BISHOP; board[62] = BLACK_KNIGHT; board[63] = BLACK_ROOK;

    game.board = board;

    game.turn = game.host;
    game.status = GameStatus::WaitingForHostStake;
    game.stake_amount = stake_amount;
    game.game_bump = ctx.bumps.game;
    game.vault_bump = ctx.bumps.vault;

    ctx.accounts.vault.game = game.key();
    ctx.accounts.vault.bump = game.vault_bump;

    Ok(())
}
