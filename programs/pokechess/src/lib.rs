use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod constants;
pub mod instructions;

use instructions::*;

declare_id!("B9eHwbDVX9KJp1Cwd4VUygPdtHNkUzfbdREJkywtTpzZ")
;

#[program]
pub mod pokechess {
    use super::*;

    pub fn create_game(ctx: Context<CreateGame>, stake_amount: u64) -> Result<()> {
        create_game::handler(ctx, stake_amount)
    }

    pub fn stake_host(ctx: Context<StakeHost>) -> Result<()> {
        stake::stake_host(ctx)
    }

    pub fn join_and_stake(ctx: Context<JoinAndStake>) -> Result<()> {
        stake::join_and_stake(ctx)
    }

    pub fn make_move(ctx: Context<MakeMove>, from: u8, to: u8) -> Result<()> {
        gameplay::make_move(ctx, from, to)
    }

    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        claim::claim_reward(ctx)
    }
}
