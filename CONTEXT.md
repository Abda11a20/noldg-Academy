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
- F3-FIX adds page-level MSW coverage for the academic and teacher administration scenarios, completes UI/API coverage thresholds, records resubmission status history, and fixes DropdownMenu RTL direction. The test matrix is in `docs/reports/f3-fix-report.md`.
- F4 is implemented on `feat/f3-foundation`: teacher course and lesson pages, upload flow, bundles and server pricing preview, Cairo time helpers including DST cases, catalog contracts/adapters/endpoints/mocks, UI fields, gallery examples, capability fallbacks, and target-contract documentation. The owner installed the declared test dependencies; no install command was run in this step.
- F4 validation passed: lint, lint-rule fixtures (17/17), typecheck, all unit/component tests, format check, headers (4/4), knip, dependency-cruiser, production build, bundle budgets, no-dev-route check, and E2E (31/31). The E2E negative proof also returned exit code 1 for a temporary failing test and the file was removed.
- F4 handover results and remaining backend dependencies are recorded in `docs/reports/f4-report.md`.
- Latest F3-FIX verification before F4: UI coverage was 100% on all four metrics; API coverage was 95.00% statements, 83.05% branches, 98.71% functions, and 96.74% lines.
- Latest F4 production bundle: entry 1.44 kB gzip, main app 96.54 kB gzip, and total initial JavaScript 224.90 kB gzip. The largest lazy route was 9.30 kB gzip; `/login` excludes registration and teacher-registration chunks. The gallery is absent from the standard production build.
- Latest F4 Playwright passed 31/31, covering auth, administration, teacher catalog, lesson upload/publish, bundle creation, and direction switching. Screenshots are in the gitignored `docs/reports/screenshots/` folder.
- F4 coverage: UI 100% statements/branches/functions/lines; API 94.50% statements, 83.20% branches, 99.18% functions, and 96.10% lines. Both packages pass their enforced thresholds.
- Test-only `@testing-library/dom`, `@testing-library/react`, `@testing-library/user-event`, and `jest-axe` are declared through the workspace catalog for the packages that use them; the previous Knip ignore for the removed alias hack has been removed.
- Current live backend limitations for F3 are documented in `docs/contract-differences.md`, including restricted academic roles, no admin detail/rejection reason/race code, and missing server pagination/search/status filtering.
- Owner runs `pnpm audit:prod` and `pnpm audit:full` outside this environment; the latest owner-provided audit result is from before F4 and should be refreshed before accepting F4.

## How to run

- Install only when authorized: `corepack pnpm@11.28.11 install --frozen-lockfile`.
- Mock portal: `pnpm dev` (mock mode is the default in Vite development).
- Live portal: set public `VITE_API_MODE=live` and `VITE_API_BASE_URL`, then run `pnpm dev`. Never put secrets in Vite variables.
- Production build requires public `VITE_API_ORIGIN` and `VITE_UPLOAD_ORIGINS` for hosting headers.
- Standard checks: `pnpm lint`, `pnpm lint:rules`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm check:bundle-size`, `pnpm check:no-dev-routes`, `pnpm test:headers`, `pnpm test:e2e`, `pnpm knip`, and `pnpm dependency-cruiser`.

## Open questions

- Owner confirmation of the provisional brand name and logo.
- The target contract does not state an Egyptian phone-number pattern. Current backend only trims and caps phone values at 64 characters; frontend does not invent a stricter rule.
- Backend team needs to confirm the target auth request and response examples in `docs/api-target-auth.md`.
- The backend team must confirm the target catalog routes, multipart upload-ticket payloads, lesson-window enforcement, live-lesson support, and package lesson membership in `docs/api-target-catalog.md` before enabling unsupported live capabilities.
- Backend owners must confirm the F3 target admin permissions, paginated list contracts, teacher detail/review payload, reasoned account status, and teacher resubmission route before enabling those capabilities in live mode.
- The owner must run `pnpm audit:prod` and `pnpm audit:full` outside this environment before accepting F4; audits were intentionally not run here.
