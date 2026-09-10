#!/usr/bin/env node
// Mints test USDT directly on the sandbox mock token (open mint(address,uint256),
// no access control -- see known-issues.md for the correction on this).
// Usage: node scripts/mint-usdt.mjs <RECIPIENT_ADDRESS_ENV_VAR> <PRIVATE_KEY_ENV_VAR> <amount>
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { encodeFunctionData, keccak256, toBytes } from "viem";
import { ProxyAgent, setGlobalDispatcher } from "undici";

if (process.env.HTTPS_PROXY) setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));

const [, , recipientEnvVar, pkEnvVar, amountArg] = process.argv;
if (!recipientEnvVar || !pkEnvVar || !amountArg) {
  console.error("Usage: node scripts/mint-usdt.mjs <RECIPIENT_ADDRESS_ENV_VAR> <PRIVATE_KEY_ENV_VAR> <amount>");
  process.exit(1);
}

const USDT = "0x28d2B01854D0aBec267a3DDcad9163580E6E8604";
const recipient = process.env[recipientEnvVar];
const privateKey = process.env[pkEnvVar];
const account = privateKeyToAccount(privateKey);

const amountRaw = BigInt(Math.round(parseFloat(amountArg) * 1_000_000)); // 6 decimals
const data = encodeFunctionData({
  abi: [{ name: "mint", type: "function", inputs: [{ type: "address" }, { type: "uint256" }] }],
  functionName: "mint",
  args: [recipient, amountRaw],
});

const rpc = process.env.SEPOLIA_RPC_URL;
async function rpcCall(method, params) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const body = await res.json();
  if (body.error) throw new Error(JSON.stringify(body.error));
  return body.result;
}

const nonce = parseInt(await rpcCall("eth_getTransactionCount", [account.address, "latest"]), 16);
const feeHistory = await rpcCall("eth_gasPrice", []);
const gasPrice = BigInt(feeHistory);

console.log(`[mint] minting ${amountArg} USDT (${amountRaw} raw) to ${recipient}, nonce ${nonce}...`);

const signed = await account.signTransaction({
  to: USDT,
  data,
  value: 0n,
  nonce,
  chainId: 11155111,
  maxFeePerGas: gasPrice * 2n,
  maxPriorityFeePerGas: gasPrice,
  gas: 100000n,
  type: "eip1559",
});

const txHash = await rpcCall("eth_sendRawTransaction", [signed]);
console.log("[mint] broadcast:", txHash);
console.log(`[mint] verify: https://sepolia.etherscan.io/tx/${txHash}`);
