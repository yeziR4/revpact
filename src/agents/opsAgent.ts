import { config, requireConfig } from "../config.js";
import { agenticApi } from "../brickken/agenticApiClient.js";

/**
 * Ops Agent: may only execute dividend distributions, under the mandate
 * granted by the Issuer Agent, up to the mandate's cap. Demonstrates two
 * things on purpose:
 *   1. An in-mandate payout succeeding.
 *   2. An over-cap / out-of-scope attempt being rejected by the mandate
 *      layer itself, not by an app-side guard — see docs/architecture.md.
 */

const TOKEN_SYMBOL = "RVP1";

async function main() {
  const opsAddress = requireConfig(config.agentKeys.ops, "OPS_AGENT_PRIVATE_KEY");
  const mandateId = requireConfig(process.env.OPS_MANDATE_ID, "OPS_MANDATE_ID (set after issuer:run prints it)");

  console.log("[ops] executing in-mandate dividend distribution...");
  const inScope = await agenticApi.executeUnderMandate({
    agentAddress: opsAddress,
    mandateId,
    method: "dividendDistribution",
    payload: { tokenSymbol: TOKEN_SYMBOL, paymentTokenSymbol: "USDC", amount: "100" },
  });
  console.log("[ops]   result:", inScope);

  console.log("[ops] attempting an over-cap distribution (expected to be rejected)...");
  try {
    const overCap = await agenticApi.executeUnderMandate({
      agentAddress: opsAddress,
      mandateId,
      method: "dividendDistribution",
      payload: { tokenSymbol: TOKEN_SYMBOL, paymentTokenSymbol: "USDC", amount: "999999" },
    });
    console.warn("[ops]   UNEXPECTED: over-cap call succeeded:", overCap);
  } catch (err) {
    console.log("[ops]   correctly rejected:", err);
  }

  console.log("[ops] attempting an out-of-scope mint (expected to be rejected)...");
  try {
    const outOfScope = await agenticApi.executeUnderMandate({
      agentAddress: opsAddress,
      mandateId,
      method: "mintToken",
      payload: { tokenSymbol: TOKEN_SYMBOL, amount: "1000" },
    });
    console.warn("[ops]   UNEXPECTED: out-of-scope call succeeded:", outOfScope);
  } catch (err) {
    console.log("[ops]   correctly rejected:", err);
  }
}

main().catch((err) => {
  console.error("[ops] failed:", err);
  process.exitCode = 1;
});
