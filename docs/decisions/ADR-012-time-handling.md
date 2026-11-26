# ADR-012: Centralize portal time handling

## Status

Accepted for F4.

## Decision

All conversion between the teacher's Africa/Cairo wall-clock values and API ISO UTC timestamps, display formatting, and injected-clock past/future checks live in `apps/portal/src/shared/time/`. UI fields accept and display values through these helpers. No feature or component performs timezone arithmetic independently.

## Reason

The portal needs consistent behavior across Cairo daylight-saving transitions and UTC API contracts. A single tested module prevents different screens from interpreting ambiguous or nonexistent local times differently.

## Consequences

The time module must explicitly represent nonexistent and ambiguous local times. Callers provide the current time to time comparisons so edge cases remain deterministic in tests. The UI prompts for a choice when a Cairo wall time maps to two instants and rejects a wall time that does not exist.
