# Known issues

Filled in as real issues are hit against the Brickken sandbox, in the format below. This file is part of the submission — it's meant to show real integration work, not just a clean success path. (The programme's own Discord thread shows the Brickken team reads and fixes these quickly, so documenting them precisely and promptly is worth doing as you go, not retroactively.)

Watch for these, reported by other participants in the programme's Discord as of late August 2026 — confirm current status against your own sandbox account rather than assuming they're still true:

- **`approve` non-zero → non-zero allowance revert.** The mock USDT/payment-token contract used in the sandbox appears to reject `approve(spender, nonZeroAmount)` when the current allowance is already non-zero, with an empty revert. Workaround reported: `approve(spender, 0)`, wait for confirmation, then `approve(spender, newAmount)`.
- **`mintToken` treasury-mint restriction.** The API's `mintToken` method requires a valid `investorEmail` distinct from any tokenizer account email — there is reportedly no supported path to mint directly to the issuer's own treasury/company wallet as of late August 2026.
- **`mintToken` response shape.** Reported as returning `transactions` as a single object (not an array) with a separate `whitelistTx`/`txIdWhitelist` pair when whitelisting is also required, rather than a uniform array — worth defensive parsing either way.
- **Dividend "Current Holdings" read-model.** Reported as only reflecting the first mint event for an investor who received tokens purely via `mintToken` (no direct investment), understating actual balance in that specific UI view — on-chain balance and per-user detail views were reported accurate.

## Found during this build

### Sandbox mock USDT has no self-service mint — WRONG. Our bug, not Brickken's. Corrected 2026-09-10.

**This entry originally reported the wrong root cause. Leaving the full trail rather than deleting it, because being visibly wrong once and catching it is more honest than a clean record.**

