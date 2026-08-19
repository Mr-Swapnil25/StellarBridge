# StellarBridge Level 2

This is a separate Level 2 implementation. The existing root app is intentionally untouched.

## Included

- Soroban contract that records bill splits and emits a `split` event.
- Frontend client for calling `record_split` through Soroban RPC.
- Multi-wallet configuration: Freighter, Albedo, Hana, Lobstr, and xBull.
- Transaction lifecycle: building, signature request, submitted, confirmed, and failed.
- Event polling that refreshes split events every four seconds.

## Deploy on Testnet

Install Rust, `wasm32-unknown-unknown`, and the Stellar CLI first. Then from this directory:

```powershell
stellar contract build --package bill-split-contract --manifest-path contracts/bill-split/Cargo.toml
stellar keys generate level2-deployer --network testnet
stellar account fund level2-deployer --network testnet
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/bill_split_contract.wasm --source-account level2-deployer --network testnet
```

Copy the printed contract ID into the separate Level 2 frontend configuration. The deployer must be a funded testnet account; no secret key is stored in this repository.

## Client setup

```powershell
npm install
npm run typecheck
```

The root Level 1 app is not imported by this project. Deployment and an on-chain transaction are required before claiming the contract and event requirements are complete.
