# ADR-009: Auth capabilities and adapters

## Status

Accepted for F2.

## Decision

Authentication screens use one target contract. `packages/api` exposes capability flags for current backend gaps and adapts legacy routes, request bodies, response envelopes, headers, and identifiable errors. Components and pages do not branch on backend mode. Mock mode enables target capabilities; live mode defaults them off until the backend implements them, and public Vite flags can selectively enable them.

## Consequences

- The frontend can exercise the target flow in MSW without claiming that the current backend supports email OTP, refresh cookies, public catalog access, student profile fields, or device change requests.
- Live adapters omit fields rejected by current endpoints and present unavailable capabilities as localized states.
- Backend evidence and unresolved target-contract details are kept in `docs/contract-differences.md` and `docs/api-target-auth.md`.
