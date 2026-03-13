pub const EMPTY: u8 = 0;

pub const PAWN: u8 = 1;
pub const KNIGHT: u8 = 2;
pub const BISHOP: u8 = 3;
pub const ROOK: u8 = 4;
pub const QUEEN: u8 = 5;
pub const KING: u8 = 6;

pub const WHITE: u8 = 8;
pub const BLACK: u8 = 16;

pub const WHITE_PAWN: u8 = WHITE | PAWN;
pub const WHITE_KNIGHT: u8 = WHITE | KNIGHT;
pub const WHITE_BISHOP: u8 = WHITE | BISHOP;
pub const WHITE_ROOK: u8 = WHITE | ROOK;
pub const WHITE_QUEEN: u8 = WHITE | QUEEN;
pub const WHITE_KING: u8 = WHITE | KING;

pub const BLACK_PAWN: u8 = BLACK | PAWN;
pub const BLACK_KNIGHT: u8 = BLACK | KNIGHT;
pub const BLACK_BISHOP: u8 = BLACK | BISHOP;
pub const BLACK_ROOK: u8 = BLACK | ROOK;
pub const BLACK_QUEEN: u8 = BLACK | QUEEN;
pub const BLACK_KING: u8 = BLACK | KING;

pub const BOARD_SIZE: usize = 64;
