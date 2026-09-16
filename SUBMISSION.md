# RevPact — ready-to-post submission

Fill in the ⬜ DEMO VIDEO LINK ⬜ once recorded, then paste everything below into the Discord channel.

---

**My Submission for the Build with Brickken Challenge**

**Project name:** RevPact

**Description:**
An agent that can only pay. An agent that can only kill. Both proven on-chain, not described.

RevPact tokenizes a company's recurring revenue on Brickken, then delegates authority to two other agents under Brickken's Regulated Agent Mandate Standard (RAMS / ERC-8226) — an **Ops Agent** gets a real RAMS **mandate**, scoped and capped, that can only move the payment token up to a hard limit; a **Compliance Agent** is approved as a RAMS **operator**, which lets it revoke the Ops Agent's mandate directly — and only that, no payout power of its own.

The core demo is a six-move sequence, every step real and on-chain: grant a mandate → authorize a within-cap transfer → refuse an over-cap one before it ever reaches the chain → the Compliance Agent revokes the mandate on its own signature → the same request that worked a minute earlier is now refused (`notRevoked`) → a fresh mandate is funded and pays out for real.

Then it goes further than that:
- **A live LLM decides**, not a script — stress-tested against two injection attempts (both resisted) and, more importantly, a completely ordinary request the model had no way to know violated a limit it was never told — refused on-chain anyway, by the mandate, not by tricking anything.
- **The kill switch fires on its own** — a dormant compliance rule engine, wired for real: an HTTP event comes in, a rule decides with zero human input, and the Compliance Agent's one power executes itself.
- **A genuine agent-paid API call** — the BKN faucet claim settled via a real EIP-3009 x402 payment, signed by the agent's own wallet, not an API key.
- **Signing isn't broadcasting** — RAMS's off-chain EIP-712 signature mode, tested for real: the principal signs an extension with zero gas, and a wallet with zero payout power anywhere else in this system broadcasts it without gaining any new authority.

**What's working:**
- Full tokenization lifecycle: tokenize, whitelist, mint, launch an STO, close it (honest rollback demo — soft cap unmet)
- Full RAMS mandate lifecycle: grant, authorize, cap-reject, revoke, post-revoke-reject, real payout
- Live LLM decision layer (`stealth/union-alpha` via OpenRouter), stress-tested against prompt injection
- Autonomous compliance trigger — a rule engine that revokes a mandate with zero human choosing the outcome
- Genuine agent-signed x402 payment (EIP-3009)
- RAMS's off-chain signature lifecycle mode (principal signs, a third party broadcasts, gains no authority)

**Out of scope, stated plainly:** ERC-8004 identity registration is blocked by a reproduced Brickken server bug (`500`, an ESM/CommonJS `axios` import crash in their `/send-transactions` settlement code for this route) — found, reproduced twice, and reported to the team, not a gap we hid. Full repro in `known-issues.md`.

**Brickken surfaces used:** Dapp API (`newTokenization`, `whitelist`, `mintToken`, `newSto`, `closeOffer`), RAMS/Agentic API (`ramsGrantMandate`, `ramsSetOperator`, `ramsExecute`, `ramsSetExecutorAction`, `ramsRevokeMandate`, `ramsExtendMandate` — both direct-signed and EIP-712 signature modes), x402 payments (`POST /faucet/bkn`), BKN faucet.

**Chain:** Ethereum Sepolia, chainId `11155111`

**Verified transaction hashes (25 real on-chain events — full log in `docs/transactions.md`):**
- Grant the Ops Agent's mandate: `0x782b6cee8e3125dc55cd846d8df8a5536bf292fc85ec479b730fd8af85b44adc`
- Within-cap transfer, authorized: `0x0482f0ba6bb68e9efe69cbea5d5283ac700a91783d5802789e6ccd4917bfce61`
- Compliance Agent revokes the mandate: `0xbf3954829cc94549bbbe970d7613e5d0ec32200b7bccea4adafd3e231dbfef36`
- Real 25 USDT payout under a fresh mandate: `0x16a5feea44019fd948a2e4ad2d7be30fa06f2f44f09d3df6d20359808b9d3cac`
- Agent-paid x402 faucet claim: `0x749b7051e71a7d4acc02f9565ce87cf5ac91b22bd8f274e7b7bfe9694d76b80a`
- LLM-decided real payout: `0x0c228e833f47ed1869f3dff29775922b23b93d98367a1b25bc50405b1809993e`
- Autonomous revoke (fired by a rule, not a human): `0x2d36133dab996e92564c7fddd170e6df9fc613f410624aed286470b3897ba47b`
- Mandate extended by off-chain signature alone: `0x3e9253c6df141ac4d33c86f82cf87aca86009291f74dd2d745e32ec7a6b1f982`

**Demo video:** ⬜ DEMO VIDEO LINK ⬜

**Live dashboard:** https://claude.ai/code/artifact/7207bc10-1405-4ee4-ae9d-4ac41fae3e53 (mirrored at https://yeziR4.github.io/revpact/)

**GitHub:** https://github.com/yeziR4/revpact

**Reward wallet:** `0xBFa3f0F2554fB20B80d1B5Ec4dE0e976E345e487`

**AI tools disclosed:** Built with Claude's assistance (architecture, client code, docs) throughout. One explicit exception: the live-LLM stress test calls `stealth/union-alpha` via OpenRouter as the actual runtime decision-maker in those four scenarios — that model, not Claude, decides what to propose. Every transaction, API call, and piece of on-chain state in this submission was run and independently verified against real Sepolia state, not simulated.

---
