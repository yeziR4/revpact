#!/usr/bin/env node
// Build and send a real x402 "exact"/EIP-3009 payment against a Brickken
// endpoint that returned a 402 PAYMENT-REQUIRED challenge, then retry the
// original request with the signed X-PAYMENT header attached.
//
// Usage: node scripts/x402-pay.mjs <method> <url> <bodyJsonFile> <PRIVATE_KEY_ENV_VAR>
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { ProxyAgent, setGlobalDispatcher } from "undici";

if (process.env.HTTPS_PROXY) setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));

const [, , method, url, bodyFile, pkEnvVar, extraHeadersFile] = process.argv;
if (!method || !url || !bodyFile || !pkEnvVar) {
  console.error("Usage: node scripts/x402-pay.mjs <METHOD> <url> <bodyJsonFile> <PRIVATE_KEY_ENV_VAR> [extraHeadersFile]");
  process.exit(1);
}

const privateKey = process.env[pkEnvVar];
if (!privateKey) throw new Error(`Missing env var ${pkEnvVar}`);
const account = privateKeyToAccount(privateKey);
const body = JSON.parse(readFileSync(bodyFile, "utf8"));
const staticExtraHeaders = extraHeadersFile ? JSON.parse(readFileSync(extraHeadersFile, "utf8")) : {};

async function attempt(headers) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...staticExtraHeaders, ...headers },
    body: JSON.stringify(body),
  });
  return res;
}

console.log(`[x402] first attempt (no payment) as ${account.address} -> ${method} ${url}`);
let res = await attempt({});
console.log("status:", res.status);

if (res.status !== 402) {
  console.log("Did not get a 402 challenge. Body:", await res.text());
  process.exit(res.ok ? 0 : 1);
}

const paymentRequiredB64 = res.headers.get("payment-required");
const bodyText = await res.text();
console.log("402 body:", bodyText);

let requirements, resource;
if (paymentRequiredB64) {
  const decoded = JSON.parse(Buffer.from(paymentRequiredB64, "base64").toString("utf8"));
  requirements = decoded.accepts[0];
  resource = decoded.resource;
} else {
  // some routes only surface it in the JSON body under x402Requirements
  requirements = JSON.parse(bodyText).x402Requirements?.[0];
  resource = { url };
}
if (!requirements) throw new Error("No x402 requirements found in 402 response");
console.log("[x402] requirements:", JSON.stringify(requirements, null, 2));

const { network, asset, amount, payTo, maxTimeoutSeconds, extra } = requirements;
const chainId = Number(network.split(":")[1]);

const now = Math.floor(Date.now() / 1000);
const validAfter = 0n;
const validBefore = BigInt(now + (maxTimeoutSeconds || 300));
const nonce = "0x" + randomBytes(32).toString("hex");

const domain = {
  name: extra.name,
  version: extra.version,
  chainId,
  verifyingContract: asset,
};
const types = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};
const message = {
  from: account.address,
  to: payTo,
  value: BigInt(amount),
  validAfter,
  validBefore,
  nonce,
};

const signature = await account.signTypedData({
  domain,
  types,
  primaryType: "TransferWithAuthorization",
  message,
});

const paymentPayload = {
  x402Version: 2,
  resource,
  scheme: requirements.scheme,
  network,
  accepted: requirements,
  payload: {
    signature,
    authorization: {
      from: message.from,
      to: message.to,
      value: amount,
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce,
    },
  },
};
const xPayment = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

console.log("[x402] retrying with X-PAYMENT ...");
res = await attempt({ "X-PAYMENT": xPayment });
console.log("status:", res.status);
console.log("body:", await res.text());
