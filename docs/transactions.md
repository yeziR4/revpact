# Confirmed transactions log

Real, verifiable transactions produced by this build. Chain: Ethereum Sepolia unless noted. All confirmed via both Brickken's `get-transaction-status` and a direct `eth_getTransactionReceipt` read against a public Sepolia RPC.

| # | Step | Method | Tx hash | Notes |
|---|------|--------|---------|-------|
| 1 | Tokenize the revenue-share asset | `newTokenization` | [`0xb764cd03f8590ad5381a4223e715c4b50201f0a2345a511eed8940bf84a79b45`](https://sepolia.etherscan.io/tx/0xb764cd03f8590ad5381a4223e715c4b50201f0a2345a511eed8940bf84a79b45) | Symbol `RVP1`, "RevPact Revenue Share". Token contract: `0x14c0f58b4131dbcc95c6ef61683008db67ab3db9` |
| 2 | Whitelist test investor | `whitelist` | [`0x71e0dfd6f02073d81999fe2b25447d95c41459270057c19ded6857dd5bc0f1e3`](https://sepolia.etherscan.io/tx/0x71e0dfd6f02073d81999fe2b25447d95c41459270057c19ded6857dd5bc0f1e3) | Investor `0x2096885bc90612ad5Db2CB9e5F07340B406D45D9` |
| 3 | Mint 500 RVP1 to investor | `mintToken` | [`0x7e9bf59ffb887ac31efc275a7ab581938fcd08da17b13aa740d45675703736c6`](https://sepolia.etherscan.io/tx/0x7e9bf59ffb887ac31efc275a7ab581938fcd08da17b13aa740d45675703736c6) | |
| 4 | BKN faucet claim | `POST /faucet/bkn` | [`0x26c16c3827c5b44d4a13a4ab6e8395e77af7ddbcafc1ecf74ba419bac298359a`](https://sepolia.etherscan.io/tx/0x26c16c3827c5b44d4a13a4ab6e8395e77af7ddbcafc1ecf74ba419bac298359a) | 100 BKN to issuer wallet. **Paid via `x-api-key`, not yet the x402 flow** — the x402-paid version (0.01 USDC → 100 BKN, genuinely agent-paid) needs Base Sepolia funding first; see known-issues.md / build-plan.md for the plan to redo this leg properly. |
| 5 | Launch STO | `newSto` | [`0xf140ee34eb1ac047e5f1292334075fe83eaff2043c01034604382ec8b928cb13`](https://sepolia.etherscan.io/tx/0xf140ee34eb1ac047e5f1292334075fe83eaff2043c01034604382ec8b928cb13) | "RVP1 Genesis Offering", 500 RVP1 offered, soft cap 10 USDT / hard cap 500 USDT, ~15 min window. No investor has funded USDT yet, so this will finalize into rollback unless that's resolved before `endDate` — a legitimate part of the lifecycle either way. |
| 6 | Register `transferFrom` action on our RAMS executor | `ramsSetExecutorAction` | [`0xf07cb7e83493346da3187c9a5c438d6973af9c37c4042954cef2f9b870d10412`](https://sepolia.etherscan.io/tx/0xf07cb7e83493346da3187c9a5c438d6973af9c37c4042954cef2f9b870d10412) | Executor `0xE9832b090fBaEe59Bb26F2394448cfF49a6B87D7`, selector `0x23b872dd`, `hasAmount: true`, `amountIndex: 2`. |
| 7 | Close the STO | `closeOffer` | [`0x7a45bc7d90b31e921ab34ece9583c7c82eca5e7f83e71a2238801aae3d53e41e`](https://sepolia.etherscan.io/tx/0x7a45bc7d90b31e921ab34ece9583c7c82eca5e7f83e71a2238801aae3d53e41e) | Finalized after `endDate` passed with nobody invested — resolves into **rollback** (soft cap of 10 USDT not reached). Honest demonstration of the rollback path, not a failure: `claimTokens` would now refund any investor, and none exist here. |
| 8 | Grant the Ops Agent's RAMS mandate | `ramsGrantMandate` | [`0x782b6cee8e3125dc55cd846d8df8a5536bf292fc85ec479b730fd8af85b44adc`](https://sepolia.etherscan.io/tx/0x782b6cee8e3125dc55cd846d8df8a5536bf292fc85ec479b730fd8af85b44adc) | **The differentiator.** Agent `0x5F7d…8B3dC`, scoped to `transferFrom` on USDT, capped at 50 USDT/tx and 100 USDT cumulative. |
| 9 | Approve the Compliance Agent as RAMS operator | `ramsSetOperator` | [`0xda86ce2383536b248a7b2d3484d457de743e95073c100a1e44b1e3aa29b99f35`](https://sepolia.etherscan.io/tx/0xda86ce2383536b248a7b2d3484d457de743e95073c100a1e44b1e3aa29b99f35) | Operator `0x0F19…96D85` can now call `revokeMandate` on the Ops Agent's mandate directly — no payout or mint authority of its own. |
| 10 | Approve the RAMS executor on USDT | `approve` | [`0xda81cfd1f2a31825f5d657eab630647d2bc97d2ed30b0b626c6a82983708866b`](https://sepolia.etherscan.io/tx/0xda81cfd1f2a31825f5d657eab630647d2bc97d2ed30b0b626c6a82983708866b) | 100 USDT allowance from issuer to executor `0xE983…a6B87D7` — RAMS sits on top of the ERC-20 allowance, doesn't replace it. Actual `execute` still needs both this **and** real USDT balance (still 0, pending Brickken funding) **and** Ops wallet gas (pending funding). |

### RAMS `can-execute` dry run — the mandate enforcing its own cap, on-chain

Not a transaction — a read against the live `AgentMandate` contract's own logic, run immediately after the mandate above was granted:

```
GET /rams/can-execute  agent=Ops  amount=25 USDT   -> allowed: true  (withinTransactionCap: true, withinCumulativeCap: true)
GET /rams/can-execute  agent=Ops  amount=999 USDT  -> allowed: false (withinTransactionCap: false, withinCumulativeCap: false)
```
Full responses: `docs/evidence/rams-can-execute-within-cap.json`, `docs/evidence/rams-can-execute-over-cap.json`. This is the contract itself refusing the over-cap request, not an application-side check.

### The full mandate lifecycle, closed end to end (2026-09-10)

Brickken swapped in a working executor (`0xF626e5840c888a5E395f42F2dcC24F58EAb8b65b`, replacing one with a server-side bug — see `known-issues.md`). Re-registered the action and re-approved it, then ran the complete sequence:

| # | Step | Method | Result | Tx hash |
|---|------|--------|--------|---------|
| 11 | Register `transferFrom` on the new executor | `ramsSetExecutorAction` | confirmed | [`0x0b8fa2554b...`](https://sepolia.etherscan.io/tx/0x0b8fa2554b8dbcc8bd635c3f864018359a3d10bae165f91ba4a3315f0f0b3f09) |
| 12 | Approve the new executor on USDT | `approve` | confirmed | [`0xbd455969ee...`](https://sepolia.etherscan.io/tx/0xbd455969ee07c140ee39d84c47f840a2ce133009db1619dd0a093a5151040119) |
| 13 | Ops Agent executes a within-cap transfer (25 USDT) | `ramsExecute` | **mandate authorized it** — broadcast, reached the real ERC-20 `transferFrom`, reverted only on 0 balance (`status: 0x0`, no `Transfer` log) | [`0x0482f0ba6b...`](https://sepolia.etherscan.io/tx/0x0482f0ba6bb68e9efe69cbea5d5283ac700a91783d5802789e6ccd4917bfce61) |
| 14 | Ops Agent attempts an over-cap transfer (999 USDT) | `ramsExecute` | **rejected before broadcast** — `400: "mandate does not allow this execution: withinTransactionCap, withinCumulativeCap"` | no tx (rejected at prepare — no gas spent) |
| 15 | Compliance Agent revokes the Ops Agent's mandate | `ramsRevokeMandate` | confirmed, signed by the Compliance Agent as approved operator | [`0xbf395482...`](https://sepolia.etherscan.io/tx/0xbf3954829cc94549bbbe970d7613e5d0ec32200b7bccea4adafd3e231dbfef36) |
| 16 | Ops Agent attempts the same within-cap transfer again | `ramsExecute` | **rejected** — `400: "mandate does not allow this execution: notRevoked"` | no tx (rejected at prepare) |

Step 13 matters as much as the successful cases: it proves the mandate genuinely *authorizes* in-scope calls (it doesn't block what it shouldn't). Steps 14 and 16 are the two "does the boundary actually hold" proof points: over-cap and post-revoke, both refused by the mandate contract itself, both for a different, correctly-identified reason (`withinTransactionCap`/`withinCumulativeCap` vs. `notRevoked`).

### The real payout (2026-09-10)

Test USDT turned out to be self-serviceable the whole time — see `known-issues.md` for the honest correction (our bug, not Brickken's: a hand-typed calldata argument was two bytes short, which we misread as an access-control revert). Once that was fixed, minted real USDT and ran an actual value-moving payout under a fresh mandate:

| # | Step | Method | Result | Tx hash |
|---|------|--------|--------|---------|
| 17 | Mint 100 USDT to the issuer wallet | `mint` (direct contract call, `scripts/mint-usdt.mjs`) | confirmed | [`0x2184eb6a89...`](https://sepolia.etherscan.io/tx/0x2184eb6a893b23893f8254e88ccfa72859c8d1b36a7c8db04ad996460304afa8) |
| 18 | Grant a fresh mandate to the Ops Agent | `ramsGrantMandate` | confirmed (the original mandate stayed revoked from step 15 — this is a new one, same terms) | [`0x6e24c2be46...`](https://sepolia.etherscan.io/tx/0x6e24c2be46b5d074ec79462dff5737695b2974718f22d8668b4367aa842ee42c) |
| 19 | **Ops Agent executes a real 25 USDT payout** | `ramsExecute` | confirmed — investor's USDT balance: 0 → 25. Issuer's: 100 → 75. | [`0x16a5feea44...`](https://sepolia.etherscan.io/tx/0x16a5feea44019fd948a2e4ad2d7be30fa06f2f44f09d3df6d20359808b9d3cac) |

This is the complete loop: a bounded agent moving real value it was never trusted with unilaterally, under a rule enforced by a contract, verified by the recipient's balance actually changing — not just an authorization that would have worked if funded.

## Pending on funding / access

- **Dividend distribution**: blocked — issuer wallet holds 0 test USDT (the sandbox's configured payment token) and its `mint()` is access-controlled (reverts for us). Needs Brickken to fund the issuer wallet with test USDT, or point us at a supported faucet.
- **ERC-8004 registration / RAMS**: blocked — needs Base Sepolia funding (ETH for client-signed gas, or USDC for an x402/relayed send) in the issuer wallet, and a RAMS `identityRef` + dedicated executor from Brickken (shared-sandbox compliance provider is admin-only).

## Reproducing any of the above

Every step above was run with `scripts/tx.mjs <method> <payload.json> <PRIVATE_KEY_ENV_VAR> --wait` against the real sandbox — see that script for the exact prepare → sign → send → poll flow.
