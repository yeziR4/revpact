import { config, requireConfig } from "../config.js";
import { getDappApi } from "../brickken/dappApiClient.js";
import { agenticApi } from "../brickken/agenticApiClient.js";

/**
 * Issuer Agent orchestration.
 *
 * Run order matters and mirrors docs/architecture.md's sequence diagram:
 *   1. self-fund via x402 faucet
 *   2. register ERC-8004 identity
 *   3. tokenize -> STO -> whitelist -> mint (Dapp API)
 *   4. grant RAMS mandates to the Ops and Compliance agents
 *
 * This is intentionally a readable, step-logged script rather than a hidden
 * framework — for a hackathon submission, a reviewer should be able to read
 * top to bottom and see exactly what happened in what order.
 */

const TOKEN_SYMBOL = "RVP1"; // placeholder revenue-share token symbol — rename per your actual asset

async function main() {
  const issuerAddress = requireConfig(config.agentKeys.issuer, "ISSUER_AGENT_PRIVATE_KEY");
  const opsAddress = requireConfig(config.agentKeys.ops, "OPS_AGENT_PRIVATE_KEY");
  const complianceAddress = requireConfig(config.agentKeys.compliance, "COMPLIANCE_AGENT_PRIVATE_KEY");

  console.log("[issuer] 1/6 funding self via x402 faucet (0.01 USDC -> 100 BKN)...");
  const funding = await agenticApi.fundViaFaucet({ recipientAddress: issuerAddress });
  console.log("[issuer]   funded:", funding);

  console.log("[issuer] 2/6 registering ERC-8004 identity...");
  const identity = await agenticApi.registerAgentIdentity({ agentAddress: issuerAddress });
  console.log("[issuer]   identity:", identity);

  const dappApi = getDappApi();

  console.log(`[issuer] 3/6 tokenizing ${TOKEN_SYMBOL}...`);
  const tokenization = await dappApi.newTokenization({
    signerAddress: issuerAddress,
    tokenSymbol: TOKEN_SYMBOL,
    tokenName: "RevPact Revenue Share",
    maxSupply: "1000000",
  });
  console.log("[issuer]   tokenization prepared:", tokenization);
  // TODO: sign + send via dappApi.sendTransaction(...) once payload shape is confirmed.

  console.log("[issuer] 4/6 launching STO...");
  const sto = await dappApi.newSto({ signerAddress: issuerAddress, tokenSymbol: TOKEN_SYMBOL });
  console.log("[issuer]   STO prepared:", sto);

  console.log("[issuer] 5/6 whitelisting + minting test investor allocations...");
  // Replace with real test investor addresses/emails before running for real.
  const testInvestor = { investorAddress: "0x0000000000000000000000000000000000dEaD", investorEmail: "investor-test@example.com" };
  await dappApi.whitelist({ signerAddress: issuerAddress, tokenSymbol: TOKEN_SYMBOL, ...testInvestor });
  await dappApi.mintToken({
    signerAddress: issuerAddress,
    tokenSymbol: TOKEN_SYMBOL,
    userToMint: [{ ...testInvestor, amount: "100", needWhitelist: false }],
  });

  console.log("[issuer] 6/6 granting RAMS mandates to Ops and Compliance agents...");
  const opsMandate = await agenticApi.grantMandate({
    principalAddress: issuerAddress,
    agentAddress: opsAddress,
    tokenSymbol: TOKEN_SYMBOL,
    allowedMethods: ["dividendDistribution"],
    capAmount: "500", // deliberately below full treasury, so an over-cap attempt has something to be rejected against
  });
  console.log("[issuer]   ops mandate:", opsMandate);

  const complianceMandate = await agenticApi.grantMandate({
    principalAddress: issuerAddress,
    agentAddress: complianceAddress,
    tokenSymbol: TOKEN_SYMBOL,
    allowedMethods: ["freeze", "revoke"],
  });
  console.log("[issuer]   compliance mandate:", complianceMandate);

  console.log("[issuer] done. Hand off to `npm run ops:run` and `npm run compliance:run`.");
}

main().catch((err) => {
  console.error("[issuer] failed:", err);
  process.exitCode = 1;
});
