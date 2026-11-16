# ADR-006: ESLint 9 until plugins support ESLint 10

## Decision

Pin the highest ESLint 9 release supported by the original React, jsx-a11y, and import plugins. Do not use ESLint 10, peer overrides, or legacy peer resolution until all plugins explicitly declare ESLint 10 support.

## Reason

The current plugin peer ranges stop at ESLint 9 (React: `^9.7`; jsx-a11y: `^9`; import: `^9`). The hooks and TypeScript plugins already accept ESLint 10, but the complete toolchain must have zero peer warnings.

## Revisit

Review the peer ranges during weekly Renovate updates. Upgrade only when every configured plugin declares support and the full strict install passes.

## Status

Accepted for F0.
