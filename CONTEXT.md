# Noldg Academy Frontend Context

## Decisions

- The project builds only the frontend. `referencebackend/` remains a read-only contract source, excluded from Git and every tool configuration. Backend evidence is recorded in `docs/contract-differences.md`.
- F0, F1A, and F2 are the foundation for the current F3 work on `feat/f3-foundation`. Keep F3 commits on its feature branch; do not merge it without owner review.
- Node 24 and pnpm 11 are required. ESLint 9.39.5 stays until every configured plugin declares ESLint 10 support; see ADR-006 and Renovate notes.
- Noldg Academy is the provisional brand name in both languages and remains marked for owner confirmation.
- Shared UI components live in `packages/ui`; HTTP, auth contracts, adapters, and mocks live in `packages/api`. Portal screens consume the target auth contract and do not branch on backend shape.
- Portal JS gzip budgets: every lazy route chunk <=80 kB and total initial route <=250 kB. New routes are lazy loaded; `pnpm check:bundle-size` reports entry, main app and largest route chunks.
- E2E enables strict MSW unhandled-frame errors and fails on browser console errors or uncaught page errors. Its runner builds the mock worker and development gallery, serves on port 4174, and terminates the child process tree.
- In-memory access token plus refresh-cookie is the target. `VITE_AUTH_STORAGE=session` remains a temporary fallback for the current backend, which has no refresh endpoint.
- The auth target contract is in `docs/api-target-auth.md`; verified live-backend differences and evidence are in `docs/contract-differences.md`.
- F3 target administration contract is in `docs/api-target-admin.md`; ADR-010 documents URL-backed list state and ADR-011 documents navigation and permission-aware UI.

## Module status

- F0 monorepo, tooling, API client, mock setup, portal shell, tokens, and shared primitives are implemented.
- F1A design-system extensions and F1A-FIX absolute bundle budgets are integrated into `main`.
- F2 dependencies were added and installed by the owner: `react-hook-form@7.92.0` and `@hookform/resolvers@7.0.6`. The next patch release of the resolver was less than seven days old at install time.
- F2 implementation provides auth contracts, capability flags, adapters, MSW scenarios, auth state/guards, Arabic/English auth screens, shared UI, and tests.
- F3 adds responsive portal navigation, dialogs/toasts/tabs/pagination, validated URL list state, academic administration, teacher application review and resubmission, target contracts, adapters, and mock handlers. Latest completed gates: lint, lint:rules, typecheck, unit/component tests, knip, dependency-cruiser, headers, E2E, and bundle checks passed. API lines are 95.22% covered, exceeding F2's 94.94%; UI lines remain 100% covered.
- Latest production bundle: entry 1.44 kB gzip, main app 92.05 kB gzip, and initial route 219.16 kB gzip. Largest lazy route was 6.39 kB gzip; `/login` excludes registration and teacher-registration chunks. The gallery is absent from the standard production build.
- Playwright passed 29/29, including academic track creation, approval and rejection followed by the same teacher's resubmission, mobile drawer, and direction switching. The negative-proof run returned exit 1 and the temporary failing test was removed. Screenshots are in `docs/reports/f3-*.png`.
- Current live backend limitations for F3 are documented in `docs/contract-differences.md`, including restricted academic roles, no admin detail/rejection reason/race code, and missing server pagination/search/status filtering.
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
- Backend owners must confirm the F3 target admin permissions, paginated list contracts, teacher detail/review payload, reasoned account status, and teacher resubmission route before enabling those capabilities in live mode.
- The owner must run `pnpm audit:prod` and `pnpm audit:full` outside this environment before accepting F3; audit results have not been refreshed during this step.
