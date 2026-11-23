# Noldg Academy Frontend Context

## Decisions

- The project builds only the frontend. `referencebackend/` remains a read-only contract source, excluded from Git and every tool configuration. Backend evidence is recorded in `docs/contract-differences.md`.
- F0 and F1A are integrated into `main`; F2 work is on `feat/f2-auth`. Keep commits on this branch and do not merge it.
- Node 24 and pnpm 11 are required. ESLint 9.39.5 stays until every configured plugin declares ESLint 10 support; see ADR-006 and Renovate notes.
- Noldg Academy is the provisional brand name in both languages and remains marked for owner confirmation.
- Shared UI components live in `packages/ui`; HTTP, auth contracts, adapters, and mocks live in `packages/api`. Portal screens consume the target auth contract and do not branch on backend shape.
- Portal JS gzip budgets are absolute: entry <=150 kB and total initial route <=250 kB. New routes are lazy loaded.
- E2E enables strict MSW unhandled-frame errors and fails on browser console errors or uncaught page errors. Its runner builds the mock worker and development gallery, serves on port 4174, and terminates the child process tree.
- In-memory access token plus refresh-cookie is the target. `VITE_AUTH_STORAGE=session` remains a temporary fallback for the current backend, which has no refresh endpoint.
- The auth target contract is in `docs/api-target-auth.md`; verified live-backend differences and evidence are in `docs/contract-differences.md`.

## Module status

- F0 monorepo, tooling, API client, mock setup, portal shell, tokens, and shared primitives are implemented.
- F1A design-system extensions and F1A-FIX absolute bundle budgets are integrated into `main`.
- F2 dependencies were added and installed by the owner: `react-hook-form@7.92.0` and `@hookform/resolvers@7.0.6`. The next patch release of the resolver was less than seven days old at install time.
- F2 implementation is committed on `feat/f2-auth`: target auth contracts, capability flags, current-backend adapters, MSW scenarios, auth store and guards, Arabic/English auth screens, shared UI additions, tests, and screenshots. Lint, fixture proofs, type-check, unit/component tests, production build, bundle budgets, no-dev-route check, headers tests, knip, dependency-cruiser, and 14 Playwright tests pass.
- The production entry is 1.28 kB gzip; the measured initial route, including app startup, auth layout, and login feature, is 220.20 kB gzip against 150/250 kB limits. The E2E-only gallery and MSW worker are absent from production.
- Playwright tests include an intentionally failing temporary test: `pnpm test:e2e` returned exit 1, and that file was removed. The normal E2E suite passed 14/14 and saved 18 `docs/reports/f2-*.png` screenshots.
- Owner runs `pnpm audit:prod` and `pnpm audit:full` outside this environment; latest owner-provided results: production audit found no known vulnerabilities; full audit found one moderate advisory (the configured full audit threshold is high).

## How to run

- Install only when authorized: `corepack pnpm@11.28.11 install --frozen-lockfile`.
- Mock portal: `pnpm dev` (mock mode is the default in Vite development).
- Live portal: set public `VITE_API_MODE=live` and `VITE_API_BASE_URL`, then run `pnpm dev`. Never put secrets in Vite variables.
- Production build requires public `VITE_API_ORIGIN` for hosting headers.
- Standard checks: `pnpm lint`, `pnpm lint:rules`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm check:bundle-size`, `pnpm check:no-dev-routes`, `pnpm test:headers`, `pnpm test:e2e`, `pnpm knip`, and `pnpm dependency-cruiser`.

## Open questions

- Owner confirmation of the provisional brand name and logo.
- The target contract does not state an Egyptian phone-number pattern. Current backend only trims and caps phone values at 64 characters; frontend does not invent a stricter rule.
- Backend team needs to confirm the target catalog, teacher registration, and login response examples in `docs/api-target-auth.md`.
- The backend team must confirm the target catalog, teacher registration, and login response examples in `docs/api-target-auth.md` before live rollout.
