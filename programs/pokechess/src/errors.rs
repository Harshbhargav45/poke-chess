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
    #[msg("Game cannot be cancelled in current state")]
    CannotCancel,
    #[msg("Only the host can cancel")]
    NotHost,
    #[msg("Game cannot be resigned in current state")]
    CannotResign,
    #[msg("Game already claimed or closed")]
    GameAlreadyClaimed,
    #[msg("No winner to claim")]
    NoWinner,
    #[msg("Stake amount too low (minimum 0.01 SOL)")]
    StakeTooLow,
    #[msg("Stake amount too high (maximum 100 SOL)")]
    StakeTooHigh,
}
