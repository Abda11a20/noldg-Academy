# ADR-014: Server availability and student track handling

## Status

Accepted for F5.

## Decision

Lesson availability is a server-owned value (`upcoming`, `available`, or `ended`) accompanied by the server timestamp. The portal formats the UTC lesson window in Cairo time through the shared time module but never evaluates it against the client clock. Product prices and purchasability are displayed from server values only.

The authenticated student's profile track is the default browse track. If the profile has no track, a manual selector stores the choice in the URL so links and browser history preserve it. When the live backend cannot filter by student track, the portal explains the limitation and does not pretend the result list is track-filtered.

## Consequences

- Backend capabilities remain disabled in live mode until verified.
- The target browse contract includes server-provided availability and `serverNow`.
- Local presentation may format dates and money, but it must not derive availability, prices, or totals.
