# Target authentication API

This is the frontend target contract for the authentication module. Routes are relative to `/api`. JSON requests and responses use UTF-8. Successful responses use the documented body; errors use `{ "error": { "code": "...", "message": "...", "details": {} } }`. User-facing clients map `code` values to localized messages and never render `message` directly.

## Registration

### Student

`POST /auth/register/student` — JSON:

```json
{
  "name": "Mona Ali",
  "email": "mona@example.test",
  "phone": "+201001234567",
  "parentPhone": "+201001234568",
  "password": "Example!123",
  "trackId": "track-id",
  "acceptTerms": true
}
```

Returns `201` with `{ "emailVerificationRequired": true }`.

### Teacher

`POST /auth/register/teacher` — `multipart/form-data` fields: `name`, `email`, `phone`, `password`, `bio`, `offerings` (JSON array of `{ "trackId": "...", "subjectId": "..." }`), `image` (file), and `acceptTerms` (`true`). Returns `201` with the created user and application status.

## Email verification and recovery

- `POST /auth/verify-email` — `{ "email": "...", "code": "123456" }`.
- `POST /auth/resend-code` — `{ "email": "..." }`.
- Codes contain six digits, expire after five minutes, and have limited attempts. Responses include remaining attempts or retry seconds when applicable.
- `POST /auth/forgot-password` — `{ "email": "..." }`.
- `POST /auth/reset-password` — `{ "email": "...", "code": "123456", "password": "..." }`. Recovery uses email only.

## Session

- `POST /auth/login` — `{ "email": "...", "password": "..." }`.
- Login returns `{ "accessToken": "...", "expiresInSeconds": 1800, "user": { "id": "...", "name": "...", "role": "student|teacher|admin|super_admin", "status": "active|suspended", "email": "...", "emailVerified": true, "trackId": "..." } }` and sets an httpOnly refresh cookie for web clients.
- Native clients send `X-Client: native` and receive a refresh token in the response body.
- `POST /auth/refresh` reads the web cookie and returns a new access token.
- `POST /auth/logout` clears the refresh cookie and returns `204`.
- `GET /auth/me` returns the current user. Teacher responses include `applicationStatus` and an optional `rejectionReason`.

## Academic catalog and device changes

- `GET /academic/public/catalog` is public and returns systems and tracks. Each track includes its subjects so onboarding can select a track and teacher offerings without a session.
- `POST /devices/change-requests` accepts `{ "reason": "..." }` (reason is optional).
- `GET /devices/change-requests/me` returns the current user's request and its `pending|approved|rejected` status.

## Error codes

The error envelope's `code` is one of `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `PHONE_TAKEN`, `VALIDATION_ERROR`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_RATE_LIMITED`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_PENDING_REVIEW`, `ACCOUNT_REJECTED`, `ACCOUNT_SUSPENDED`, `DEVICE_NOT_REGISTERED`, `RATE_LIMITED`, `UNAUTHORIZED`, or `FORBIDDEN`. `VALIDATION_ERROR.details` maps field names to safe validation identifiers; clients localize those identifiers.

## Validation

Passwords are at least eight characters, contain uppercase and lowercase letters, a digit, and one of `#?!@$%^&*-`, and are no more than 72 UTF-8 bytes. Email is validated and normalized by the server. Phone is required; the current backend trims it and limits it to 64 characters, but defines no Egyptian-number pattern. Clients normalize Arabic-Indic digits and do not add an undocumented format restriction. Offerings must contain at least one valid track/subject pair.

## Response shape assumptions

The original target only named catalog contents and teacher success semantics. This document makes the minimal shape explicit for implementation: catalog tracks carry `{ id, name, system, stage, grade, subjects: [{ id, name }] }`; teacher registration returns `201` with `{ "userId": "...", "applicationStatus": "pending", "emailVerificationRequired": true }`; registration responses carry safe identifiers and status only. Confirm these details with the backend owner before treating this contract as finalized.
