# Demo video script (target: 2:30–3:00)

Built around the same spine as the dashboard: state the claim, show the five real events that prove it, then everything else as supporting evidence. Every hash below is real and confirmed — see `docs/transactions.md`.

## 0:00–0:15 — The claim

> "An agent that can only pay. An agent that can only kill. Both proven on-chain, not described — this is RevPact."

Show: dashboard hero, headline visible.

## 0:15–0:35 — What it sits on top of

> "It starts ordinary: a company's recurring revenue gets tokenized on Brickken as RVP1, an investor gets whitelisted and minted tokens, an offering runs. Nothing new here — every real transaction's in the repo."

Show: quick cut through 2–3 tx rows in the audit trail / Etherscan tabs. Don't dwell — this isn't the point.

## 0:35–2:10 — The five-step sequence (the actual demo)

Walk the dashboard's centerpiece section top to bottom, matching voiceover to each step:

**Step 1 — Grant** (0:35)
> "The issuer — the principal — grants a separate wallet, the Ops Agent, a mandate. Not a shared key. A smart contract rule: you may move this payment token, up to fifty at a time, a hundred total, and nothing else."
Show: tx `0x782b6cee...`, the AgentMandate contract on Etherscan.

**Step 2 — Authorize** (0:55)
> "The Ops Agent asks to move twenty-five — inside the cap. The mandate says yes. The call reaches the real transfer function. It only stops because the treasury's empty, which is Brickken's sandbox, not a gap in the rule."
Show: tx `0x0482f0ba...`, point at the receipt — reached transferFrom, reverted on balance not on authorization.

**Step 3 — Refuse** (1:15)
> "Now it asks for nine hundred ninety-nine. Watch — no transaction even gets broadcast. The contract says no before it costs a cent of gas."
Show: the rejection row, the exact quoted error: `withinTransactionCap, withinCumulativeCap`.

**Step 4 — Revoke** (1:35)
> "Here's the part that's actually new. A *third* wallet — the Compliance Agent — has exactly one power: kill the Ops Agent's mandate. Not the issuer doing it. Not a shared admin. This wallet, its own signature."
Show: tx `0xbf395482...`, the Compliance Agent's address as `from`.

**Step 5 — Refuse again** (1:55)
> "Same request that worked thirty seconds ago. Now: refused. Not paused, not frozen — the contract's word is `notRevoked`. The authority is provably gone."
Show: the second rejection row.

## 2:10–2:40 — Why this is the hard part

> "This is the actual precondition institutions need before an agent touches a cap table: authority that's bounded and revocable by construction, not by someone's promise. Most public builds for this challenge stopped at tokenizing an asset. We closed the loop that makes an agent safe to delegate to in the first place."

Show: mechanism diagram (Issuer → Executor → Ops / Compliance).

## 2:40–end — Close

> "Full trail, known issues, everything — in the repo. Link below."

Show: repo URL, dashboard URL, reward wallet on screen.

## Shot list

- [ ] Screen recording of the dashboard: hero → five-step sequence (linger here, it's the demo) → mechanism → cast → audit trail
- [ ] 2–3 Etherscan tabs pre-opened on the sequence's real hashes, ready to alt-tab into
- [ ] Voiceover recorded separately, synced in edit
- [ ] Final render ≤ 3:00, unlisted YouTube upload
