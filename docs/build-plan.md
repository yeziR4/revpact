# Build plan

Original plan (Sept 4 start, no key/wallet yet) is preserved at the bottom for reference. This is the live plan as of **Sept 9, evening**, with real access, real transactions, and two active Brickken-side blockers — 8 days left to the Sept 17, 23:59 CET deadline.

## Where things actually stand

7 confirmed Sepolia transactions (full log: `docs/transactions.md`), live dashboard published (`site/index.html`). Issuer lifecycle (tokenize → whitelist → mint → STO launch → close) is done. RAMS executor is set up and its `transferFrom` action is registered. Two things are blocked on Brickken, both escalated:
1. `ramsGrantMandate` — principal still reads `IDENTITY_NOT_FOUND` despite Brickken issuing our `identityRef`. Brickken's own office hours (Sept 9) confirmed RAMS is mid-rework.
2. Dividend-style payout — issuer wallet has 0 test USDT, mock token's `mint()` is access-controlled.

Everything downstream of #1 is pre-staged in `scripts/payloads/` — grant, execute, over-cap attempt, revoke — ready to run the moment it clears.

## Sept 10–12: keep the RAMS path warm, harden everything else

- Check in on the Brickken escalation daily; the instant `compliance-status` reports eligible, run the full staged sequence (`grant-mandate-ops.json` → fund Ops/Compliance wallets → `execute-ops-transfer.json` → the over-cap attempt → `revoke-mandate-compliance.json`) and capture every tx hash immediately.
- Fund the Ops and Compliance wallets with Sepolia ETH now, not when RAMS unblocks — they need it to sign `execute`/`revokeMandate` themselves.
- Once test USDT lands: approve the executor on the payment token from the issuer wallet (a prerequisite the RAMS docs are explicit about — RAMS sits on top of the ERC-20 allowance, doesn't replace it), then the Ops Agent's `execute` calls actually move real value.
- If RAMS is still blocked by ~Sept 13: make the fallback decision explicit rather than losing more days to hope — see below.

## Sept 13–15: demo + fallback assembly

- Record the demo video per `docs/demo-script.md` — it already has a scripted branch for "RAMS live" and "RAMS still blocked, showing exactly how far we got," so recording isn't blocked on Brickken either way.
- If RAMS unblocked: re-record the RAMS section with the real execute/revoke sequence.
- If still blocked: the honest-attempt framing (same pattern Tixken used publicly) is not a weaker submission if everything else is airtight — polish the Dapp API side instead: retry `newInvest`/`claimTokens` with a funded investor wallet for a *successful* STO close (not just the rollback we have now), which rounds out the lifecycle story.
- Finish `known-issues.md` and `docs/transactions.md` — these are meant to read as evidence of real integration work, not just a changelog.

## Sept 16: submission assembly

- Reward wallet address into the submission form and `.env`'s `REWARD_WALLET_ADDRESS`.
- Final README pass — a reviewer should understand the whole story from the README and dashboard alone, video optional.
- Submission form, repo link (public), dashboard link, demo video link.

## Sept 17: buffer day

- Do not plan new integration work for today. If RAMS cleared late, this is re-recording the video and re-checking the dashboard's numbers, not first-time testing.

---

## Original plan (Sept 4, pre-access)

Starting point at the time: no API key, no funded wallet, 13 days.

**Day 0–1: access & verification** — apply for API key, confirm Agentic/MCP/CLI access, read the real docs and reconcile every method's schema, generate and fund the operational wallet.

**Day 2–3: self-funding + identity** — get the x402 BKN faucet flow working, register the Issuer Agent's ERC-8004 identity.

**Day 4–7: issuer lifecycle** — full tokenize → STO → whitelist → mint → dividend round, logging every real quirk hit along the way.

**Day 8–10: RAMS delegation** — grant the Ops Agent's mandate, approve the Compliance Agent as operator, wire the trigger engine, run a payout through the mandate, demonstrate an out-of-mandate rejection.

**Day 11–12: polish** — live dashboard, finish known-issues.md, README pass.

**Day 13: submission** — demo video, submission form, buffer for sandbox flakiness.

Reality diverged from this mainly in timing (access took until Sept 7, RAMS setup took until Sept 9) rather than in shape — the sequence above is still exactly what happened, just compressed into fewer remaining days.
