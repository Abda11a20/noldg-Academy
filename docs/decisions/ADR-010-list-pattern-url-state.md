# ADR-010: list screens and URL state

## Status

Accepted for F3.

## Decision

Administrative lists use a common header, filter/search controls, presentational `DataTable`, and `Pagination`. Data comes from server-backed query hooks. List state is represented in validated URL search parameters so browser navigation and copied links restore the same view. Search writes are debounced; invalid query values fall back to safe defaults.

## Consequences

- Lists remain linkable and browser history preserves filters and page state.
- Current backend endpoints that do not support server pagination/search are capability-limited and recorded in `docs/contract-differences.md`.
- Sorting and filtering logic stay outside `packages/ui`.
