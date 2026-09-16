/**
 * The compliance trigger, live.
 *
 * `triggerEngine.ts` was written early in this build and never wired to
 * anything — dead code, evaluated by nothing. Every revoke so far in this
 * project (docs/transactions.md steps 15 and the LLM stress test's implicit
 * trust in the mandate holding) happened because a human ran a script that
 * already knew the outcome. That's not what Brickken's own framing asks
 * for ("a compliance action executes autonomously, from a trigger") and
 * it's not what this file's own docstring promised either.
 *
 * This closes that gap for real: an HTTP endpoint receives a compliance
 * event from an external caller, `evaluate()` decides what it means with
 * zero human input, and if the verdict calls for it, this process signs
 * and sends a real `ramsRevokeMandate` transaction itself — the Compliance
 * Agent's one and only on-chain power, exercised because a rule fired, not
 * because someone typed the answer into a terminal.
 *
 * The original action vocabulary (revoke_whitelist / burn / freeze) was
 * written with broader Dapp API concepts in mind. In this build the
 * Compliance Agent has exactly one real lever -- ramsRevokeMandate -- so
 * every non-trivial verdict here routes to that single action. Stated
 * plainly, not hidden: this server doesn't distinguish action types, only
 * whether the rule table says something needs to happen.
 *
 * Usage: npx tsx src/rules/server.ts
 * Then:  curl -X POST http://localhost:8787/compliance-webhook \
 *          -H 'Content-Type: application/json' \
 *          -d '{"tokenSymbol":"RVP1","investorAddress":"0x...","severity":"high","reason":"sanctions_flag"}'
 */
import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { privateKeyToAccount } from "viem/accounts";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { writeFileSync } from "node:fs";
import { evaluate, type ComplianceEvent, type ComplianceAction } from "./triggerEngine.js";

if (process.env.HTTPS_PROXY) setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));

const PORT = Number(process.env.COMPLIANCE_WEBHOOK_PORT || 8787);
const baseUrl = process.env.BRICKKEN_BASE_URL!;
const apiKey = process.env.BRICKKEN_API_KEY!;
const chainHex = process.env.CHAIN_ID_SEPOLIA_HEX!;
const complianceAccount = privateKeyToAccount(process.env.COMPLIANCE_AGENT_PRIVATE_KEY as `0x${string}`);
const ISSUER = process.env.ISSUER_AGENT_ADDRESS!;
const OPS_AGENT = process.env.OPS_AGENT_ADDRESS!;

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function revokeLive(event: ComplianceEvent, action: ComplianceAction) {
  console.log(`[trigger] verdict: ${action}. Calling ramsRevokeMandate autonomously -- no human chose this outcome.`);

  const body = {
    chainId: chainHex,
    method: "ramsRevokeMandate",
    principal: ISSUER,
    signerAddress: complianceAccount.address,
    agent: OPS_AGENT,
  };
  const prepRes = await fetch(`${baseUrl}/prepare-transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(body),
  });
  const prepBody = await prepRes.json();
  if (!prepRes.ok) {
    console.log(`[trigger] prepare failed (mandate may already be revoked):`, JSON.stringify(prepBody));
    return { verdict: action, executed: false, reason: "prepare_failed", response: prepBody };
  }

  const txs = Array.isArray(prepBody.transactions) ? prepBody.transactions : [prepBody.transactions];
  const txIds = Array.isArray(prepBody.txId) ? prepBody.txId : [prepBody.txId];
  const signedTransactions = [];
  for (const tx of txs) {
    const signed = await complianceAccount.signTransaction({
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
  const hashes = (sendBody.results ?? []).flatMap((r: any) => r.result?.txResponses ?? []).map((t: any) => t.hash);
  console.log(`[trigger] sent. hash(es):`, hashes);
  return { verdict: action, executed: sendRes.ok, hashes, response: sendBody };
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== "POST" || req.url !== "/compliance-webhook") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "POST /compliance-webhook only" }));
    return;
  }
  try {
    const raw = await readBody(req);
    const event: ComplianceEvent = JSON.parse(raw);
    console.log(`\n[trigger] inbound event:`, event);

    const action = evaluate(event);
    console.log(`[trigger] evaluate() says: ${action}`);

    const result = await revokeLive(event, action);
    const record = { receivedAt: new Date().toISOString(), event, action, result };
    writeFileSync(`docs/evidence/compliance-trigger-${Date.now()}.json`, JSON.stringify(record, null, 2));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(record, null, 2));
  } catch (err: any) {
    console.error(`[trigger] error:`, err.message);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`[trigger] compliance webhook listening on http://localhost:${PORT}/compliance-webhook`);
  console.log(`[trigger] waiting for a real inbound event -- nothing fires until one arrives.`);
});
