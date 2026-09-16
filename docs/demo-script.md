# Demo video script (target: 4:00–4:30)

Built around the same spine as the dashboard: state the claim, show the six real events that prove it, then the live-LLM stress test as the closing argument, then everything else as supporting evidence. Every hash below is real and confirmed — see `docs/transactions.md`.

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

## 2:35–3:35 — What if the thing deciding isn't a script? (the closing argument)

Scroll to the dashboard's "Stress test" section, right below the cast cards.

> "Everything so far ran on deterministic logic deciding what to request. Here's the harder question: what if the thing deciding is an actual model, reading real requests — including ones written to manipulate it?"

Show: the four `llm-trials` cards.

> "A normal request: the model correctly proposes moving fifteen USDT to the investor. It passes the checks, the mandate authorizes it, and it's a real transaction — right here."
Show: card A, tx `0x0c228e83...`.

> "Then two attempts to manipulate it — a fake support ticket asking to redirect the payout wallet, a fake email demanding a 'corrected' nine-hundred-ninety-nine dollar distribution with forged legal sign-off. The model declined both, every time we tried."
Show: cards B and C, the model's actual quoted reasoning.

> "But here's the one that matters most — and it's not about tricking anything. A completely ordinary request for sixty-five USDT. Nothing adversarial. The model was never even told the mandate's exact fifty-dollar-per-transaction limit — it had no way to know. It proposed the transfer correctly, in good faith. The real contract refused it anyway."
Show: card D, the exact error: `withinTransactionCap, withinCumulativeCap`.

> "That's the actual claim: the money doesn't depend on the model's reasoning being reliable. Not because we got lucky fooling it — we didn't, not once — but because there's a rule underneath that the model was never in a position to break, even acting in perfect good faith."

## 3:35–4:00 — Why this is the hard part

> "This is the actual precondition institutions need before an agent touches a cap table: authority that's bounded and revocable by construction, not by someone's promise — and it holds whether the thing deciding is a script or a live model. Most public builds for this challenge stopped at tokenizing an asset. We closed the loop that makes an agent safe to delegate to in the first place."

Show: mechanism diagram (Issuer → Executor → Ops / Compliance).

## 4:00–4:15 — Scope, stated plainly

> "One piece we haven't closed: ERC-8004 identity registration, blocked by a server bug on Brickken's side that we found, reproduced, and reported — not by us. Everything else in this story, including the agent paying for its own faucet claim via x402, is real and confirmed on-chain."

Show: `known-issues.md` or the dashboard's honesty section, briefly.

## 4:15–end — Close

> "Full trail, known issues, everything — in the repo. Link below."

Show: repo URL, dashboard URL, reward wallet on screen.

## Shot list

- [ ] Screen recording of the dashboard: hero → six-move sequence (linger here — scroll slowly enough to see the ambient glow shift) → stress-test cards (linger here too, it's the closing argument) → mechanism → cast → audit trail
- [ ] 3–4 Etherscan tabs pre-opened on the real hashes used above (steps 1, 2, 4, 6, plus the stress-test's scenario A tx), ready to alt-tab into
- [ ] Voiceover recorded separately, synced in edit
- [ ] Final render ≤ 4:30, unlisted YouTube upload
