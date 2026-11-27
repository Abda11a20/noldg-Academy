# ADR-020: Assessment rules remain server-authoritative

## Status

Accepted for F8A.

## Decision

The frontend validates form completeness for feedback, but the backend remains authoritative for assessment windows, attempt limits, question locking, audience eligibility, quiz thresholds, attempt deadlines, scores, and suspicious activity.

## Context

The backend starts and finalizes attempts transactionally, checks entitlements and lesson progress, freezes question content, and computes scores. The target contract adds capabilities not yet available in the current API.

## Consequences

- Cairo wall-clock values are converted only through the shared time module.
- UI validation never grants access or determines grading results.
- Missing live capabilities produce an explanatory unavailable state.
- Results and suspicion indicators are shown only when returned by the server.
