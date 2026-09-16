#!/usr/bin/env node
// Demonstrates RAMS's second signing mode: the principal signs an
// EIP-712 typed-data payload OFF-CHAIN -- no transaction, no gas spent by
// the principal at all -- and a completely different wallet then broadcasts
// it. That broadcaster gains no new authority by doing so; it's paying gas
// to relay an already-authorized message, not authorizing anything itself.
// We use the Compliance Agent as the broadcaster specifically because it
// has zero payout power in this system, to make that distinction visible:
// submitting a signed extend-mandate tx does not grant it one.
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { writeFileSync } from "node:fs";

if (process.env.HTTPS_PROXY) setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));

const baseUrl = process.env.BRICKKEN_BASE_URL;
const apiKey = process.env.BRICKKEN_API_KEY;
const chainHex = process.env.CHAIN_ID_SEPOLIA_HEX;
const issuer = privateKeyToAccount(process.env.ISSUER_AGENT_PRIVATE_KEY);
const complianceBroadcaster = privateKeyToAccount(process.env.COMPLIANCE_AGENT_PRIVATE_KEY);
const OPS_AGENT = process.env.OPS_AGENT_ADDRESS;

// ---- 1. Read current mandate state ----
const mandRes = await fetch(`${baseUrl}/rams/mandate?chainId=aa36a7&agent=${OPS_AGENT}&principal=${issuer.address}`, {
  headers: { "x-api-key": apiKey },
});
const mand = await mandRes.json();
console.log(`[extend] current validUntil: ${mand.mandate.validUntil} (${new Date(mand.mandate.validUntil * 1000).toISOString()})`);
const newValidUntil = String(Number(mand.mandate.validUntil) + 3600);

// ---- 2. Fetch the typed-data envelope (this is what the principal signs) ----
const typedDataUrl = `${baseUrl}/rams/typed-data/extend-mandate?chainId=aa36a7&agent=${OPS_AGENT}&principal=${issuer.address}&newValidUntil=${newValidUntil}`;
const envRes = await fetch(typedDataUrl, { headers: { "x-api-key": apiKey } });
const env = await envRes.json();
console.log(`[extend] fetched typed-data envelope. deadline=${env.deadline}, nonce=${env.typedData.message.nonce}`);

// ---- 3. The PRINCIPAL signs OFF-CHAIN. No transaction. No gas. ----
// Coerce numeric fields explicitly: the REST envelope serializes uint256/
// uint48 values as JSON (a mix of strings and numbers), but EIP-712 hashing
// needs exact, consistent numeric types (chainId as a number, uint256/
// uint48 fields as bigint) or the recovered signer won't match.
const domain = {
  ...env.typedData.domain,
  chainId: Number(env.typedData.domain.chainId),
};
const message = {
  agent: env.typedData.message.agent,
  principal: env.typedData.message.principal,
  newValidUntil: BigInt(env.typedData.message.newValidUntil),
  nonce: BigInt(env.typedData.message.nonce),
  deadline: BigInt(env.typedData.message.deadline),
};
const signature = await issuer.signTypedData({
  domain,
  types: env.typedData.types,
  primaryType: env.typedData.primaryType,
  message,
});
console.log(`[extend] issuer signed off-chain (zero gas spent by the principal): ${signature.slice(0, 20)}...`);

// ---- 4. A DIFFERENT wallet -- the Compliance Agent, zero payout power --
//         prepares and broadcasts the already-authorized change. ----
const body = {
  chainId: chainHex,
  method: "ramsExtendMandate",
  signerAddress: complianceBroadcaster.address,
  agent: OPS_AGENT,
  principal: issuer.address,
  newValidUntil,
  deadline: env.deadline,
  signature,
};
console.log(`[extend] broadcasting via ${complianceBroadcaster.address} (Compliance Agent -- has no payout power, only relaying) ...`);
const prepRes = await fetch(`${baseUrl}/prepare-transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
  body: JSON.stringify(body),
});
const prep = await prepRes.json();
if (!prepRes.ok) {
  console.log(`[extend] prepare failed:`, JSON.stringify(prep, null, 2));
  process.exit(1);
}

const txs = Array.isArray(prep.transactions) ? prep.transactions : [prep.transactions];
const txIds = Array.isArray(prep.txId) ? prep.txId : [prep.txId];
const signedTransactions = [];
for (const tx of txs) {
  const signed = await complianceBroadcaster.signTransaction({
    to: tx.to, data: tx.data, value: BigInt(tx.value ?? "0x0"),
    nonce: tx.nonce, chainId: tx.chainId,
    maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas), maxFeePerGas: BigInt(tx.maxFeePerGas),
    gas: BigInt(tx.gasLimit), type: "eip1559",
  });
  signedTransactions.push(signed);
}
const sendRes = await fetch(`${baseUrl}/send-transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
  body: JSON.stringify({
    txId: txIds.length === 1 ? txIds[0] : txIds,
    signedTransactions: signedTransactions.length === 1 ? signedTransactions[0] : signedTransactions,
  }),
});
const sendBody = await sendRes.json();
const hashes = (sendBody.results ?? []).flatMap((r) => r.result?.txResponses ?? []).map((t) => t.hash);
console.log(`[extend] send result:`, sendRes.ok ? "success" : "failed", hashes);

// ---- 5. Verify the extension actually landed ----
const verifyRes = await fetch(`${baseUrl}/rams/mandate?chainId=aa36a7&agent=${OPS_AGENT}&principal=${issuer.address}`, {
  headers: { "x-api-key": apiKey },
});
const verify = await verifyRes.json();
console.log(`[extend] new validUntil: ${verify.mandate.validUntil} (${new Date(verify.mandate.validUntil * 1000).toISOString()})`);

const record = {
  broadcaster: complianceBroadcaster.address,
  broadcasterRole: "Compliance Agent -- gained no new authority, only relayed an already-signed message",
  principalSigner: issuer.address,
  offChainSignature: signature,
  oldValidUntil: mand.mandate.validUntil,
  requestedNewValidUntil: Number(newValidUntil),
  confirmedNewValidUntil: verify.mandate.validUntil,
  hashes,
  sendResponse: sendBody,
};
writeFileSync(`docs/evidence/extend-via-signature-${Date.now()}.json`, JSON.stringify(record, null, 2));
console.log(`[extend] evidence saved.`);
