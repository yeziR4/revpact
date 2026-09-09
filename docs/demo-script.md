# Demo video script (target: 2:30–3:00)

Structure: open on the thesis, walk the real chain evidence, close on the mechanism that makes this different. Every timestamp below assumes screen-recording the build-log dashboard (`site/index.html`) alongside a terminal running `scripts/tx.mjs`, plus Sepolia Etherscan for spot-checks. Update the RAMS section once the mandate actually executes — two versions are scripted below so nothing blocks on Brickken's timeline.

## 0:00–0:20 — Thesis

> "A company with recurring revenue tokenizes that income stream on Brickken. Investors buy in, get paid out on schedule — and here's the part that matters: the agent that pays them out physically cannot mint tokens, cannot burn them, and can't pay out more than its cap allows, because that boundary is enforced on-chain, not by a policy someone wrote down."

Show: dashboard hero, RVP1 stat tiles.

## 0:20–1:00 — The issuer lifecycle, on real Sepolia

> "Every step here is a real transaction — I'm not replaying a script, this is the actual chain."

- Cut to `newTokenization` tx on Etherscan → dashboard's tx table.
- Whitelist → mint 500 RVP1 to the investor wallet, balance visible on Etherscan.
- STO launch and close (name the rollback honestly: *"this one closed into rollback because nobody invested in the test window — that's the contract working correctly, not a bug"*).

## 1:00–1:20 — Self-funding

> "The issuer agent also funds itself — it claimed its own BKN from Brickken's faucet, no human touching a faucet UI."

Show the faucet tx + BKN balance on the issuer wallet.

## 1:20–2:10 — RAMS: the actual differentiator

**If the mandate is live by recording time:**
> "This is the part that's actually new. The issuer wallet — the principal — grants a mandate to a completely separate wallet, the Ops Agent. That mandate says: you may move this payment token, up to this cap, and nothing else. Watch what happens when it tries to move more than its cap allows." (show the rejected over-cap `execute` call)
> "And separately, the issuer approves a third wallet — the Compliance Agent — as an operator. It can't pay anyone. All it can do is revoke the Ops Agent's mandate. Watch: one call, and the Ops Agent's authority is just gone." (show `revokeMandate` tx, then a rejected `execute` attempt afterward)

**If the mandate is still blocked when recording:**
> "As of recording, this last piece is blocked on Brickken's side — their own office hours confirmed RAMS is mid-rework. Here's exactly how far we got: the executor is registered, the action is configured, and the mandate grant is one Brickken-side fix away from executing." (show the `ramsSetExecutorAction` tx, the staged `scripts/payloads/`, and the known-issues.md entry — this is a legitimate thing to show, not something to hide)

## 2:10–2:40 — Why this matters

> "This is the actual precondition institutions need before they let an agent near a cap table: authority that's bounded and revocable by construction, not by trust. RevPact is the smallest possible demonstration of that — one agent that can only pay, one that can only kill, and a paper trail of real transactions proving both."

Show: architecture diagram from `docs/architecture.md` / dashboard.

## 2:40–end — Close

> "Full transaction log, known issues, and the code are all in the repo — link below."

Show: repo URL, dashboard URL, reward wallet address on screen.

## Shot list / assets needed

- [ ] Screen recording of the dashboard (`site/index.html`) scrolling through stats → agents → RAMS panel → tx table
- [ ] Terminal recording of at least one `scripts/tx.mjs ... --wait` run start to finish (shows the real prepare→sign→send→poll flow, not just a result)
- [ ] Etherscan tabs open for at least 2 of the tx hashes, to prove they're real
- [ ] Voiceover recorded separately, synced in edit (cleaner than live narration over live calls)
- [ ] Final render ≤ 3:00, upload to YouTube unlisted per other participants' pattern
