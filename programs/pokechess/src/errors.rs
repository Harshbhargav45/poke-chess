use anchor_lang::prelude::*;

#[error_code]
pub enum PokeChessError {
    #[msg("Game not active")]
    GameNotActive,
    #[msg("Not your turn")]
    NotYourTurn,
    #[msg("Invalid move")]
    InvalidMove,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Game not finished")]
    GameNotFinished,
}
