# F5 Technical Report — Student Teacher Browse

## 1. Summary

Implemented F5 on `feat/f5-student-browse`: student home and track selection, URL-backed teacher discovery, teacher detail with course/lesson/product previews, checkout placeholder, browse API contracts/adapters/mocks, Arabic and English copy, image-origin CSP configuration, and explicit browser-failure declarations. Availability and prices remain server supplied. `referencebackend/` was read-only and is ignored by Git. No dependency was added, no install or audit command was run, and no push or merge was performed.

Final E2E passed 31/31. Both temporary negative proofs were removed after they demonstrated non-zero exit: a deliberate assertion failure and an undeclared HTTP 418. UI/API/portal coverage thresholds passed.

## 2. Files created or changed

- API: browse schemas and tests, target/live adapters and tests, browse endpoints and tests, capabilities, mock fixtures/handlers, and the catalog export.
- Portal: student home, track selector, browse filters, teacher cards, lesson/product previews, course tabs, checkout stub, query hooks/key factory and tests; lazy routes, navigation, locale registration, and Arabic/English browse translations; portal coverage thresholds.
- Browser tests: student browse journey, auth request-error scenario coverage, shared strict error fixture, existing auth/catalog/gallery scenario updates, and E2E runner adjustment.
- Security/hosting: CSP accepts configured image origins; generator tests and public environment example updated; CI and CodeQL builds receive the public image-origin configuration.
- UI: RTL mobile Dialog centering correction required by the browse filters drawer.
- Documentation: `docs/api-target-browse.md`, `docs/contract-differences.md`, ADR-014, `docs/rules/BROWSER-ERROR-ALLOWLIST.md`, `CONTEXT.md`, `README.md`, and this report.
- Screenshots: eight F5 screenshots were written under the gitignored `docs/reports/screenshots/`; none are staged or committed.

The backend tree was not edited. `git status --short referencebackend/` was empty and `git check-ignore referencebackend` confirmed the ignore rule.

## 3. Versions

| Tool/package         | Resolved version | F5 reason                                                                                  |
| -------------------- | ---------------: | ------------------------------------------------------------------------------------------ |
| Node.js              |          24.22.3 | Required runtime; verified in this workspace.                                              |
| pnpm                 |         11.28.11 | Repository package manager; verified in this workspace.                                    |
| React / React DOM    |           19.3.1 | Existing portal runtime; unchanged.                                                        |
| React Router         |            8.5.1 | Existing lazy routing; unchanged.                                                          |
| TanStack Query       |          5.107.1 | Existing query/cache layer; unchanged.                                                     |
| TypeScript           |            6.0.3 | Existing strict TypeScript toolchain; unchanged.                                           |
| Vite                 |            8.3.7 | Existing portal build; unchanged.                                                          |
| Vitest / coverage-v8 |            5.1.0 | Existing unit/component tests; unchanged.                                                  |
| Playwright           |           1.65.0 | Existing browser tests; unchanged.                                                         |
| Zod                  |            4.6.7 | Browse contracts and URL validation; existing dependency.                                  |
| i18next              |           27.0.1 | Arabic/English locale support; existing dependency.                                        |
| Tailwind CSS         |            4.3.5 | Existing token-driven styles; unchanged.                                                   |
| ESLint               |           9.39.5 | Retained under ADR-006 because configured plugins have not all declared ESLint 10 support. |

F5 introduced **zero dependencies** and changed no dependency versions. The versions above are existing exact workspace catalog pins; no registry-latest comparison was needed for a dependency change.

## 4. Commands run with results

