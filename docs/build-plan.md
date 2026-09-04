# Build plan — Sept 4 → Sept 17 (23:59 CET deadline)

Starting point: no API key, no funded wallet yet. 13 days.

## Day 0–1: access & verification
- Apply for Brickken API key (Dapp API) and confirm Agentic API / MCP / CLI access.
- Read `docs.brickken.com` directly (blocked from the scaffolding sandbox — do this from a normal browser) and reconcile every method name/payload in `src/brickken/` against it. Update the "Open verification items" list in `docs/architecture.md` as each is confirmed.
- Generate the operational wallet (`scripts/setup-wallet.ts`), fund with Sepolia ETH from a public faucet for gas.
- Get whatever USDC/EURC testnet balance is needed to perform the x402 payment (check if Brickken provides a starter faucet for this, or use a public Sepolia USDC faucet).

## Day 2–3: self-funding + identity
- Get the x402 "pay 0.01 USDC → mint 100 BKN" flow working end to end (`scripts/fund-via-x402.ts`). This is the single most distinctive, verifiable transaction in the whole submission — don't leave it for later.
- Register the Issuer Agent's ERC-8004 identity.
- Checkpoint: two real, linkable Sepolia tx hashes (payment + mint) plus one identity-registration tx.

## Day 4–7: issuer lifecycle
- `newTokenization` for the revenue-share asset.
- `newSto`, whitelist a handful of test investors, `mintToken` allocations.
- First `dividendDistribution` round run directly by the Issuer Agent (before any delegation exists) to prove the base flow works — expect to hit the `approve` allowance quirk and the response-shape inconsistencies other participants reported; log every one of them into `known-issues.md` as they're hit, with the exact request/response.
- Checkpoint: full issuer lifecycle proven with real tx hashes, matching or exceeding what other API-track submissions already show.

## Day 8–10: RAMS delegation (the risky, novel part — start early)
- Grant the Ops Agent a mandate scoped to `dividendDistribution` with a cap below the full treasury/dividend pool.
- Grant the Compliance Agent a mandate scoped to freeze/revoke only.
- Build the trigger engine (`src/rules/`) and wire a real (if simple) external signal into it.
- Run a second dividend round *through* the Ops Agent under its mandate — this is the one Tixken's public submission explicitly could not confirm live; getting this working is the core differentiator.
- Deliberately attempt one out-of-mandate action per subordinate agent and capture the on-chain/contract-level rejection, not just an app-level check.
- Checkpoint: full mandate lifecycle (grant → execute-in-scope → attempted-out-of-scope-rejected → revoke) with real tx hashes for each step.

## Day 11–12: polish
- Small live dashboard pulling real Sepolia state (Etherscan API or direct RPC reads) rather than a static replay — differentiate from the "replay" pattern other teams already used.
- Finish `known-issues.md`.
- Repo README pass: make sure a reviewer can clone and understand the story in under two minutes without watching the video first.

## Day 13: submission
- 2–3 minute demo video: self-funding → identity → issuer lifecycle (fast-forwarded) → mandate grant → autonomous compliance trigger → rejected out-of-scope attempt → revoke.
- Submission form, reward wallet address, AI disclosure section (see README).
- Buffer built in for sandbox flakiness — the programme's own Discord thread shows real, multi-hour turnarounds on some backend fixes, so don't plan the final integration step for the last day.
