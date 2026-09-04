# Use case: tokenized recurring revenue

## The asset

A company with predictable recurring revenue (a SaaS subscription book, a signed multi-year service contract, a royalty stream) tokenizes a **revenue-share instrument**: investors buy in during the STO, and receive dividend distributions tied to actual revenue collected each period. This is deliberately close to how Brickken's own STO/dividend flow already works — the innovation in this submission is not a new financial primitive, it's *who is allowed to operate it and how tightly that authority is bounded.*

## Why recurring revenue specifically (vs. real estate, invoices, tickets, a dog)

- It produces **repeated** dividend events rather than one payout — which is what actually motivates having a bounded, autonomous Ops Agent instead of a human clicking "distribute" once. A single-payout asset doesn't need an agent for this; a monthly-distribution asset does.
- It has a **plausible compliance failure mode that isn't hypothetical**: an investor's KYC lapses, a jurisdiction becomes restricted, a sanctions hit appears mid-holding-period. That's exactly the trigger the Compliance Agent needs to be real, and it's a genuine operational problem for an issuer running recurring distributions to potentially hundreds of investors — a human reviewing every distribution cycle for every investor does not scale, which is the actual pitch to an institution.
- It hasn't been used by any of the other public submissions to date (real estate/impact funding, pet economy, event tickets, and a generic issuer client app are all taken).

## The institutional pitch (why a Brickken customer would actually want this)

An issuer running recurring distributions faces a real operational tension: they want distributions to happen on schedule without a human in the loop every cycle, but they cannot hand out unrestricted signing authority to automate it. RAMS mandates are the answer Brickken is proposing at the protocol level (ERC-8226); this build is a concrete demonstration of what that looks like operated end to end — capped payout authority separated from freeze/revoke authority, both separated from mint/burn authority, all provably bounded rather than just documented as a policy.

## What "done" looks like for the demo

1. Asset tokenized, STO run, investors whitelisted and minted — Issuer Agent, funded via its own x402 payment.
2. First dividend round executed by the Ops Agent, under its mandate cap.
3. A compliance signal (KYC expiry / sanctions flag / jurisdiction change — same trigger vocabulary Brickwarden used, but sourced from an actual trigger engine rather than invoked manually) fires and the Compliance Agent revokes/freezes on its own.
4. At least one deliberately out-of-scope action attempted and rejected at the mandate layer, for both subordinate agents, to make the boundary demonstrable rather than asserted.
5. All of the above with real, verifiable Ethereum Sepolia (and/or Base Sepolia, per the Agentic API's supported chains) transaction hashes, plus a small dashboard pulling live state rather than a static replay.