| Command                                                                                                                                                            | Result                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `node -v`; `pnpm -v`                                                                                                                                               | PASS — Node `v24.22.3`; pnpm `11.28.11`.                                                                                                  |
| `pnpm lint`                                                                                                                                                        | PASS — exit 0, no lint errors or warnings.                                                                                                |
| `pnpm lint:rules`                                                                                                                                                  | PASS — `Passed 17/17 ESLint rule fixtures.`                                                                                               |
| `pnpm typecheck`                                                                                                                                                   | PASS — 3 Turbo tasks successful.                                                                                                          |
| `pnpm test`                                                                                                                                                        | PASS — API, UI, and portal tasks successful with enforced coverage thresholds.                                                            |
| `pnpm --filter @noldg/api test`                                                                                                                                    | PASS — 25 files, 109 tests; 94.62/83.49/98.95/96.49 coverage.                                                                             |
| `pnpm format:check`                                                                                                                                                | PASS — all matched repository files formatted.                                                                                            |
| `pnpm test:headers`                                                                                                                                                | PASS — 4 tests, 0 failures.                                                                                                               |
| `pnpm build` with `VITE_API_ORIGIN=https://api.example.invalid`, `VITE_UPLOAD_ORIGINS=https://api.cloudinary.com`, `VITE_IMAGE_ORIGINS=https://res.cloudinary.com` | PASS — production build completed; 2,693 modules transformed.                                                                             |
| `pnpm check:bundle-size`                                                                                                                                           | PASS — total initial-route JavaScript 228.69 kB gzip; every lazy route below 80 kB.                                                       |
| `pnpm check:no-dev-routes`                                                                                                                                         | PASS — production output contains no gallery marker.                                                                                      |
| `pnpm knip`                                                                                                                                                        | PASS — exit 0.                                                                                                                            |
| `pnpm dependency-cruiser`                                                                                                                                          | PASS — no violations; 555 modules and 1,682 dependencies.                                                                                 |
| `pnpm test:e2e`                                                                                                                                                    | PASS — clean final run, 31/31 browser tests.                                                                                              |
| Temporary E2E negative proof                                                                                                                                       | EXPECTED FAIL — 31 ordinary tests passed; deliberate assertion and undeclared 418 failed; runner returned exit 1. Temporary spec removed. |
| `pnpm audit:prod`, `pnpm audit:full`                                                                                                                               | NOT RUN — owner-run by instruction.                                                                                                       |
| `pnpm install`                                                                                                                                                     | NOT RUN — dependency changes were prohibited and none were needed.                                                                        |
| Gitleaks                                                                                                                                                           | NOT AVAILABLE — executable was not installed. A high-confidence secret-pattern scan of each staged commit returned 0 matches.             |

An initial commit attempt was rejected by the pre-commit hook because the corrected contract-differences table needed formatting. The table was formatted by itself, whole-repository `format:check` passed, and subsequent commits passed their hooks. No commit was created by the rejected attempt.

## 5. Test results and coverage

| Package        | Test files | Tests | Statements | Branches | Functions |  Lines | Enforced threshold      |
| -------------- | ---------: | ----: | ---------: | -------: | --------: | -----: | ----------------------- |
| `packages/api` |         25 |   109 |     94.62% |   83.49% |    98.95% | 96.49% | 93/83/98/95             |
| `packages/ui`  |         13 |    62 |       100% |     100% |      100% |   100% | 100/100/100/100         |
| `apps/portal`  |         28 |   111 |     85.24% |   66.31% |    73.44% | 87.61% | 82.13/63.95/70.58/84.65 |

Portal thresholds are the measured F4 baseline minus two percentage points for each metric, with no coverage exclusions added. All three package thresholds passed.

| Area                          | Coverage exercised                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Browse API contracts/adapters | Target and live response normalization, filter mapping, unavailable fields, server prices/availability, and null rating/starting-price cases. |
| `useStudentTrack`             | Profile-provided track, manual URL track, and URL restoration.                                                                                |
| Teachers list                 | Loading, empty, error, 403, URL-restored search/filter state, absent rating and price.                                                        |
| Teacher detail                | Loading/error/not-found and safe track state; all server availability values, course tabs, product price and remaining count.                 |
| Browser browse flow           | Arabic/English, mobile/desktop, filters and sort, details/tabs, checkout stub, back navigation retaining filters, mobile filter drawer.       |
| Browser error policy          | Undeclared 418 fails; other console errors and uncaught page errors remain failures.                                                          |

## 6. Lint-rule proofs

`pnpm lint` passed with zero warnings. `pnpm lint:rules` passed 17/17 fixture proofs. The F5 browser failure fixture permits only exact declared method/URL-pattern/status signatures; repeated matching requests are accepted for query retries, while every observed failure with a different signature fails. A temporary undeclared 418 produced a fixture failure and was removed. No new custom ESLint rule was added.

