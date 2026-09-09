#!/usr/bin/env node
// Claims 100 BKN on Ethereum Sepolia for a wallet via POST /faucet/bkn.
// Usage: node scripts/faucet-bkn.mjs <RECIPIENT_ADDRESS_ENV_VAR>
//   e.g. node scripts/faucet-bkn.mjs ISSUER_AGENT_ADDRESS
//
// Auth: x-api-key (10 lifetime credits per key). The endpoint also supports
// paying 0.01 USDC/EURC/BKN via x402 instead — see docs/build-plan.md for
// why this build uses the API-key path for now and what redoing this leg
// via x402 would take (a funded wallet + the same EIP-3009 signing used in
// scripts/tx.mjs's prepare/send flow, applied to this endpoint's own
// PAYMENT-REQUIRED challenge instead of Brickken's prepare-transactions one).
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { ProxyAgent, setGlobalDispatcher } from "undici";

if (process.env.HTTPS_PROXY) setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));

const [, , recipientEnvVar] = process.argv;
if (!recipientEnvVar) {
  console.error("Usage: node scripts/faucet-bkn.mjs <RECIPIENT_ADDRESS_ENV_VAR>");
  process.exit(1);
}

const recipientAddress = process.env[recipientEnvVar];
if (!recipientAddress) throw new Error(`Missing env var ${recipientEnvVar}`);

const apiKey = process.env.BRICKKEN_API_KEY;
const baseUrl = process.env.BRICKKEN_BASE_URL;
const idempotencyKey = randomUUID();

console.log(`[faucet] claiming 100 BKN for ${recipientAddress} (idempotency-key ${idempotencyKey})...`);
console.log("[faucet] this endpoint can genuinely take 30-60s to respond (202 = submitted, not failed) — see known-issues.md");

const res = await fetch(`${baseUrl}/faucet/bkn`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "Idempotency-Key": idempotencyKey,
  },
  body: JSON.stringify({ recipientAddress }),
  signal: AbortSignal.timeout(60_000),
});

const body = await res.json();
console.log(`[faucet] ${res.status}:`, JSON.stringify(body, null, 2));

if (body.transactionHash) {
  console.log(`[faucet] verify: https://sepolia.etherscan.io/tx/${body.transactionHash}`);
}
