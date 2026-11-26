# Target orders API

This document is the frontend target contract for the backend team. The frontend adapter currently supports the legacy routes documented in `docs/contract-differences.md`.

## Shared rules

- JSON responses use `{ data }`; list responses normalize to `{ items, page, pageSize, total }` in the frontend.
- All prices and price snapshots are computed by the server. The browser displays them and does not calculate totals, fees, savings, or expiry outcomes.
- An order is idempotent by the `Idempotency-Key` request header. A key is stable across retries of one confirmation attempt and replaced for a new attempt.
- Timestamps are ISO 8601 UTC. Responses that include availability or expiry include `serverNow`; clients use it only for display.
- Error responses use `{ error: { code, message, details? } }` and are normalized before presentation.

## Student orders

### Create an order

`POST /orders` (student)

```json
{
  "productId": "product_123",
  "paymentMethod": "instapay",
  "senderRef": "+201012345678"
}
```

Headers: `Idempotency-Key: <uuid>`.

Response `201`:

```json
{
  "id": "order_123",
  "orderNumber": "ORD-004281",
  "status": "awaiting_payment",
  "priceSnapshot": {
    "fullPrice": 800,
    "announcedCount": 8,
    "remainingCount": 5,
    "amount": 500
  },
  "paymentMethod": "instapay",
  "senderRef": "+201012345678",
  "expiresAt": "2026-11-28T12:00:00.000Z",
  "createdAt": "2026-11-26T12:00:00.000Z",
  "serverNow": "2026-11-26T12:00:00.000Z",
  "product": { "id": "product_123", "name": "Algebra bundle", "type": "package" },
  "teacher": { "id": "teacher_123", "name": "Teacher name" }
}
```

`paymentMethod` is `instapay | wallet | cash`. `priceSnapshot` is the immutable server-calculated order snapshot. `expiresAt` may be null when no expiry applies.

### List, detail, cancel

- `GET /orders?page=1&pageSize=20&status=awaiting_payment` returns `{ items, page, pageSize, total, serverNow }`. Valid filters include each order status.
- `GET /orders/:id` returns the order snapshot, product/teacher summary, payment summary, and rejection reason when present.
- `POST /orders/:id/cancel` returns the updated order and is accepted only while `awaiting_payment`.

## Admin queue and review

- `GET /admin/orders` filters by `status`, `q` (order number, student name/phone, teacher), `teacherId`, `from`, `to`, and `expiringSoon`, plus `page` and `pageSize`.
- `GET /admin/orders/:id` includes student contact, teacher, product, price snapshot, payment method/sender reference, timestamps, and status history.
- `POST /admin/orders/:id/approve` returns the updated order.
- `POST /admin/orders/:id/reject` body: `{ "reason": "Required explanation" }`; returns the updated order.
- `POST /admin/orders/manual` body: `{ "studentId": "...", "productId": "...", "paymentMethod": "cash", "senderRef": "optional" }`; creates and approves the order atomically and returns the updated order.

## Settings and error codes

`GET /settings` returns public payment instructions, `supportWhatsappNumber`, and `orderExpiryHours` (nullable).

Recognized order errors: `ORDER_ALREADY_OPEN`, `PRODUCT_NOT_PURCHASABLE`, `PRODUCT_ALREADY_OWNED`, `TOO_MANY_OPEN_ORDERS`, `ORDER_EXPIRED`, `ORDER_ALREADY_PROCESSED`, and `ORDER_NOT_CANCELLABLE`. Responses include safe field details where applicable. Raw server messages are not intended for direct display.

## Current frontend compatibility

The current backend does not implement the target one-call order submission. The live adapter creates an order and submits payment separately. If payment submission fails after order creation, the frontend reports the saved order reference and does not claim payment was submitted. Target expiry, cancellation, idempotency, rich filters, and one-step manual order stay capability-off in live mode until the backend contract supports them.
