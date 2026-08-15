use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameStatus {
    WaitingForHostStake,
    WaitingForJoiner,
    Active,
    InCheck,
    Finished,
    Claimed,
    Cancelled,
    Draw,
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
    pub is_delegated: bool,

    // Chess rule state
    pub has_king_moved: bool,
    pub has_white_kingside_rook_moved: bool,
    pub has_white_queenside_rook_moved: bool,
    pub has_black_kingside_rook_moved: bool,
    pub has_black_queenside_rook_moved: bool,
    pub en_passant_square: Option<u8>,
    pub last_move_from: Option<u8>,
    pub last_move_to: Option<u8>,

    // Time control state
    pub last_move_timestamp: i64,
    pub move_time_limit: i64,
}

impl GameAccount {
    pub const SIZE: usize =
        8 + 32 + (1 + 32) + (1 + 32) + 64 + 32 + 1 + 8 + 1 + 1 + 1
        + 1 + 1 + 1 + 1 + 1 + (1 + 1) + (1 + 1) + (1 + 1)
        + 8 + 8;
}

#[account]
pub struct VaultAccount {
    pub game: Pubkey,
    pub bump: u8,
}

impl VaultAccount {
    pub const SIZE: usize = 8 + 32 + 1;
}
