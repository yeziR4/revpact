import { createWalletClient, http, type Hex, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { config, requireConfig } from "../config.js";

/**
 * Hand-rolled x402 ("HTTP 402 Payment Required") client, following the
 * publicly documented x402 protocol shape (402 response carries an
 * `accepts` array of payment requirements; client replies with a signed
 * EIP-3009 `transferWithAuthorization` payload in an `X-PAYMENT` header).
 *
 * NOT verified against Brickken's actual x402 endpoints yet — that requires
 * a live API key/wallet, which this scaffold doesn't have. Before relying on
 * this:
 *   1. Check whether Brickken's CLI, MCP server, or an official SDK already
 *      handles x402 signing for you — that's very likely the intended path
 *      ("Wallet-signed, x402 payment flow" is listed as a first-class access
 *      mode) and would be far less risky than this hand-rolled version.
 *   2. If hitting HTTP directly is still needed, verify the exact 402
 *      response shape and required header name against a real call and
 *      adjust `parsePaymentRequirements` / `buildPaymentHeader` accordingly.
 */

export interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  payTo: Hex;
  asset: Hex;
  maxTimeoutSeconds?: number;
  extra?: { name?: string; version?: string };
}

interface PaymentRequiredBody {
  x402Version: number;
  accepts: PaymentRequirement[];
}

function getPayerAccount() {
  const key = requireConfig(config.agentKeys.issuer, "ISSUER_AGENT_PRIVATE_KEY") as Hex;
  return privateKeyToAccount(key);
}

function getWalletClient(): WalletClient {
  return createWalletClient({
    account: getPayerAccount(),
    chain: sepolia,
    transport: http(config.rpc.sepolia),
  });
}

async function signTransferAuthorization(
  requirement: PaymentRequirement,
  walletClient: WalletClient
) {
  const account = getPayerAccount();
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const nonceHex = ("0x" +
    Array.from(nonce)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")) as Hex;

  const authorization = {
    from: account.address,
    to: requirement.payTo,
    value: BigInt(requirement.maxAmountRequired),
    validAfter: BigInt(now - 60),
    validBefore: BigInt(now + (requirement.maxTimeoutSeconds ?? 300)),
    nonce: nonceHex,
  };

  // EIP-3009 TransferWithAuthorization typed data. `name`/`version` come
  // from the 402 response's `extra` field per the x402 spec — verify these
  // match the actual asset contract's EIP-712 domain before trusting a
  // signature built this way.
  const signature = await walletClient.signTypedData({
    account,
    domain: {
      name: requirement.extra?.name ?? "USD Coin",
      version: requirement.extra?.version ?? "2",
      chainId: sepolia.id,
      verifyingContract: requirement.asset,
    },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: authorization,
  });

  return { signature, authorization };
}

function buildPaymentHeader(
  requirement: PaymentRequirement,
  signed: Awaited<ReturnType<typeof signTransferAuthorization>>
): string {
  const payload = {
    x402Version: 1,
    scheme: requirement.scheme,
    network: requirement.network,
    payload: {
      signature: signed.signature,
      authorization: {
        from: signed.authorization.from,
        to: signed.authorization.to,
        value: signed.authorization.value.toString(),
        validAfter: signed.authorization.validAfter.toString(),
        validBefore: signed.authorization.validBefore.toString(),
        nonce: signed.authorization.nonce,
      },
    },
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Fetch a URL, and if it responds 402, sign the requested payment and
 * retry once with the payment header attached. Returns the final response.
 */
export async function x402Fetch(url: string, init: RequestInit = {}): Promise<Response> {
  const first = await fetch(url, init);
  if (first.status !== 402) return first;

  const body = (await first.json()) as PaymentRequiredBody;
  const requirement = body.accepts[0];
  if (!requirement) {
    throw new Error("402 response had no payment requirements in `accepts`");
  }

  const walletClient = getWalletClient();
  const signed = await signTransferAuthorization(requirement, walletClient);
  const paymentHeader = buildPaymentHeader(requirement, signed);

  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "X-PAYMENT": paymentHeader,
    },
  });
}
