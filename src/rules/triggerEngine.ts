/**
 * Minimal compliance trigger engine.
 *
 * Deliberately simple: a rule table plus a small HTTP endpoint, so the
 * Compliance Agent's action is driven by a real inbound signal rather than
 * a human invoking it in the demo. Swap `evaluate` for a real data source
 * (a KYC-expiry check, a sanctions-list lookup) once time allows — the
 * important property to preserve is that something *other than the
 * operator* decides and calls the Compliance Agent.
 */

export type Severity = "low" | "medium" | "high";
export type ComplianceReason = "kyc_expired" | "sanctions_flag" | "jurisdiction_change";

export interface ComplianceEvent {
  tokenSymbol: string;
  investorAddress: string;
  severity: Severity;
  reason: ComplianceReason;
}

export type ComplianceAction = "revoke_whitelist" | "burn" | "freeze";

const RULES: Record<ComplianceReason, Record<Severity, ComplianceAction>> = {
  kyc_expired: { low: "revoke_whitelist", medium: "revoke_whitelist", high: "burn" },
  sanctions_flag: { low: "freeze", medium: "freeze", high: "burn" },
  jurisdiction_change: { low: "revoke_whitelist", medium: "revoke_whitelist", high: "revoke_whitelist" },
};

export function evaluate(event: ComplianceEvent): ComplianceAction {
  return RULES[event.reason][event.severity];
}