## 7. Bundle sizes

Production gzip measurements:

| Metric                         | F4 baseline | F5 result |        Budget | Status |
| ------------------------------ | ----------: | --------: | ------------: | ------ |
| Portal loader entry            |     1.44 kB |   1.48 kB | Informational | PASS   |
| Main app chunk                 |    96.54 kB |  99.19 kB | Informational | PASS   |
| Total initial-route JavaScript |   224.90 kB | 228.69 kB |        250 kB | PASS   |
| Largest lazy route             |     9.30 kB |   9.35 kB |         80 kB | PASS   |

The `/login` graph contains no student-registration or teacher-registration page chunk. Browse pages are lazy-loaded. The production output excludes the development gallery.

## 8. Deviations from the spec and why

- The live backend does not expose the F5 student browse contract as specified. Capability flags remain disabled for unavailable track/profile filters, rating and starting-price summaries, course previews, availability fields, and extended filters; the UI degrades to a URL-backed manual track and safe capability states. No frontend fallback computes price or availability.
- The checkout URL intentionally renders the requested “available in the next step” stub; purchase logic is outside F5.
- The browser allowlist groups repeat requests by their declared method, URL pattern, and status signature because query retries and cancellation timing vary. No undeclared signature is accepted; the temporary 418 proof verified that behavior.
- Audits and full Gitleaks scanning were not run for the reasons above.

## 9. Assumptions

- Mock mode implements the target browse contract. Current live mode is governed by backend capability flags and adapters.
- Student track selection is a URL-backed convenience until live `GET /auth/me` returns the target `trackId`.
- The backend remains authoritative for ratings, price, purchasability, availability, and `serverNow`.
- Public image-origin configuration is supplied as HTTPS `VITE_IMAGE_ORIGINS`; the Cloudinary sample is a public placeholder.

## 10. Questions

- Backend owner: confirm the authenticated student teacher-list contract and whether teacher/detail routes will be student-authorized.
- Backend owner: confirm track-filter, rating threshold, starting-price, lesson-preview, server availability, and `serverNow` response fields before enabling live capabilities.
- Product owner: confirm the default student track-selection UX for accounts whose profile has no `trackId`.
- Owner: run `pnpm audit:prod` and `pnpm audit:full` outside this environment before accepting the branch.

## 11. Risks and technical debt

- Live browsing is limited by missing backend endpoints/fields; target flows are complete only in mock mode until those contracts are implemented and verified.
- Screenshots show the shared topbar is dense at 375 px, although all controls remain visible and the tested browse screens fit the viewport. This is a visual polish item for owner review.
- Gitleaks is unavailable in the environment. The staged high-confidence pattern scan found no matches, but is not a substitute for the owner’s full secret scanner.
- Audits are outstanding and remain owner-run.
- Existing ESLint 9.39.5 is marked deprecated by the owner’s prior install output; it remains pinned under ADR-006 pending plugin support for ESLint 10.

## 12. Commits

| Commit    | Message                                                  |
| --------- | -------------------------------------------------------- |
| `2025746` | `feat(api): add student browsing contracts and mocks`    |
| `7b51c70` | `feat(portal): add student teacher browsing`             |
| `e01d692` | `test(e2e): verify student browse and strict failures`   |
| `e3e50ed` | `fix(ui): center RTL dialogs on mobile`                  |
| `d766d8a` | `build(security): allow configured image origins in CSP` |

All are local commits on `feat/f5-student-browse`. The documentation/report commit follows this implementation snapshot; no push, merge, or rebase was performed. `git log --oneline` at report preparation showed the five commits above followed by the F4 history.

## 13. What to review first

1. Review live-vs-target endpoint evidence in `docs/contract-differences.md` and the clean target contract in `docs/api-target-browse.md`.
2. Review the live capability behavior in `packages/api/src/config/capabilities.ts` and the browse adapters in `packages/api/src/adapters/browse.ts`.
3. Review URL-backed filters/track selection and the student list/detail routes in `apps/portal/src/features/student-browse/`.
4. Review the strict browser failure fixture and the 375 px screenshots under `docs/reports/screenshots/`.
5. Run the owner-required audits, then review the local commit history before deciding whether to merge.
