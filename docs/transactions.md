# Confirmed transactions log

Real, verifiable transactions produced by this build. Chain: Ethereum Sepolia unless noted. All confirmed via both Brickken's `get-transaction-status` and a direct `eth_getTransactionReceipt` read against a public Sepolia RPC.

| # | Step | Method | Tx hash | Notes |
|---|------|--------|---------|-------|
| 1 | Tokenize the revenue-share asset | `newTokenization` | [`0xb764cd03f8590ad5381a4223e715c4b50201f0a2345a511eed8940bf84a79b45`](https://sepolia.etherscan.io/tx/0xb764cd03f8590ad5381a4223e715c4b50201f0a2345a511eed8940bf84a79b45) | Symbol `RVP1`, "RevPact Revenue Share". Token contract: `0x14c0f58b4131dbcc95c6ef61683008db67ab3db9` |
| 2 | Whitelist test investor | `whitelist` | [`0x71e0dfd6f02073d81999fe2b25447d95c41459270057c19ded6857dd5bc0f1e3`](https://sepolia.etherscan.io/tx/0x71e0dfd6f02073d81999fe2b25447d95c41459270057c19ded6857dd5bc0f1e3) | Investor `0x2096885bc90612ad5Db2CB9e5F07340B406D45D9` |
| 3 | Mint 500 RVP1 to investor | `mintToken` | [`0x7e9bf59ffb887ac31efc275a7ab581938fcd08da17b13aa740d45675703736c6`](https://sepolia.etherscan.io/tx/0x7e9bf59ffb887ac31efc275a7ab581938fcd08da17b13aa740d45675703736c6) | |
| 4 | BKN faucet claim | `POST /faucet/bkn` | [`0x26c16c3827c5b44d4a13a4ab6e8395e77af7ddbcafc1ecf74ba419bac298359a`](https://sepolia.etherscan.io/tx/0x26c16c3827c5b44d4a13a4ab6e8395e77af7ddbcafc1ecf74ba419bac298359a) | 100 BKN to issuer wallet. **Paid via `x-api-key`, not yet the x402 flow** — the x402-paid version (0.01 USDC → 100 BKN, genuinely agent-paid) needs Base Sepolia funding first; see known-issues.md / build-plan.md for the plan to redo this leg properly. |

## Pending on funding / access

- **Dividend distribution**: blocked — issuer wallet holds 0 test USDT (the sandbox's configured payment token) and its `mint()` is access-controlled (reverts for us). Needs Brickken to fund the issuer wallet with test USDT, or point us at a supported faucet.
- **ERC-8004 registration / RAMS**: blocked — needs Base Sepolia funding (ETH for client-signed gas, or USDC for an x402/relayed send) in the issuer wallet, and a RAMS `identityRef` + dedicated executor from Brickken (shared-sandbox compliance provider is admin-only).

## Reproducing any of the above

Every step above was run with `scripts/tx.mjs <method> <payload.json> <PRIVATE_KEY_ENV_VAR> --wait` against the real sandbox — see that script for the exact prepare → sign → send → poll flow.
