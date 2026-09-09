# RAMS payload templates

Pre-staged, ready to fire the moment Brickken confirms our `identityRef` and dedicated `AgentExecutor`. Fill in the two `__FROM_BRICKKEN__` placeholders (also settable via `.env`'s `RAMS_ISSUER_IDENTITY_REF` and a new `RAMS_EXECUTOR_ADDRESS`), then run each with `scripts/tx.mjs`, e.g.:

```bash
node scripts/tx.mjs ramsGrantMandate scripts/payloads/grant-mandate-ops.json ISSUER_AGENT_PRIVATE_KEY --wait
node scripts/tx.mjs ramsSetOperator scripts/payloads/set-operator-compliance.json ISSUER_AGENT_PRIVATE_KEY --wait
# after funding the Ops wallet with a little Sepolia ETH:
node scripts/tx.mjs ramsExecute scripts/payloads/execute-ops-transfer.json OPS_AGENT_PRIVATE_KEY --wait
# the compliance trigger, later:
node scripts/tx.mjs ramsRevokeMandate scripts/payloads/revoke-mandate-compliance.json COMPLIANCE_AGENT_PRIVATE_KEY --wait
```

Order matters: `grant-mandate` before `execute` (obviously), and `set-operator` before the Compliance Agent can `revoke-mandate`. The Ops and Compliance wallets both need a small amount of Sepolia ETH before they can sign their own steps (`ramsExecute` and `ramsRevokeMandate` are both client-signed by the agent/operator itself, not relayable through the issuer's gas).

See `docs/architecture.md` for why the design uses `transferFrom` on the payment token as the Ops Agent's mandated action, rather than Brickken's native `dividendDistribution`.
