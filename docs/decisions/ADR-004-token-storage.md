# ADR-004: Token storage

## Decision

The target stores access tokens in memory and refreshes through an HttpOnly refresh cookie. A temporary `sessionStorage` implementation is available only when `VITE_AUTH_STORAGE=session`, because the current backend has no refresh route. It is isolated in `packages/api/src/auth/token-store.ts` and is technical debt to remove after the backend adds refresh-cookie support.

## Status

Accepted for F0.
