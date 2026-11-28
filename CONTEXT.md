# Noldg Academy Frontend Context

## Decisions

- The project builds only the frontend. `referencebackend/` remains a read-only contract source, excluded from Git and every tool configuration. Backend evidence is recorded in `docs/contract-differences.md`.
- F0 through F4 are integrated foundation steps. F5 is implemented on `feat/f5-student-browse`; keep its branch for owner review and do not merge without owner approval.
- F7 learning is implemented on `feat/f7-learning`, based on the reviewed F6 branch. It adds the student My Lessons list and lesson detail/quiz stub, normalized learning API contracts/adapters/mocks, file playback behind the playback-source union, and a bounded playback heartbeat lifecycle. The player and learning routes remain lazy loaded.
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
- F6 is implemented on `feat/f6-orders`: target order contracts, live adapters and mocks; checkout, purchases, admin queue/detail/manual-order routes; order UI primitives; WhatsApp, idempotency, and display-only server-offset helpers; and Arabic/English copy. See `docs/api-target-orders.md`, ADR-015, and ADR-016. The UI offers teacher/date/expiring filters when the capability is available; the mock has a fixed server-time cutoff for the expiring-soon scenario.
- F6 live integration follows the verified legacy order/payment routes. Orders are created and payments submitted as two requests; live expiry, cancellation, target idempotency, rich queue filters, manual one-step semantics, and student/product lookup are unsupported. `docs/contract-differences.md` records route evidence. The manual-order form accepts IDs because the reference backend has no searchable admin product route and its account list has no search filter.
- F6 `rollup-plugin-visualizer@7.1.3` was declared through the catalog and lockfile in separate commits. The owner ran `pnpm install --frozen-lockfile` successfully. Analyzer output is gated behind `ANALYZE=true` and ignored.
- F6 verification passed: lint, 17/17 lint-rule fixtures, typecheck, full unit/component suite (39 portal files/138 tests, 29 API files/155 tests, 17 UI files/70 tests), full-repo format check, headers (4/4), knip, dependency-cruiser (646 modules/2035 dependencies), production build, bundle budgets, no-dev-route check, and E2E (36/36). Portal coverage is 85.05/64.32/71.50/87.27; API 94.41/83.35/99.16/96.31; UI 100% on all four metrics. A temporary undeclared-network E2E proof failed as intended and was removed.
- F7 adds a server-filtered My Lessons screen, target lesson detail and quiz stub, a file-only VideoPlayer behind a playback-source union, and a bounded heartbeat hook. The target contract and verified route differences are in `docs/api-target-learning.md` and `docs/contract-differences.md`.
- Current live backend supports the legacy playback session and progress routes but not the target student lesson list/detail or dedicated attachment download route. Those capabilities stay off in live mode. Current media access returns a time-limited direct downloadable URL; HLS is reserved until a streaming provider is selected.
- F6 bundle after lazy route namespaces and the deferred mobile account menu is 225.03 kB gzip initial JavaScript (3.66 kB below F5's 228.69 kB); entry is 1.59 kB, main app chunk 71.34 kB, largest lazy route 7.10 kB. The per-route 80 kB and initial-route 250 kB budgets pass.
- F6 handover and complete E2E test inventory are in `docs/reports/f6-report.md`. Owner-run `pnpm audit:prod` and `pnpm audit:full` remain outstanding and were not run.
- F5 adds the student home, URL-backed teacher discovery, teacher detail previews, checkout placeholder, browse contracts/adapters/mocks, bilingual copy, and stricter explicit browser-error matching. Live browse capability gaps are recorded in `docs/contract-differences.md`.
- F5 target browse API and server-owned availability/track decision are documented in `docs/api-target-browse.md` and ADR-014. Student profile, advanced teacher filters, rating summaries, starting price, server availability, and student course previews are unavailable in the current live backend and remain capability-off.
- F5 verification passed: lint, lint-rule fixtures (17/17), typecheck, all unit/component tests with enforced thresholds, full-repository format check, headers tests (4/4), production build, bundle budgets, no-dev-route check, knip, dependency-cruiser, and E2E (31/31). Portal coverage is 85.24/66.31/73.44/87.61 (statements/branches/functions/lines), above its enforced baseline-minus-two thresholds; API is 94.62/83.49/98.95/96.49 and UI remains 100% on all four metrics. Temporary negative proofs confirmed a failing assertion and undeclared 418 make E2E exit non-zero; temporary tests were removed. Initial-route JavaScript is 228.69 kB gzip and lazy routes are below 10 kB gzip.
- F5 browser screenshots are stored in the gitignored `docs/reports/screenshots/` directory. Arabic RTL and English desktop layouts were visually reviewed. The mobile topbar is dense at 375 px; browse content, filters, cards, and direction remain visible and usable.
- Owner-run `pnpm audit:prod` and `pnpm audit:full` were not run during F5 and remain outstanding before acceptance.
- Latest F3-FIX verification before F4: UI coverage was 100% on all four metrics; API coverage was 95.00% statements, 83.05% branches, 98.71% functions, and 96.74% lines.
- Latest F4 production bundle: entry 1.44 kB gzip, main app 96.54 kB gzip, and total initial JavaScript 224.90 kB gzip. The largest lazy route was 9.30 kB gzip; `/login` excludes registration and teacher-registration chunks. The gallery is absent from the standard production build.
- Latest F4 Playwright passed 31/31, covering auth, administration, teacher catalog, lesson upload/publish, bundle creation, and direction switching. Screenshots are in the gitignored `docs/reports/screenshots/` folder.
- F4 coverage: UI 100% statements/branches/functions/lines; API 94.50% statements, 83.20% branches, 99.18% functions, and 96.10% lines. Both packages pass their enforced thresholds.
- Test-only `@testing-library/dom`, `@testing-library/react`, `@testing-library/user-event`, and `jest-axe` are declared through the workspace catalog for the packages that use them; the previous Knip ignore for the removed alias hack has been removed.
- Current live backend limitations for F3 are documented in `docs/contract-differences.md`, including restricted academic roles, no admin detail/rejection reason/race code, and missing server pagination/search/status filtering.
- Owner runs `pnpm audit:prod` and `pnpm audit:full` outside this environment; the latest owner-provided audit result is from before F4 and should be refreshed before accepting F4.

- F7 enables the student My lessons navigation item, adds lesson availability filters backed by server-provided values, Cairo display/countdown helpers, attachment download, playback session start/heartbeat/close, file-only playback, and Arabic/English learning copy. Playback availability and ownership are server decisions; no HLS dependency was added.
- F7 current-backend gaps: the live backend does not provide the target `/me/lessons` list/detail or dedicated attachment download. Its playback access response contains a short-lived direct downloadable file URL; HLS and playback watermark are not implemented. These remain capability-gated and are recorded in `docs/api-target-learning.md` and `docs/contract-differences.md`.
- F7 verification passed: lint, 17/17 lint-rule fixtures, typecheck, full unit/component suite (portal 166, API 185, UI 76; 427 total), format check, headers (4/4), knip, dependency-cruiser (720 modules/2353 dependencies), production build, bundle budgets, and no-dev-route check. Coverage is portal 86.18/67.59/74.96/88.44, API 94.34/83.91/98.72/96.38, and UI 100% on all four metrics. Portal thresholds are 85.18/66.73/73.96/87.44 and were not lowered.
- F7 Playwright passed 39/39 in five consecutive full runs. The suite now runs with one worker to isolate the MSW service-worker state; the preview API base URL is bound to the test origin. Screenshots are saved only under the gitignored `docs/reports/screenshots/` directory. Two temporary negative proofs returned non-zero and their temporary tests were removed.
- F7 production bundle is 226.02 kB gzip initial-route JavaScript, 0.99 kB above its committed 225.03 kB baseline and within the +2 kB guard; portal entry 1.61 kB, main app chunk 71.69 kB, largest lazy route 7.05 kB. Owner-run `pnpm audit:prod` and `pnpm audit:full` were not run.
- F7 handover, exact E2E inventory, and local commits are in `docs/reports/f7-report.md`. `apps/portal/debug.log` is a local untracked artifact and must not be committed.
- F8A currently includes the API and teacher question-bank foundation, a mock-mode exam/homework draft builder, lesson quiz create-and-publish controls for saved lessons, and mock-mode teacher result/attempt detail routes. Assessment lifecycle editing, full scenario coverage, and F8A Playwright journeys remain incomplete. See `docs/reports/f8a-report.md` for verified results and limitations.
- F8A question editing supports target MCQs and presents unsupported legacy question kinds read-only. Live-only capabilities remain disabled where the current backend lacks question images, archive, metadata, or target filters. Question filter/metadata selectors currently accept IDs because the current contract does not expose a complete selector catalog.

## How to run

- Install only when authorized: `corepack pnpm@11.28.11 install --frozen-lockfile`.
- Mock portal: `pnpm dev` (mock mode is the default in Vite development).
- Live portal: set public `VITE_API_MODE=live` and `VITE_API_BASE_URL`, then run `pnpm dev`. Never put secrets in Vite variables.
- Production build requires public `VITE_API_ORIGIN`, `VITE_UPLOAD_ORIGINS`, and `VITE_IMAGE_ORIGINS` for hosting headers.
- Standard checks: `pnpm lint`, `pnpm lint:rules`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm check:bundle-size`, `pnpm check:no-dev-routes`, `pnpm test:headers`, `pnpm test:e2e`, `pnpm knip`, and `pnpm dependency-cruiser`.

## Open questions

- Owner confirmation of the provisional brand name and logo.
- Backend owner confirmation of target order creation/idempotency, expiry, cancellation, searchable student/product lookup, manual atomicity, and advanced order-filter contracts before enabling those live capabilities.
- The target contract does not state an Egyptian phone-number pattern. Current backend only trims and caps phone values at 64 characters; frontend does not invent a stricter rule.
- Backend team needs to confirm the target auth request and response examples in `docs/api-target-auth.md`.
- The backend team must confirm the target catalog routes, multipart upload-ticket payloads, lesson-window enforcement, live-lesson support, and package lesson membership in `docs/api-target-catalog.md` before enabling unsupported live capabilities.
- Backend owners must confirm the F3 target admin permissions, paginated list contracts, teacher detail/review payload, reasoned account status, and teacher resubmission route before enabling those capabilities in live mode.
- The owner must run `pnpm audit:prod` and `pnpm audit:full` outside this environment before accepting F4; audits were intentionally not run here.
- Backend owners must confirm the target `/me/lessons` list/detail, attachment ticket, explicit quiz eligibility, stable playback error codes, and heartbeat server timestamp before enabling the unsupported live capabilities.
- Backend owners must confirm question archive/image/metadata support, MCQ-only behavior, and target assessment audience/randomization/results contracts before enabling those live capabilities.
