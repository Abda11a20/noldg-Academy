# ADR-011: role navigation and permission-aware UI

## Status

Accepted for F3.

## Decision

Portal navigation is declared once in `apps/portal/src/app/navigation.ts`. Items have a route, localization key, icon registry name, allowed roles, and an enabled state. Layouts render filtered items through UI navigation primitives. UI role filtering is a convenience only; API permission failures render a localized no-permission state and backend authorization remains authoritative.

## Consequences

- Role menus do not become authorization checks.
- Unimplemented destinations stay disabled until their feature is delivered.
- Backend `403` responses must be represented as an explicit page state.
