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
    #[msg("Invalid board index")]
    InvalidIndex,
    #[msg("Not your piece")]
    NotYourPiece,
    #[msg("Cannot capture own piece")]
    InvalidDestination,
    #[msg("Game already has a joiner")]
    JoinerAlreadySet,
    #[msg("Host must stake first")]
    HostStakeRequired,
    #[msg("Joiner cannot be host")]
    JoinerIsHost,
    #[msg("Game not waiting for host stake")]
    InvalidHostStakePhase,
    #[msg("Game not waiting for joiner")]
    InvalidJoinPhase,
}
