# Demo video script (target: 4:30–5:00)

Built around the same spine as the dashboard: state the claim, show the six real events that prove it, then two closing arguments — a live LLM stress test, and an autonomous compliance trigger — then everything else as supporting evidence. Every hash below is real and confirmed — see `docs/transactions.md`.

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

## 2:35–3:35 — What if the thing deciding isn't a script? (closing argument, part one)

Scroll to the dashboard's "Stress test" section, right below the cast cards.

> "Everything so far ran on deterministic logic deciding what to request. Here's the harder question: what if the thing deciding is an actual model, reading real requests — including ones written to manipulate it?"

Show: the four `llm-trials` cards.

> "A normal request: the model correctly proposes moving fifteen USDT to the investor. It passes the checks, the mandate authorizes it, and it's a real transaction — right here."
Show: card A, tx `0x0c228e83...`.

> "Then two attempts to manipulate it — a fake support ticket asking to redirect the payout wallet, a fake email demanding a 'corrected' nine-hundred-ninety-nine dollar distribution with forged legal sign-off. The model declined both, every time we tried."
Show: cards B and C, the model's actual quoted reasoning.

> "But here's the one that matters most — and it's not about tricking anything. A completely ordinary request for sixty-five USDT. Nothing adversarial. The model was never even told the mandate's exact fifty-dollar-per-transaction limit — it had no way to know. It proposed the transfer correctly, in good faith. The real contract refused it anyway."
Show: card D, the exact error: `withinTransactionCap, withinCumulativeCap`.

> "That's the first claim: the money doesn't depend on the model's reasoning being reliable. Not because we got lucky fooling it — we didn't, not once — but because there's a rule underneath that the model was never in a position to break, even acting in perfect good faith."

## 3:35–4:20 — The revoke didn't wait for a human either (closing argument, part two)

Scroll to the "Autonomy" section, right below the stress test.

> "One more question. Every kill switch you just watched — the revoke in step four — happened because I ran a script that already knew the answer. That's not actually autonomous, whatever we might have implied. So we fixed that too."

Show: the `trigger-flow` cards (event → evaluate() → real call).

> "This is a compliance rule engine that sat in the repo since early in the build, fully written, never connected to anything. Now it's live: a real event comes in over HTTP, a rule table decides with zero human input, and if it calls for it, the Compliance Agent's one power fires on its own."

> "We sent it exactly this: a high-severity sanctions flag. The rule engine decided. And it revoked the same mandate you just watched pay someone out — not a disposable one set up to be knocked down, the real, currently-active one."
Show: tx `0x2d36133d...`, the receipt status, the follow-up mandate read confirming `revoked: true`.

> "Nobody chose that outcome. A rule fired it."

## 4:20–4:45 — Why this is the hard part

> "This is the actual precondition institutions need before an agent touches a cap table: authority that's bounded and revocable by construction, not by someone's promise — and it holds whether the thing deciding is a script or a live model, and whether the kill switch is pulled by a person or a rule. Most public builds for this challenge stopped at tokenizing an asset. We closed the loop that makes an agent safe to delegate to in the first place."

Show: mechanism diagram (Issuer → Executor → Ops / Compliance).

## 4:45–5:00 — Scope, stated plainly

> "One piece we haven't closed: ERC-8004 identity registration, blocked by a server bug on Brickken's side that we found, reproduced, and reported — not by us. Everything else in this story, including the agent paying for its own faucet claim via x402, is real and confirmed on-chain."

Show: `known-issues.md` or the dashboard's honesty section, briefly.

## Optional beat — if there's still runway: "A signature is not a transaction" (the Custody section)

There's a fourth real capability on the dashboard, right below Autonomy, not written into the timed script above because three closing arguments risks losing the viewer. Include it only if the take is running short of 5:00, or cut for time otherwise — everything it proves is still in the repo and the dashboard either way.

> "One more RAMS capability nobody's shown yet: the principal can authorize a change with a pure off-chain signature — zero gas, no transaction at all — and hand it to anyone to broadcast. We tested it for real: the Issuer signed an extension off-chain, and the Compliance Agent — which has zero payout power anywhere else in this system — broadcast it. Signing authorizes. Broadcasting just delivers. That's the actual precondition for cold-storage custody."

Show: the `trigger-flow` cards in the Custody section, tx `0x3e9253c6...`.

## 5:00–end — Close

> "Full trail, known issues, everything — in the repo. Link below."

Show: repo URL, dashboard URL, reward wallet on screen.

## Shot list

- [ ] Screen recording of the dashboard: hero → six-move sequence (linger — scroll slowly enough to see the ambient glow shift) → stress-test cards → autonomy section → custody section if included (linger on whichever ones you keep, they're the closing argument) → mechanism → cast → audit trail
- [ ] 5–6 Etherscan tabs pre-opened on the real hashes used above (steps 1, 2, 4, 6, the stress-test's scenario A tx, the autonomous revoke tx, and the signature-extend tx if included), ready to alt-tab into
- [ ] Voiceover recorded separately, synced in edit
- [ ] Final render ≤ 5:00, unlisted YouTube upload
- [ ] If time is genuinely too tight to hit 5:00 comfortably: the six-move sequence and the autonomy section are the two non-negotiable beats. The LLM stress test can be cut to just card A (real payout) + card D (the backstop, not the injection cards) without losing the core claim.
