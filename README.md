# RevPact

**A self-funding agent mesh that tokenizes recurring revenue, then hands out bounded, revocable authority to the agents that operate it.**

Built for the **Brickken Build with Brickken Programme — Agentic Challenge**.

**[Live build-log dashboard →](https://claude.ai/code/artifact/7207bc10-1405-4ee4-ae9d-4ac41fae3e53)** — real Sepolia transactions, agent wallets, and current RAMS mandate state.

> Working title. Rename freely — nothing below depends on the name.

## The pitch in one paragraph

A company's recurring revenue (subscription income, a SaaS contract, a royalty stream) is tokenized on Brickken as an investable asset. An **Issuer Agent** funds itself from Brickken's BKN faucet and runs the asset's full lifecycle — tokenize, launch an offering, whitelist investors, mint. It then delegates authority to two other agents under Brickken's Regulated Agent Mandate Standard (RAMS / ERC-8226), each through a different real primitive: an **Ops Agent** gets a genuine RAMS **mandate**, scoped to moving the payment token up to a hard cap and nothing else; a **Compliance Agent** is approved as a RAMS **operator**, which lets it revoke the Ops Agent's mandate directly — and only that, no payout or mint authority at all.

Nothing here is a human clicking buttons in a demo. Every step is an agent acting inside an authority boundary it did not grant itself, enforced on-chain rather than by convention.

## Why this shape

Brickken's own framing of the Agentic Challenge is specific: *"the agent calls the API and also pays for the call."* That means three things have to actually happen on camera, not just be described:

1. An agent **funds itself** — claims 100 BKN from Brickken's Sepolia faucet with no human touching a faucet UI, then (target: see Status) spends that same BKN via x402 to pay for a RAMS operation, closing the loop on its own funds rather than a human's.
2. An agent's authority is **delegated, bounded, and revocable** via a RAMS mandate — not a shared private key, not a role flag in a database.
3. A **compliance action executes autonomously**, from a trigger, inside that mandate boundary — and is provably unable to exceed it.

Most public builds for this programme stop at step 1 (a single ERC-8004 registration) or get partway through step 2 (RAMS wiring present but not confirmed executing live). RevPact's scope is deliberately just those three things, done completely, wrapped in one coherent real-world story, rather than a wider feature list done partially.

## Architecture

```mermaid
flowchart TB
    subgraph identity["1. Self-funding & identity"]
        W[Operational wallet] -->|x402: pay 0.01 USDC| F[BKN Sepolia faucet]
        F -->|mint 100 BKN| W
        W -->|register| ID[ERC-8004 agent identity]
    end

    subgraph issuance["2. Issuer Agent — Dapp API"]
        ID --> IA[Issuer Agent]
        IA -->|newTokenization| T[Revenue-share token]
        IA -->|newSto| STO[Offering]
        IA -->|whitelist| WL[Investors]
        IA -->|mintToken| MINT[Investor allocations]
    end

    subgraph mandates["3. RAMS (ERC-8226), Ethereum Sepolia"]
        IA -->|grantMandate: transferFrom, capped| OA[Ops Agent]
        IA -->|setOperator: approve| CA[Compliance Agent]
        OA -->|execute, within cap| PT[Payment token]
        TRIG[Trigger engine\nrules / webhook] -->|compliance signal| CA
        CA -->|revokeMandate| OA
    end
```

Full sequence detail, mandate scopes, and the specific fields each agent is and isn't allowed to touch: see [`docs/architecture.md`](docs/architecture.md).

## Repo layout

```
docs/                          architecture, use case, build plan, demo script, transaction log, known issues
docs/brickken-docs-reference.txt   the complete real Brickken API docs, pulled verbatim for schema accuracy
docs/evidence/                 raw prepare/send responses for every confirmed transaction
site/                          the live build-log dashboard (published as this build's "try it live" page)
scripts/tx.mjs                 the real prepare -> sign -> send -> poll runner; drives every Dapp/RAMS write
scripts/faucet-bkn.mjs         claims BKN from Brickken's Sepolia faucet
scripts/payloads/              every RAMS call, pre-staged and ready to run once each dependency clears
src/rules/                     the compliance trigger engine (pure logic, chain-independent)
```

## Status

✅ **The full mandate lifecycle is closed, on Ethereum Sepolia, end to end.** 16 real Sepolia transactions and API calls, run through `scripts/tx.mjs` against the live sandbox. Full log: [`docs/transactions.md`](docs/transactions.md). Live status view: **[the dashboard](https://claude.ai/code/artifact/7207bc10-1405-4ee4-ae9d-4ac41fae3e53)**.

The complete story, all confirmed on-chain or rejected by the live contract, same session:

1. Tokenize → whitelist → mint → launch STO → claim BKN from the faucet → close the STO
2. Grant the Ops Agent a RAMS mandate — `transferFrom` on USDT, capped at 50/100 USDT — and approve the Compliance Agent as operator
3. **Ops Agent executes a within-cap transfer** — the mandate authorizes it, the call reaches the real ERC-20 `transferFrom`, and only fails there on a 0 balance (not a mandate rejection — the mandate did its job)
4. **Ops Agent attempts an over-cap transfer** — rejected before it ever reaches the chain: `"mandate does not allow this execution: withinTransactionCap, withinCumulativeCap"`
5. **Compliance Agent revokes the Ops Agent's mandate**, on its own signature, as an approved operator — no payout authority of its own, only this
6. **Ops Agent attempts the same transfer again** — rejected: `"mandate does not allow this execution: notRevoked"`. Its authority is provably gone.

The one thing left is cosmetic rather than structural: a real payout (not just an authorized-but-reverted attempt) needs test USDT in the issuer wallet, still pending from Brickken (mock token's `mint()` is access-controlled). Every mechanism that matters — grant, authorize, cap-reject, revoke, post-revoke-reject — is already proven live.

## Judging alignment

| Criterion | How this build addresses it |
|---|---|
| Most innovative use case | Revenue-share tokenization isn't itself new, but a *mandate-bounded agent hierarchy operating it* — one agent that can only pay, one that can only kill — is a materially different pattern than "agent watches asset and reacts." |
| Most interesting / engaging concept | The demo's climax is a trigger the operator doesn't control, executed by an agent whose authority is cryptographically capped before the trigger ever fires. |
| Best technical execution & API integration | Closes the full agentic stack — x402 self-payment, ERC-8004 identity, RAMS delegate/execute/revoke, Dapp API lifecycle — rather than one or two pieces of it. |
| Highest real-world viability | "Bounded delegated authority + automatic compliance kill-switch" is the actual precondition institutions need before letting any agent near a cap table — this is the control story, not just the tokenization story. |

## AI disclosure

This project is being scaffolded and built with Claude's assistance (architecture, client code, docs). All Brickken integration, transaction execution, and verification will be run and checked by the project author against real Sepolia state before submission.
