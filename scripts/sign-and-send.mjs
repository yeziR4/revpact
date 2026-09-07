#!/usr/bin/env node
// Usage: node scripts/sign-and-send.mjs <prepare-response.json> <PRIVATE_KEY_ENV_VAR>
// Signs every transaction in a Brickken /prepare-transactions response with
// the given wallet and submits it to /send-transactions.
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { ProxyAgent, setGlobalDispatcher } from "undici";

// Node's global fetch (undici) does not honor HTTPS_PROXY automatically —
// route it through this sandbox's agent proxy explicitly, or every request
// gets rejected by the environment's direct-connection allowlist.
if (process.env.HTTPS_PROXY) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

const [, , prepareFile, pkEnvVar] = process.argv;
if (!prepareFile || !pkEnvVar) {
  console.error("Usage: node scripts/sign-and-send.mjs <prepare-response.json> <PRIVATE_KEY_ENV_VAR>");
  process.exit(1);
}

const prepared = JSON.parse(readFileSync(prepareFile, "utf8"));
const privateKey = process.env[pkEnvVar];
if (!privateKey) throw new Error(`Missing env var ${pkEnvVar}`);

// Pure offline signing — every field the transaction needs (nonce, gas,
// chainId, fees) is already in Brickken's prepare response, so this never
// touches an RPC. Avoids the Node fetch/undici-vs-HTTPS_PROXY mismatch that
// breaks a real walletClient+transport in this sandbox.
const account = privateKeyToAccount(privateKey);

const txs = Array.isArray(prepared.transactions) ? prepared.transactions : [prepared.transactions];
const txIds = Array.isArray(prepared.txId) ? prepared.txId : [prepared.txId];

const signedTransactions = [];
for (const tx of txs) {
  const signed = await account.signTransaction({
    to: tx.to,
    value: BigInt(tx.value),
    data: tx.data,
    nonce: tx.nonce,
    chainId: tx.chainId,
    maxFeePerGas: BigInt(tx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
    gas: BigInt(tx.gasLimit),
    type: "eip1559",
  });
  signedTransactions.push(signed);
  console.log("signed one transaction");
}

const apiKey = process.env.BRICKKEN_API_KEY;
const baseUrl = process.env.BRICKKEN_BASE_URL;

const res = await fetch(`${baseUrl}/send-transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
  body: JSON.stringify({
    txId: txIds.length === 1 ? txIds[0] : txIds,
    signedTransactions: signedTransactions.length === 1 ? signedTransactions[0] : signedTransactions,
  }),
});

const body = await res.json();
console.log("send-transactions response:", res.status, JSON.stringify(body, null, 2));
