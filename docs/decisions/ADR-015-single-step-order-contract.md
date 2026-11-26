# ADR-015: Single-step order contract with legacy payment adapter

## Status

Accepted for the frontend target; backend implementation is pending.

## Decision

The product contract creates an order and records its payment method and sender reference in one idempotent request. The current frontend adapter translates that target into the existing backend's `POST /orders` followed by `POST /payments` flow. The adapter surfaces a distinct normalized failure if the second request fails after an order exists, including the saved order identifier for safe support follow-up.

## Consequences

- Price snapshots and final order state remain server-authoritative.
- Live mode cannot guarantee atomic creation/payment submission until the backend offers the target endpoint.
- The UI never suggests payment submission succeeded after the second request fails.
- Manual order, expiry, cancellation, and idempotency remain disabled in live mode while unsupported.
