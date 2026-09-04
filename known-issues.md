# Known issues

Filled in as real issues are hit against the Brickken sandbox, in the format below. This file is part of the submission — it's meant to show real integration work, not just a clean success path. (The programme's own Discord thread shows the Brickken team reads and fixes these quickly, so documenting them precisely and promptly is worth doing as you go, not retroactively.)

Watch for these, reported by other participants in the programme's Discord as of late August 2026 — confirm current status against your own sandbox account rather than assuming they're still true:

- **`approve` non-zero → non-zero allowance revert.** The mock USDT/payment-token contract used in the sandbox appears to reject `approve(spender, nonZeroAmount)` when the current allowance is already non-zero, with an empty revert. Workaround reported: `approve(spender, 0)`, wait for confirmation, then `approve(spender, newAmount)`.
- **`mintToken` treasury-mint restriction.** The API's `mintToken` method requires a valid `investorEmail` distinct from any tokenizer account email — there is reportedly no supported path to mint directly to the issuer's own treasury/company wallet as of late August 2026.
- **`mintToken` response shape.** Reported as returning `transactions` as a single object (not an array) with a separate `whitelistTx`/`txIdWhitelist` pair when whitelisting is also required, rather than a uniform array — worth defensive parsing either way.
- **Dividend "Current Holdings" read-model.** Reported as only reflecting the first mint event for an investor who received tokens purely via `mintToken` (no direct investment), understating actual balance in that specific UI view — on-chain balance and per-user detail views were reported accurate.

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
