# Known issues

Filled in as real issues are hit against the Brickken sandbox, in the format below. This file is part of the submission — it's meant to show real integration work, not just a clean success path. (The programme's own Discord thread shows the Brickken team reads and fixes these quickly, so documenting them precisely and promptly is worth doing as you go, not retroactively.)

Watch for these, reported by other participants in the programme's Discord as of late August 2026 — confirm current status against your own sandbox account rather than assuming they're still true:

- **`approve` non-zero → non-zero allowance revert.** The mock USDT/payment-token contract used in the sandbox appears to reject `approve(spender, nonZeroAmount)` when the current allowance is already non-zero, with an empty revert. Workaround reported: `approve(spender, 0)`, wait for confirmation, then `approve(spender, newAmount)`.
- **`mintToken` treasury-mint restriction.** The API's `mintToken` method requires a valid `investorEmail` distinct from any tokenizer account email — there is reportedly no supported path to mint directly to the issuer's own treasury/company wallet as of late August 2026.
- **`mintToken` response shape.** Reported as returning `transactions` as a single object (not an array) with a separate `whitelistTx`/`txIdWhitelist` pair when whitelisting is also required, rather than a uniform array — worth defensive parsing either way.
- **Dividend "Current Holdings" read-model.** Reported as only reflecting the first mint event for an investor who received tokens purely via `mintToken` (no direct investment), understating actual balance in that specific UI view — on-chain balance and per-user detail views were reported accurate.

## Found during this build

### Sandbox mock USDT has no self-service mint

- **Method / endpoint:** direct contract call to the sandbox USDT payment token (`0x28d2B01854D0aBec267a3DDcad9163580E6E8604`, Ethereum Sepolia), not a Brickken API endpoint.
- **Date hit:** 2026-09-07.
- **Request (redacted):** simulated `mint(address,uint256)` (selector `0x40c10f19`) from the issuer wallet via `eth_call`.
- **Observed response / error:** `execution reverted` with empty revert data.
- **Root cause (if known):** the mint function is access-controlled (owner-only), as expected for a shared sandbox token — an open mint would let any participant inflate the supply.
- **Workaround used:** none yet — requested Brickken fund the issuer wallet with test USDT directly (or point us at a supported faucet) rather than trying to self-mint.
- **Reported to Brickken team:** yes, via Discord/tech@brickken.com, bundled with the RAMS setup ask — see `docs/build-plan.md`.

### `POST /faucet/bkn` can take well over the "instant" impression the docs give

- **Method / endpoint:** `POST /faucet/bkn`.
- **Date hit:** 2026-09-07.
- **Request (redacted):** `x-api-key` auth, fresh `Idempotency-Key`, our issuer wallet as `recipientAddress`.
- **Observed response / error:** first attempt timed out client-side at 20s with zero bytes received; an idempotent retry with the same key and a 60s timeout returned `202 submitted` with a real transaction hash.
- **Root cause (if known):** the endpoint can genuinely take tens of seconds when it submits the mint but returns before on-chain confirmation (`202`, per its documented behavior) — the first attempt likely just needed a longer client timeout, not a resend.
- **Workaround used:** always set a generous timeout (60s+) on this call, and retry with the *same* `Idempotency-Key` on a client-side timeout rather than assuming failure and generating a new one.
- **Reported to Brickken team:** no — this reads as expected async behavior, not a bug, so not escalated.

## Template for entries found during this build

```
### <short title>

- **Method / endpoint:** 
- **Date hit:** 
- **Request (redacted):** 
- **Observed response / error:** 
- **Root cause (if known):** 
- **Workaround used:** 
- **Reported to Brickken team:** yes/no, link/summary of response
```
