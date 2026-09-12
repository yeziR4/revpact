# Demo video script (target: 3:00–3:30)

Built around the same spine as the dashboard: state the claim, show the six real events that prove it, then everything else as supporting evidence. Every hash below is real and confirmed — see `docs/transactions.md`.

## 0:00–0:15 — The claim

> "An agent that can only pay. An agent that can only kill. Both proven on-chain, not described — this is RevPact."

Show: dashboard hero, headline visible ("The permission gets tested, taken away, and then it pays for real.").

## 0:15–0:35 — What it sits on top of

> "It starts ordinary: a company's recurring revenue gets tokenized on Brickken as RVP1, an investor gets whitelisted and minted tokens, an offering runs. Nothing new here — every real transaction's in the repo."

Show: quick cut through 2–3 tx rows in the audit trail / Etherscan tabs. Don't dwell — this isn't the point.

## 0:35–2:35 — The six-move sequence (the actual demo)

Walk the dashboard's centerpiece section top to bottom, matching voiceover to each step. Scroll slowly enough that the ambient color wash behind the sequence is visible shifting with each step — it's a small touch but it's doing real work: green/blue for granted-and-working, red for refused, navy for revoked.

**Step 1 — Grant** (0:35)
> "The issuer — the principal — grants a separate wallet, the Ops Agent, a mandate. Not a shared key. A smart contract rule: you may move this payment token, up to fifty at a time, a hundred total, and nothing else."
Show: tx `0x782b6cee...`, the AgentMandate contract on Etherscan.

**Step 2 — Authorize** (0:55)
> "The Ops Agent asks to move twenty-five — inside the cap. The mandate says yes. The call reaches the real transfer function. It only stops because the treasury's empty at that moment — proof the authority check itself has no gap."
Show: tx `0x0482f0ba...`, point at the receipt — reached transferFrom, reverted on balance not on authorization.

**Step 3 — Refuse** (1:15)
> "Now it asks for nine hundred ninety-nine. Watch — no transaction even gets broadcast. The contract says no before it costs a cent of gas."
Show: the rejection row, the exact quoted error: `withinTransactionCap, withinCumulativeCap`.

**Step 4 — Revoke** (1:35)
> "Here's the part that's actually new. A *third* wallet — the Compliance Agent — has exactly one power: kill the Ops Agent's mandate. Not the issuer doing it. Not a shared admin. This wallet, its own signature."
Show: tx `0xbf395482...`, the Compliance Agent's address as `from`.

**Step 5 — Refuse again** (1:55)
> "Same request that worked a minute ago. Now: refused. Not paused, not frozen — the contract's word is `notRevoked`. The authority is provably gone."
Show: the second rejection row.

**Step 6 — Payout** (2:15)
> "So we fund a fresh mandate on identical terms and let it run for real. This isn't authorized-in-principle — the investor's USDT balance actually moves, zero to twenty-five, on-chain, right now."
Show: tx `0x16a5feea...`, the investor's balance before/after — this is the one moment to actually show a number changing, not just a transaction confirming.

## 2:35–3:00 — Why this is the hard part

> "This is the actual precondition institutions need before an agent touches a cap table: authority that's bounded and revocable by construction, not by someone's promise. Most public builds for this challenge stopped at tokenizing an asset. We closed the loop that makes an agent safe to delegate to in the first place."

Show: mechanism diagram (Issuer → Executor → Ops / Compliance).

## 3:00–3:15 — Scope, stated plainly

> "One piece we didn't close: the agent paying for its own faucet claim via x402, and an ERC-8004 identity registration — both needed Base Sepolia funding that didn't arrive in the build window. It's in the repo's known-issues log, not hidden. What's proven here is the harder half: the mandate that actually holds."

Show: `known-issues.md` or the dashboard's honesty section, briefly.

## 3:15–end — Close

> "Full trail, known issues, everything — in the repo. Link below."

Show: repo URL, dashboard URL, reward wallet on screen.

## Shot list

- [ ] Screen recording of the dashboard: hero → six-move sequence (linger here, it's the demo — scroll slowly enough to see the ambient glow shift) → mechanism → cast → audit trail
- [ ] 2–3 Etherscan tabs pre-opened on the sequence's real hashes, ready to alt-tab into
- [ ] Voiceover recorded separately, synced in edit
- [ ] Final render ≤ 3:30, unlisted YouTube upload
