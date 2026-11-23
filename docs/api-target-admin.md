# Target API contract: administration

This document defines the frontend target contract for the academic catalog and teacher administration. It is not a statement that the current backend implements these routes.

## Shared list contract

List requests accept `page`, `pageSize`, `q`, `sort`, and domain filters. Responses use `{ items, page, pageSize, total }`. Pagination is server-side. Invalid filters return a normalized validation error.

## Academic structure

Allowed roles are `ADMIN` and `SUPER_ADMIN` for reads and writes. Systems are `general`, `languages`, `azhar`, `egyptian_bacc`, and `american_diploma`. Stages are `prep` and `secondary`; grades are 1 through 3. American Diploma tracks are secondary only. A track has `{ id, system, stage, grade, name, active }`; a subject has `{ id, name, active }`.

- `GET /academic/tracks?page=&pageSize=&q=&sort=&system=&stage=&active=` returns the standard list envelope.
- `POST /academic/tracks` accepts `{ system, stage, grade, name }` and returns the created track.
- `PATCH /academic/tracks/:trackId` accepts editable fields including `active` and returns the track.
- `GET /academic/subjects?page=&pageSize=&q=&active=` returns the standard list envelope.
- `POST /academic/subjects` accepts `{ name }`; `PATCH /academic/subjects/:subjectId` accepts `{ name?, active? }`.
- `GET /academic/tracks/:trackId/subjects` returns a standard list of mapped subjects.
- `POST /academic/tracks/:trackId/subjects` accepts `{ subjectId }`; `DELETE /academic/tracks/:trackId/subjects/:subjectId` removes only the mapping.

Records referenced by courses, offerings, orders, or learning history must be disabled rather than hard-deleted.

## Teacher applications

- `GET /teachers/applications?status=&q=&page=&pageSize=` returns `{ items, page, pageSize, total }`.
- `GET /teachers/applications/:applicationId` returns a profile, contact data, image, bio, track/subject offerings, submission and review timestamps, status, and rejection reason.
- `POST /teachers/applications/:applicationId/approve` approves a pending application.
- `POST /teachers/applications/:applicationId/reject` accepts `{ reason }`; reason is required and validated by the server.
- Concurrent reviews return `409 ALREADY_REVIEWED`.
- A rejected teacher resubmits with multipart `PUT /teachers/me/application` using the same profile fields as signup.

## Teacher account status

- `GET /users?role=teacher&status=active|suspended&q=&page=&pageSize=` returns the shared list envelope.
- `PATCH /users/:userId/status` accepts `{ status: "active"|"suspended", reason }` and returns the updated account.

All authorization and business validation remain server-enforced. The frontend only reflects permission and validation responses.
