import { config, requireConfig } from "../config.js";
import { x402Fetch } from "./x402.js";

/**
 * Brickken Agentic API: ERC-8004 identity + RAMS (ERC-8226) mandate
 * operations. Method/endpoint names are placeholders pending verification
 * against docs.brickken.com / the Brickken MCP server — see
 * docs/architecture.md "Open verification items". ERC-8226 itself names the
 * on-chain mandate operations grantMandate / revokeMandate / extendMandate;
 * confirm the Brickken API surfaces these under the same names before
 * relying on the method strings below.
 */

function baseUrl(): string {
  return requireConfig(config.agenticApi.baseUrl, "BRICKKEN_AGENTIC_API_BASE_URL");
}

async function paidPost<T>(path: string, body: unknown): Promise<T> {
  const res = await x402Fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Brickken Agentic API ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export const agenticApi = {
  /** Register an ERC-8004 identity for the calling agent's wallet. */
  registerAgentIdentity(params: { agentAddress: string; metadataUri?: string }) {
    return paidPost("/erc8004/register", params);
  },

  /**
   * Pay 0.01 USDC via x402 to mint 100 BKN on Ethereum Sepolia to the given
   * wallet — the challenge's specific "agent funds itself" faucet flow.
   */
  fundViaFaucet(params: { recipientAddress: string }) {
    const endpoint = requireConfig(config.agenticApi.x402FaucetEndpoint, "X402_FAUCET_ENDPOINT");
    return paidPost(endpoint, params);
  },

  /** Issuer grants a scoped, capped, time-bounded mandate to a subordinate agent. */
  grantMandate(params: {
    principalAddress: string;
    agentAddress: string;
    tokenSymbol: string;
    allowedMethods: string[]; // e.g. ["dividendDistribution"] or ["freeze", "revoke"]
    capAmount?: string;
    validUntil?: string; // ISO timestamp
  }) {
    return paidPost("/rams/grant-mandate", params);
  },

  /** Execute an action under an existing mandate (the mandated agent calls this, not the principal). */
  executeUnderMandate(params: {
    agentAddress: string;
    mandateId: string;
    method: string;
    payload: Record<string, unknown>;
  }) {
    return paidPost("/rams/execute", params);
  },

  /** Revoke a mandate — used by the Compliance Agent, or by the issuer to reclaim authority. */
  revokeMandate(params: { principalOrApprovedOperator: string; mandateId: string; reason?: string }) {
    return paidPost("/rams/revoke-mandate", params);
  },

  extendMandate(params: { principalOrApprovedOperator: string; mandateId: string; newValidUntil: string }) {
    return paidPost("/rams/extend-mandate", params);
  },
};
