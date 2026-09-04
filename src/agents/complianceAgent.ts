import { createServer } from "node:http";
import { config, requireConfig } from "../config.js";
import { agenticApi } from "../brickken/agenticApiClient.js";
import { evaluate, type ComplianceEvent } from "../rules/triggerEngine.js";

/**
 * Compliance Agent: listens for compliance signals on a small local HTTP
 * endpoint and acts under its RAMS mandate (freeze/revoke only) without any
 * other agent or the operator being in that call path. POST a
 * ComplianceEvent JSON body to trigger it — that's the "trigger engine"
 * from docs/architecture.md, kept intentionally swappable for a real
 * external signal later.
 */

const PORT = Number(process.env.COMPLIANCE_AGENT_PORT ?? 8787);

async function handleEvent(event: ComplianceEvent) {
  const complianceAddress = requireConfig(config.agentKeys.compliance, "COMPLIANCE_AGENT_PRIVATE_KEY");
  const mandateId = requireConfig(process.env.COMPLIANCE_MANDATE_ID, "COMPLIANCE_MANDATE_ID (set after issuer:run prints it)");

  const action = evaluate(event);
  console.log(`[compliance] event ${event.reason}/${event.severity} on ${event.tokenSymbol} -> action: ${action}`);

  if (action === "burn") {
    // Deliberately out of this agent's mandate (mint/burn stays with the
    // Issuer Agent) — expect this to be rejected, and log it as such rather
    // than silently falling back, so the boundary stays visible.
    console.log("[compliance] burn is outside this mandate's scope by design; escalating instead of executing.");
    return;
  }

  const method = action === "freeze" ? "freeze" : "revoke";
  const result = await agenticApi.executeUnderMandate({
    agentAddress: complianceAddress,
    mandateId,
    method,
    payload: { tokenSymbol: event.tokenSymbol, investorAddress: event.investorAddress },
  });
  console.log(`[compliance] ${method} executed:`, result);
}

const server = createServer((req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405).end("POST a ComplianceEvent JSON body");
    return;
  }
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    handleEvent(JSON.parse(body) as ComplianceEvent)
      .then(() => res.writeHead(200).end("ok"))
      .catch((err) => {
        console.error("[compliance] error handling event:", err);
        res.writeHead(500).end(String(err));
      });
  });
});

server.listen(PORT, () => {
  console.log(`[compliance] listening on :${PORT} for compliance events`);
  console.log(`[compliance] example: curl -X POST localhost:${PORT} -d '{"tokenSymbol":"RVP1","investorAddress":"0x...","severity":"high","reason":"sanctions_flag"}'`);
});