- **Method / endpoint:** direct contract call to the sandbox USDT payment token (`0x28d2B01854D0aBec267a3DDcad9163580E6E8604`, Ethereum Sepolia), not a Brickken API endpoint.
- **Date hit:** 2026-09-07.
- **Original (wrong) request:** simulated `mint(address,uint256)` (selector `0x40c10f19`) from the issuer wallet via `eth_call`, with a hand-typed hex-encoded `uint256` argument.
- **Observed response / error:** `execution reverted` with empty revert data.
- **What we concluded, incorrectly:** that `mint` was access-controlled (owner-only), "as expected for a shared sandbox token." This was plausible-sounding and wrong, and we escalated it to Brickken on that basis rather than checking our own encoding first.
- **Actual root cause, found 2026-09-10:** our hand-typed argument was 62 hex characters instead of the required 64 — two leading zero-bytes short. That misaligns every byte of a manually-assembled ABI call, so the EVM decoded garbage and reverted for a reason that had nothing to do with permissions. `mint` was open the entire time. Confirmed by re-running the identical call with the argument correctly zero-padded via `hex(amount)[2:].zfill(64)` instead of typed by hand — it succeeded immediately (`eth_call` returned `0x`, the correct empty-success result for a void function).
- **How we found it:** Brickken (Bassie's teammate on the thread) replied to our funding request pointing out `mint(address,uint256)` should just work — which prompted re-testing instead of taking the original diagnosis on faith.
- **Consequence:** minted 100 USDT directly (`scripts/mint-usdt.mjs`), which unblocked a real payout — see `docs/transactions.md`, the actual value-moving `ramsExecute`.
- **Lesson, stated plainly:** never hand-assemble ABI calldata for a "let me just check" test without verifying its length/shape first — a malformed call and an intentionally-reverted call produce the identical error at this layer (`execution reverted`, empty data), and it's easy to reach for the more interesting-sounding explanation. The fix, going forward, is what `scripts/mint-usdt.mjs` and `scripts/tx.mjs` already do: derive calldata programmatically (`viem`'s `encodeFunctionData`, or Brickken's own prepare endpoint), never type it by hand.
- **Reported to Brickken team:** yes, the original (wrong) escalation went out 2026-09-07. Owe them a correction alongside the thanks — noted, sending it.

### `POST /faucet/bkn` can take well over the "instant" impression the docs give

- **Method / endpoint:** `POST /faucet/bkn`.
- **Date hit:** 2026-09-07.
- **Request (redacted):** `x-api-key` auth, fresh `Idempotency-Key`, our issuer wallet as `recipientAddress`.
- **Observed response / error:** first attempt timed out client-side at 20s with zero bytes received; an idempotent retry with the same key and a 60s timeout returned `202 submitted` with a real transaction hash.
- **Root cause (if known):** the endpoint can genuinely take tens of seconds when it submits the mint but returns before on-chain confirmation (`202`, per its documented behavior) — the first attempt likely just needed a longer client timeout, not a resend.
- **Workaround used:** always set a generous timeout (60s+) on this call, and retry with the *same* `Idempotency-Key` on a client-side timeout rather than assuming failure and generating a new one.
- **Reported to Brickken team:** no — this reads as expected async behavior, not a bug, so not escalated.

### RAMS "mandate" and "freeze" are not the same delegation model

- **Method / endpoint:** `POST /prepare-transactions` (`ramsGrantMandate`, `ramsSetOperator`, `ramsFreezeAgent`), reasoning from `docs/brickken-docs-reference.txt`, not a live error.
- **Date hit:** 2026-09-09 (design-time, caught before writing code against the wrong model).
- **What we assumed:** a single "grant a mandate scoped to freeze/revoke" call, symmetric with the payout mandate.
- **What's actually true:** `revokeMandate` is delegable — a principal approves an address as an **operator** (`ramsSetOperator`) and that operator can then revoke directly. `freezeAgent` is a *different* primitive entirely: a registry-wide admin action gated by `ENFORCER_ROLE`, not something a principal can hand out via a mandate or operator approval at all.
- **Why it matters:** a design built around "grant the compliance agent a freeze+revoke mandate" doesn't correspond to any real RAMS call — it would have failed the first time we tried to execute it. Caught by reading the RAMS actors table and the individual endpoint docs closely rather than assuming symmetry with the payout side.
- **Workaround used:** redesigned the Compliance Agent around `ramsSetOperator` + `ramsRevokeMandate` (fully self-serviceable once the principal is set up); treated `freezeAgent` as an optional stretch addition pending Brickken granting `ENFORCER_ROLE`, not a dependency of the core demo. See `docs/architecture.md`.
- **Reported to Brickken team:** not a bug — this is the documented design, we just read it wrong on the first pass.

### `grant-principal` confirmation didn't match live `compliance-status` — RESOLVED

- **Method / endpoint:** `GET /rams/compliance-status`, `POST /prepare-transactions` (`ramsGrantMandate`).
- **Date hit:** 2026-09-09. **Resolved:** 2026-09-10, by Brickken.
- **Request (redacted):** `compliance-status?chainId=11155111&principal=<issuer>&identityRef=<value Brickken sent>`, against the documented default ComplianceProvider (`0xa90D2503D5D9b80ECC27856Ff76F892B8C02f278`).
- **Observed response / error:** `{"eligible":false,"reason":"IDENTITY_NOT_FOUND","reasonCode":6}` — both from the read endpoint directly and as the failure reason on `ramsGrantMandate`. Reproduced identically across two attempts, with and without an explicit `complianceProvider` field on the grant request, and with both decimal and hex `chainId`.
- **Root cause (confirmed by Brickken):** a Sandbox redeployment had registered our principal against a *newer* ComplianceProvider contract, while the Sandbox default (the address this API queries by default) still pointed at the older, previously-configured one — so the read was correctly reporting "never heard of you" against a contract that genuinely had never heard of us. Not a mistake on our side, and not something we could have discovered without Brickken checking their own deployment state.
- **Workaround used:** none needed — Brickken registered the principal on both ComplianceProvider contracts under the same `identityRef`, so it now resolves either way. `ramsGrantMandate` and `ramsSetOperator` both succeeded immediately afterward (real fields still needed an explicit `principal` in the body even in direct-signed mode — see the field-name note below).
- **Reported to Brickken team:** yes, 2026-09-09; fixed and confirmed 2026-09-10.

### RAMS write methods need an explicit `principal` even in direct mode

- **Method / endpoint:** `ramsGrantMandate`, `ramsSetOperator`.
- **Date hit:** 2026-09-10.
- **Observed response / error:** `"principal is required and must be a valid EVM address"` on the first attempt of each, despite `signerAddress` (the wallet actually signing) already being the principal.
- **Root cause:** the docs describe two authorization modes — direct (`signerAddress` is the principal, `signature` omitted) and EIP-712 signature (any sender, explicit `principal` + `signature`) — but don't make clear that `principal` is a required body field in *both* modes, not inferred from `signerAddress` in the direct case.
- **Workaround used:** always pass `principal` explicitly, matching `signerAddress`, even in direct mode.
- **Reported to Brickken team:** no — minor documentation gap, not worth a support round-trip; noted here for the next person.

### `ramsExecute` prepare fails reading frozen status — server bug, not a request issue — RESOLVED

- **Method / endpoint:** `POST /prepare-transactions` (`ramsExecute`).
- **Date hit:** 2026-09-10.
- **Request (redacted):** ERC-20 helper mode against our confirmed, active mandate — `agent` (Ops), `principal` (issuer), `executorAddress` (our dedicated executor), `asset` (USDT), `from`/`to`/`amount` within the granted cap. Also tried with an explicit `agentMandateAddress` override, and with `agent`/`principal` added even though implied by `signerAddress`/context — same result every time.
- **Observed response / error:** `500 Server Error` — `"Could not read agent frozen status from RAMS contracts: call revert exception ... (method=\"isFrozen(address)\", data=\"0x\", ...)"`.
- **Why this is Brickken's bug, not ours:** the identical read — `isFrozen` for the same agent/principal pair, same chain — succeeds cleanly via `GET /rams/status` and `GET /rams/mandate` (`isFrozen: false` / `frozen: false`, both `200`). Only the internal frozen-status check inside `ramsExecute`'s own prepare handler fails, with an empty revert consistent with calling `isFrozen` against a contract that doesn't implement it at that selector — most likely the executor address rather than the AgentMandate registry.
- **Workaround used:** none available — this is a 500 inside Brickken's own prepare logic before it reaches any of our request fields; no client-side change can route around it.
- **Reported to Brickken team:** yes, 2026-09-10. **Fixed the same day**: the original dedicated executor (`0xE9832b090fBaEe59Bb26F2394448cfF49a6B87D7`) had the broken `isFrozen` path; Brickken issued a replacement (`0xF626e5840c888a5E395f42F2dcC24F58EAb8b65b`) bound to the same AgentMandate registry, already holding `RECORDER_ROLE`. Re-ran `ramsSetExecutorAction` and the token `approve` against the new executor, and `ramsExecute` worked immediately — full sequence (within-cap execute, over-cap rejection, revoke, post-revoke rejection) all confirmed the same session. See `docs/transactions.md`.

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
