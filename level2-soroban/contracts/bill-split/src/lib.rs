#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Map, Symbol};

const SPLITS: Symbol = symbol_short!("splits");

#[contract]
pub struct BillSplitContract;

#[contractimpl]
impl BillSplitContract {
    pub fn record_split(
        env: Env,
        payer: Address,
        recipient: Address,
        amount: i128,
    ) {
        payer.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let mut splits: Map<Address, i128> = env.storage().persistent().get(&SPLITS).unwrap_or(Map::new(&env));
        let current = splits.get(recipient.clone()).unwrap_or(0);
        splits.set(recipient.clone(), current + amount);
        env.storage().persistent().set(&SPLITS, &splits);
        env.events().publish((symbol_short!("split"), payer, recipient), amount);
    }

    pub fn total_for(env: Env, recipient: Address) -> i128 {
        let splits: Map<Address, i128> = env.storage().persistent().get(&SPLITS).unwrap_or(Map::new(&env));
        splits.get(recipient).unwrap_or(0)
    }
}
