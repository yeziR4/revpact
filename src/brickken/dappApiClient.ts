import { config, requireConfig } from "../config.js";

/**
 * Thin wrapper around Brickken's Dapp API prepare -> sign -> send lifecycle.
 *
 * IMPORTANT: field names below are seeded from payload shapes other Build
 * with Brickken participants reported publicly (e.g. the `approve` payload
 * shared in the programme Discord: chainId, method, signerAddress,
 * tokenizerAddress, tokenSymbol, spenderAddress, amount) and from the
 * general shape described in Brickken's own docs summary (a
 * /prepare-transactions endpoint, plus a method-specific
 * /prepare-transactions/<method> endpoint). NONE of this has been verified
 * against a live account yet — fetching docs.brickken.com directly was
 * blocked in the scaffolding sandbox. Verify every field against the real
 * API reference before the first real call (see docs/build-plan.md, Day 0-1).
 */

export type PrepareResult = {
  transactions: unknown; // reported to sometimes be an object, not an array — see known-issues.md
  txId?: string;
  whitelistTx?: unknown;
  txIdWhitelist?: string;
};

export type ExecutionMode = "client-broadcast" | "server-broadcast";

export interface PreparePayloadBase {
  chainId: string;
  method: string;
  signerAddress: string;
  executionMode?: ExecutionMode;
}

class DappApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = config.dappApi.baseUrl;
    this.apiKey = requireConfig(config.dappApi.apiKey, "BRICKKEN_API_KEY");
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: confirm the auth header name/scheme against docs.brickken.com
        // (commonly "x-api-key" or "Authorization: Bearer <key>")
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Brickken Dapp API ${path} failed: ${res.status} ${text}`);
    }

    return (await res.json()) as T;
  }

  /** Generic prepare call — every typed helper below funnels through this. */
  prepareTransaction<T extends PreparePayloadBase>(payload: T): Promise<PrepareResult> {
    return this.request<PrepareResult>("/prepare-transactions", payload);
  }

  /** Broadcast a signed transaction prepared above. */
  sendTransaction(payload: { chainId: string; txId: string; signedTx: string }): Promise<unknown> {
    return this.request("/send-transactions", payload);
  }

  getTokenInfo(tokenSymbol?: string): Promise<unknown> {
    const qs = tokenSymbol ? `?tokenSymbol=${encodeURIComponent(tokenSymbol)}` : "";
    return this.request(`/get-token-info${qs}`, {});
  }

  // --- Typed convenience wrappers over prepareTransaction ---
  // Field lists are best-effort placeholders — extend/correct per the real
  // schema once verified.

  newTokenization(params: {
    signerAddress: string;
    tokenSymbol: string;
    tokenName: string;
    maxSupply: string;
    [key: string]: unknown;
  }) {
    return this.prepareTransaction({
      chainId: String(config.chainId),
      method: "newTokenization",
      ...params,
    });
  }

  newSto(params: { signerAddress: string; tokenSymbol: string; [key: string]: unknown }) {
    return this.prepareTransaction({
      chainId: String(config.chainId),
      method: "newSto",
      ...params,
    });
  }

  whitelist(params: {
    signerAddress: string;
    tokenSymbol: string;
    investorAddress: string;
    investorEmail: string;
    [key: string]: unknown;
  }) {
    return this.prepareTransaction({
      chainId: String(config.chainId),
      method: "whitelist",
      ...params,
    });
  }

  mintToken(params: {
    signerAddress: string;
    tokenSymbol: string;
    userToMint: Array<{
      investorEmail: string;
      investorAddress: string;
      amount: string;
      needWhitelist?: boolean;
    }>;
    executionMode?: ExecutionMode;
  }) {
    return this.prepareTransaction({
      chainId: String(config.chainId),
      method: "mintToken",
      ...params,
    });
  }

  burnToken(params: {
    signerAddress: string;
    tokenSymbol: string;
    amount: string;
    [key: string]: unknown;
  }) {
    return this.prepareTransaction({
      chainId: String(config.chainId),
      method: "burnToken",
      ...params,
    });
  }

  approve(params: {
    signerAddress: string;
    tokenizerAddress: string;
    tokenSymbol: string;
    spenderAddress: string;
    amount: string;
  }) {
    // NOTE: known quirk — the sandbox payment-token contract has been
    // reported to revert on approve(nonZero) when current allowance is
    // already non-zero. Reset to "0" first, wait for confirmation, then
    // approve the real amount. See known-issues.md.
    return this.prepareTransaction({
      chainId: String(config.chainId),
      method: "approve",
      ...params,
    });
  }

  dividendDistribution(params: {
    signerAddress: string;
    tokenSymbol: string;
    paymentTokenSymbol: string;
    amount: string;
    [key: string]: unknown;
  }) {
    return this.prepareTransaction({
      chainId: String(config.chainId),
      method: "dividendDistribution",
      ...params,
    });
  }
}

let _dappApi: DappApiClient | undefined;

/** Lazy singleton — constructed on first use, not on import, so scripts
 * that don't need the Dapp API can still import this module before .env
 * is fully filled in. */
export function getDappApi(): DappApiClient {
  if (!_dappApi) _dappApi = new DappApiClient();
  return _dappApi;
}
