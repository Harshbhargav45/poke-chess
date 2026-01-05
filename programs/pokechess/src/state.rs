use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameStatus {
    WaitingForHostStake,
    WaitingForJoiner,
    Active,
    Finished,
}

#[account]
pub struct GameAccount {
    pub host: Pubkey,
    pub joiner: Option<Pubkey>,
    pub winner: Option<Pubkey>,

    pub board: [u8; 64],
    pub turn: Pubkey,
    pub status: GameStatus,

    pub stake_amount: u64,
    pub game_bump: u8,
    pub vault_bump: u8,
}

impl GameAccount {
    pub const SIZE: usize =
        8 + 32 + (1 + 32) + (1 + 32) + 64 + 32 + 1 + 8 + 1 + 1;
}

#[account]
pub struct VaultAccount {
    pub game: Pubkey,
    pub bump: u8,
}

impl VaultAccount {
    pub const SIZE: usize = 8 + 32 + 1;
}
