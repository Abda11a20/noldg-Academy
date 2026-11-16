# ADR-002: Contract-first API adapters

## Decision

The API package defines target Zod contracts. Adapters alone translate verified current-backend response shapes into those contracts. Backend evidence stays in `docs/contract-differences.md`; application code never imports `referencebackend/`.

## Status

Accepted for F0.
