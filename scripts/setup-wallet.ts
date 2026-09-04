import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

/**
 * Generates three fresh testnet wallets — one per agent — and prints them
 * so they can be pasted into .env. Separate keys per agent matter here: the
 * whole point of the RAMS demo is that authority is delegated and bounded,
 * not that one wallet does everything, so don't collapse these back into a
 * single key even though it would be simpler.
 *
 * These are testnet-only keys. Never fund them with real assets, never
 * reuse a mainnet key here.
 */

for (const role of ["ISSUER", "OPS", "COMPLIANCE"] as const) {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  console.log(`${role}_AGENT_PRIVATE_KEY=${privateKey}`);
  console.log(`# ${role} address: ${account.address}`);
  console.log("");
}

console.log("Paste the *_PRIVATE_KEY lines into .env. Fund each address with Sepolia ETH");
console.log("from a public faucet before running any agent scripts (gas for registration");
console.log("and any calls not covered by the x402 flow).");
