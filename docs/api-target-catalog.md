# Target catalog, courses, lessons, uploads, and bundles API

This document defines the frontend target contract for the backend team. All amounts are supplied by the server; the frontend does not calculate prices, discounts, commission, or totals. IDs are opaque strings and all timestamps are ISO 8601 UTC.

## Shared conventions

- JSON endpoints return `{ success: true, data }`; errors are normalized to `{ error: { code, message, details? } }` by the API adapter.
- List endpoints use `{ items, page, pageSize, total }` and accept `page`, `pageSize`, `q`, `sort`, and domain filters. The frontend adapter normalizes the current backend's `{ success, message, count, data }` responses.
- Course and lesson writes are authenticated and scoped to the approved teacher who owns the course. A missing or foreign course returns 404; an unapproved teacher returns 403.
- Prices and all pricing previews come from the server. Use integer EGP amounts in the target contract.

## Courses

`GET /courses/my` returns the signed-in teacher's courses, each with `id`, `subject`, `track` (`system`, `stage`, `grade`), lesson and package counts, and status. The server creates courses from the teacher's approved offerings.

## Lessons

- `GET /lessons/courses/:courseId` lists the teacher's lessons. The target accepts pagination, search, status, access, and availability filters and returns the standard list envelope.
- `POST /lessons/courses/:courseId` creates a lesson from its details and upload tokens.
- `PATCH /lessons/:lessonId` updates lesson details, replaces the video, or appends attachments.
- `PATCH /lessons/:lessonId/status` changes `draft`, `published`, or `archived` independently from the availability window.
- An edit can append up to 10 attachment upload tokens; each direct upload is limited to 256 MiB for video and 25 MiB for attachments by the current backend.

Target lesson fields: `kind` (`recorded` | `live`), `title`, `description`, `status` (`draft` | `published` | `archived`), `availableFrom`, `availableUntil`, `access` (`free` | `paid`), optional product `price`, video state (`none` | `uploading` | `processing` | `ready` | `failed`), and attachments.

The backend enforces: publishing needs a ready video and a valid future window; a start time locks once it begins; an end may be extended but not shortened after a student owns the lesson; price updates affect future orders only. Errors include `LESSON_NOT_PUBLISHABLE`, `WINDOW_INVALID`, `WINDOW_SHORTEN_FORBIDDEN`, `WINDOW_START_LOCKED`, `UPLOAD_EXPIRED`, `UPLOAD_REJECTED`, `FILE_TOO_LARGE`, and `FILE_TYPE_NOT_ALLOWED`.

`live` lessons remain disabled until the live capability is enabled. The UI must explain a disabled capability and must not treat client validation as authorization.

## Direct uploads

`POST /lessons/courses/:courseId/uploads/sign` accepts `{ kind: "video" | "attachment", name }` and returns a ticket. Target tickets are a discriminated union:

```json
{
  "method": "form-post",
  "url": "https://provider.example/upload",
  "fields": { "signature": "server-issued", "key": "server-issued" },
  "uploadToken": "opaque-server-token",
  "expiresAt": "2030-01-01T00:00:00.000Z"
}
```

The future resumable variant is reserved as `{ method: "tus", url, headers, expiresAt, uploadToken }`; it is not implemented by this frontend step. The current backend issues one-hour tokens and returns `maxBytes`, but not an explicit expiry timestamp. For form-post, the browser sends the file directly to the signed provider URL with the returned fields, then submits only opaque upload tokens to the API. Never log, cache, or place ticket fields or file contents in a URL. Abort upload requests and lesson polling on cancellation, route change, or unmount.

## Products and bundles

- `GET /products/my` returns the teacher's lesson and package products.
- `POST /products` creates a lesson or package product.
- `PATCH /products/:productId` updates name, price, announced lesson count, or active status.
- `GET /products/:productId/pricing` returns the authoritative current student price and pricing details.

A package target has `name`, `price`, `announcedLessonCount`, explicit `lessonIds`, and status. The backend owns all pricing calculations and returns the current student-facing price from the pricing endpoint. `bundleLessons` gates explicit lesson selection: true in mocks and false for the current live backend. A package lesson count cannot exceed its announced count. Lesson membership can be added at any time and cannot be removed after the package's first sale.

## Capability behavior

Capabilities used by the frontend are `bundleLessons`, `liveLessons`, `lessonWindowRules`, `lessonDrafts`, and `lessonVideoProcessing`. Mock mode enables all except `liveLessons`; live mode defaults all five to false for the current backend. Missing capabilities render a localized explanatory state and disable unsupported controls; they never crash a screen. When advanced window rules are unavailable on an existing lesson, the UI leaves the stored schedule visible but read-only because the current backend cannot confirm start locks or package-sale constraints.

## Current backend route and shape notes

The current backend routes and payloads are not identical to this target. The frontend adapter owns those conversions. Evidence and remaining differences are listed in `docs/contract-differences.md`.
