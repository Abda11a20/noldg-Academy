# ADR-016: WhatsApp support links, idempotency keys, and server-offset clock

## Status

Accepted.

## Decision

- WhatsApp links normalize Egyptian local/international phone numbers and Arabic-Indic digits before building `https://wa.me/` links. The caller supplies a localized template containing only order number, product name, amount, and sender number.
- Each checkout confirmation attempt receives one UUID idempotency key. Retries of that attempt reuse the same key; a new attempt receives a new key.
- Order countdowns use server-provided `serverNow` and `expiresAt` for display. The countdown never decides whether an order is valid, expired, cancellable, or approvable; the backend decides those transitions.

## Consequences

The browser does not derive order amounts or enforce payment deadlines. Phone normalization is only for safe support-link construction and is not an authorization mechanism.
