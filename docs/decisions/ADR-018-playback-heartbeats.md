# ADR-018: Playback heartbeat state machine

## Status

Accepted for F7.

## Decision

Playback session lifecycle belongs to `usePlaybackSession`. The server chooses heartbeat cadence, validates sequence and playback rate, and computes progress. The client retries a failed heartbeat with the same sequence, clamps rate to the supported range, and closes the session when the route exits or the document is hidden.

## Context

The current backend uses server-timed playback leases, watched ranges, a time budget, and one active session per student. Sending a claimed duration or locally calculated watched percentage would conflict with that model.

## Consequences

- Playback session details remain in ephemeral hook state.
- Heartbeat failures use bounded retries; fatal server results stop playback.
- An expired playback token can restart once and resume from the server-provided position.
- `pagehide` and unmount attempt `keepalive` close requests; the server lease remains the final cleanup mechanism if the browser terminates the request.
- The native video element cannot provide tamper-proof playback. The API remains the authorization and progress authority.
