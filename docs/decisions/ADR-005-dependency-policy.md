# ADR-005: Dependency policy

## Decision

Use exact catalog pins, Node 24, pnpm 11, strict peer dependencies, a seven-day minimum release age, no downgrade trust policy, blocked install scripts with a small explicit allowlist, and frozen-lockfile CI installs. Add dependencies only when a requested F0 requirement needs them; record the reason and maintenance state in the F0 report.

## Status

Accepted for F0.
