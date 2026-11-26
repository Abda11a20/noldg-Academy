# ADR-013: Use a discriminated upload ticket contract

## Status

Accepted for F4.

## Decision

Uploads use a ticket discriminated by method. This step implements signed provider form-post uploads with XMLHttpRequest so progress and abort are available. A tus ticket shape is reserved in the contract for a later resumable provider and is not implemented now.

## Reason

The current backend signs direct provider uploads and returns a provider URL with signed fields; media bytes must not pass through the API host. Keeping provider details inside the upload module allows a future resumable implementation without changing lesson UI contracts.

## Consequences

Signed fields and tokens are sensitive transient data: do not log them, put them in URLs, or put them in the query cache. Upload and polling work must be aborted on cancellation and component teardown. Current form-post uploads are not resumable, so the UI communicates that limitation for large files.
