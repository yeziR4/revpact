import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const config = {
  chainId: Number(optional("CHAIN_ID") ?? "11155111"),
  rpc: {
    sepolia: optional("SEPOLIA_RPC_URL"),
    baseSepolia: optional("BASE_SEPOLIA_RPC_URL"),
  },
  dappApi: {
    apiKey: optional("BRICKKEN_API_KEY"),
    baseUrl: optional("BRICKKEN_DAPP_API_BASE_URL") ?? "https://api.brickken.com",
  },
  agenticApi: {
    baseUrl: optional("BRICKKEN_AGENTIC_API_BASE_URL"),
    x402FaucetEndpoint: optional("X402_FAUCET_ENDPOINT"),
  },
  tokens: {
    usdcSepolia: optional("USDC_TOKEN_ADDRESS_SEPOLIA"),
    bknSepolia: optional("BKN_TOKEN_ADDRESS_SEPOLIA"),
  },
  agentKeys: {
    issuer: optional("ISSUER_AGENT_PRIVATE_KEY"),
    ops: optional("OPS_AGENT_PRIVATE_KEY"),
    compliance: optional("COMPLIANCE_AGENT_PRIVATE_KEY"),
  },
  rewardWalletAddress: optional("REWARD_WALLET_ADDRESS"),
};

/**
 * Throws with a clear message if a value this specific call needs is missing,
 * instead of failing deep inside a client with an opaque error.
 */
export function requireConfig<T>(value: T | undefined, envVarHint: string): T {
  if (value === undefined) {
    throw new Error(`Missing config: set ${envVarHint} in .env before running this.`);
  }
  return value;
}

export { required };
