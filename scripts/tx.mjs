#!/usr/bin/env node
// Reusable Brickken Dapp API transaction runner: prepare -> sign -> send -> poll.
// Usage: node scripts/tx.mjs <method> <payload.json> <PRIVATE_KEY_ENV_VAR> [--wait]
//   payload.json holds every prepare-transactions field EXCEPT chainId/method/
//   signerAddress, which this script fills in from env (chainId hex) and from
//   the wallet derived from PRIVATE_KEY_ENV_VAR.
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync } from "node:fs";
import { ProxyAgent, setGlobalDispatcher } from "undici";

if (process.env.HTTPS_PROXY) setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));

const [, , method, payloadFile, pkEnvVar, ...flags] = process.argv;
if (!method || !payloadFile || !pkEnvVar) {
  console.error("Usage: node scripts/tx.mjs <method> <payload.json> <PRIVATE_KEY_ENV_VAR> [--wait]");
  process.exit(1);
}

const apiKey = process.env.BRICKKEN_API_KEY;
const baseUrl = process.env.BRICKKEN_BASE_URL;
const chainIdHex = process.env.CHAIN_ID_SEPOLIA_HEX;
const privateKey = process.env[pkEnvVar];
if (!privateKey) throw new Error(`Missing env var ${pkEnvVar}`);
const account = privateKeyToAccount(privateKey);

const extraPayload = JSON.parse(readFileSync(payloadFile, "utf8"));
const body = {
  chainId: chainIdHex,
  method,
  signerAddress: account.address,
  ...extraPayload,
};

console.log(`[tx] preparing ${method} as ${account.address} ...`);
const prepareRes = await fetch(`${baseUrl}/prepare-transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
  body: JSON.stringify(body),
});
const prepared = await prepareRes.json();
if (!prepareRes.ok) {
  console.error("[tx] prepare failed:", prepareRes.status, JSON.stringify(prepared, null, 2));
  process.exit(1);
}
console.log("[tx] prepared. txId:", prepared.txId);

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
}
console.log(`[tx] signed ${signedTransactions.length} transaction(s)`);

const sendRes = await fetch(`${baseUrl}/send-transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
  body: JSON.stringify({
    txId: txIds.length === 1 ? txIds[0] : txIds,
    signedTransactions: signedTransactions.length === 1 ? signedTransactions[0] : signedTransactions,
  }),
});
const sent = await sendRes.json();
console.log("[tx] send-transactions:", sendRes.status, JSON.stringify(sent, null, 2));

const outFile = `docs/evidence/${method}-${Date.now()}.json`;
writeFileSync(outFile, JSON.stringify({ prepared, sent }, null, 2));
console.log(`[tx] saved full result to ${outFile}`);

const hashes = (sent.results ?? [])
  .flatMap((r) => r.result?.txResponses ?? [])
  .map((t) => t.hash);
console.log("[tx] transaction hash(es):", hashes);

if (flags.includes("--wait") && hashes.length) {
  console.log("[tx] waiting for confirmation via get-transaction-status...");
  for (const id of txIds) {
    let status = "pending";
    for (let i = 0; i < 40 && status === "pending"; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const s = await fetch(`${baseUrl}/get-transaction-status?txId=${id}`, {
        headers: { "x-api-key": apiKey },
      }).then((r) => r.json());
      status = s.status;
      console.log(`[tx]   ${id} -> ${status}`);
    }
  }
}
