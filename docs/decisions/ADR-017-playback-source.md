# ADR-017: Playback source abstraction

## Status

Accepted for F7.

## Decision

The UI receives a normalized discriminated playback source. The first renderer supports `file`; the contract reserves `hls` but no HLS renderer or player dependency is added.

## Context

The backend currently returns a short-lived direct video file URL from the lesson access endpoint. The production streaming provider has not been selected. Adding a playback library now would lock the frontend to an unapproved delivery protocol and increase the initial or route bundle without a product decision.

## Consequences

- `VideoPlayer` only renders the file method and exposes a localized unsupported state for unknown methods.
- The file URL is kept in the active playback hook state only. It is not stored in query keys, browser history, or logs.
- The API adapter identifies current live delivery as downloadable and the UI explains the limitation.
- The backend team must provide tokenized streaming or HLS before the platform can claim protected playback.
- Revisit this decision after the provider and streaming protocol are selected.
