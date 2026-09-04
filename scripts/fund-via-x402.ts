import { config, requireConfig } from "../src/config.js";
import { agenticApi } from "../src/brickken/agenticApiClient.js";

/**
 * Standalone runner for the challenge's specific self-funding flow: pay
 * 0.01 USDC via x402 to mint 100 BKN on Ethereum Sepolia straight to the
 * issuer agent's wallet. Kept as its own script (rather than only inline in
 * issuerAgent.ts) because this is the single most distinctive, most
 * screenshot/tx-hash-worthy step in the whole submission — worth being able
 * to run and verify in isolation before wiring it into the full sequence.
 */

async function main() {
  const issuerAddress = requireConfig(config.agentKeys.issuer, "ISSUER_AGENT_PRIVATE_KEY");
  console.log(`[fund] requesting x402 faucet mint to ${issuerAddress}...`);
  const result = await agenticApi.fundViaFaucet({ recipientAddress: issuerAddress });
  console.log("[fund] result:", result);
  console.log("[fund] verify both the USDC payment tx and the BKN mint tx on Sepolia Etherscan before moving on.");
}

main().catch((err) => {
  console.error("[fund] failed:", err);
  process.exitCode = 1;
});
