# F4 Technical Report — Teacher Catalog, Lessons, Uploads, and Bundles

## 1. Summary

Implemented the F4 teacher catalog foundation on `feat/f3-foundation`: course and lesson browsing, lesson editing, direct video and attachment uploads, bundle management, server-provided pricing previews, Cairo time conversion, catalog contracts/adapters/mocks, reusable UI fields, and target-contract documentation. The work stayed in the frontend repository; `referencebackend/` was read-only.

The owner completed the dependency installation with `pnpm install --no-frozen-lockfile`. I did not run `pnpm install` or modify `node_modules`. Final automated E2E passed 31/31, and the deliberate negative proof made the runner return exit code 1.

## 2. Files created or changed

- API: `packages/api/package.json`; catalog contracts and editor schemas under `packages/api/src/contracts/`; `packages/api/src/adapters/catalog.ts`; `packages/api/src/config/capabilities.ts`; catalog and teacher-administration endpoints under `packages/api/src/endpoints/`; provider upload transport under `packages/api/src/uploads/`; catalog MSW fixtures and handlers under `packages/api/src/mocks/`; upload/provider and endpoint tests; `packages/api/test/setup.ts`.
- Shared UI: `packages/ui/src/index.ts`; `packages/ui/src/components/data-display/FileRow.tsx`; `packages/ui/src/components/forms/DateTimeField.tsx`; `packages/ui/src/components/forms/MoneyField.tsx`; form-field tests.
- Portal features: all files in `apps/portal/src/features/catalog-teacher/`; `apps/portal/src/shared/time/`; route definitions and lazy routes; catalog locale files for Arabic and English; shared formatting and error handling; catalog gallery examples; date presentation in teacher-application views.
- E2E and hosting: `apps/portal/e2e/catalog.spec.ts`; E2E fixtures and corrected route assertions; CSP header generator/tests; E2E runner environment; `.env.example`; CI and CodeQL build environment.
- Documentation: `docs/api-target-catalog.md`; `docs/contract-differences.md`; ADR-012 and ADR-013; `README.md`; `CONTEXT.md`.
- Dependency hygiene: `pnpm-lock.yaml` synchronized with the already-declared testing dependencies; Knip configuration updated.

## 3. Versions

| Tool or package               | Resolved version | F4 usage / reason                                      |
| ----------------------------- | ---------------: | ------------------------------------------------------ |
| Node.js                       |          24.22.3 | Required runtime; verified with `node -v`.             |
| pnpm                          |         11.28.11 | Workspace package manager; verified with `pnpm -v`.    |
| React                         |           19.3.1 | Existing portal runtime.                               |
| TypeScript                    |            6.0.3 | Existing strict TypeScript toolchain.                  |
| Vite                          |            8.3.7 | Existing portal build and preview.                     |
| Vitest                        |            5.1.0 | Existing unit/component test runner.                   |
| Playwright                    |           1.65.0 | Existing browser smoke runner.                         |
| Zod                           |            4.6.7 | Catalog request/response validation.                   |
| `@testing-library/dom`        |           10.4.1 | Explicit test dependency used by Testing Library; MIT. |
| `@testing-library/react`      |           16.3.3 | React component tests; MIT.                            |
| `@testing-library/user-event` |           14.6.8 | User-level form interaction tests; MIT.                |
| `jest-axe`                    |           11.0.0 | Accessibility assertions in component tests; MIT.      |

No F4 runtime dependency was added. The four test packages were explicitly required by the F4 dependency step, use exact workspace catalog pins, and are scoped to test tooling. They are maintained upstream projects. The owner’s install output reported the lockfile supply-chain policy passed and warned that the existing pinned ESLint 9.39.5 is deprecated; ESLint remains at 9 per ADR-006 until the configured plugins support ESLint 10.

## 4. Commands run and results

| Command                                                                                                 | Result                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `node -v`                                                                                               | PASS — `v24.22.3`.                                                                                                  |
| `pnpm -v`                                                                                               | PASS — `11.28.11`.                                                                                                  |
| `pnpm lint`                                                                                             | PASS — exit 0, no warnings.                                                                                         |
| `pnpm lint:rules`                                                                                       | PASS — `Passed 17/17 ESLint rule fixtures.`                                                                         |
| `pnpm typecheck`                                                                                        | PASS — 3 Turbo tasks successful.                                                                                    |
| `pnpm test`                                                                                             | PASS — 3 workspace tasks successful; API, UI, and portal tests all passed.                                          |
| `pnpm format:check`                                                                                     | PASS — all matched repository files use Prettier style.                                                             |
| Initial `pnpm format:check` before correcting this report                                               | FAIL — only this report needed formatting; corrected it and reran the repository check successfully.                |
| `pnpm test:headers`                                                                                     | PASS — 4 tests, 0 failures.                                                                                         |
| `pnpm knip`                                                                                             | PASS — exit 0.                                                                                                      |
| `pnpm dependency-cruiser`                                                                               | PASS — no violations; 503 modules and 1,525 dependencies examined.                                                  |
| `VITE_API_ORIGIN=https://api.example.invalid VITE_UPLOAD_ORIGINS=https://api.cloudinary.com pnpm build` | PASS — production build completed; 2,667 modules transformed.                                                       |
| `pnpm check:bundle-size`                                                                                | PASS — within all configured gzip budgets.                                                                          |
| `pnpm check:no-dev-routes`                                                                              | PASS — no development gallery marker in the production output.                                                      |
| `pnpm test:e2e`                                                                                         | PASS — 31/31 browser tests passed.                                                                                  |
| E2E negative proof                                                                                      | PASS — a temporary failing test caused `pnpm test:e2e` to exit 1; the temporary file was removed.                   |
| `pnpm audit:prod`, `pnpm audit:full`                                                                    | NOT RUN — per instruction, these remain owner-run.                                                                  |
| `pnpm install`                                                                                          | NOT RUN by me — the owner completed `pnpm install --no-frozen-lockfile`.                                            |
| Gitleaks                                                                                                | NOT RUN — executable unavailable. High-confidence credential-pattern scans of every staged commit found no matches. |

The first E2E run exposed a successful-save navigation being intercepted by the unsaved-changes blocker and stale F2 expectations for the teacher landing page. Those issues were corrected; the final E2E result above is from the subsequent full run.

## 5. Test results and coverage

| Package        | Test files | Tests |     Statements |       Branches |      Functions |          Lines |
| -------------- | ---------: | ----: | -------------: | -------------: | -------------: | -------------: |
| `packages/api` |         21 |    91 |         94.50% |         83.20% |         99.18% |         96.10% |
| `packages/ui`  |         13 |    62 |           100% |           100% |           100% |           100% |
| `apps/portal`  |         21 |    91 | Not configured | Not configured | Not configured | Not configured |

The API exceeds its enforced thresholds (93/83/98/95). UI meets its enforced 100% thresholds on all four metrics. The portal test suite has no coverage threshold in this step. E2E exercised Arabic RTL mobile catalog views, English desktop lesson and bundle flows, upload progress, publishing, server pricing preview, auth, administration, and direction switching.

Screenshots were visually inspected and remain ignored under `docs/reports/screenshots/`:

- `f4-teacher-bundles-en-1280.png` — bundle list and server pricing preview at desktop width; the saved/published/bundle toasts were visible during the capture.
- `f4-teacher-courses-ar-375.png` — Arabic RTL course lesson list at mobile width; labels and card layout were visible without horizontal overflow. Fixture names such as “Mathematics” and “Introduction” remain English sample data.

## 6. Lint-rule proofs

`pnpm lint:rules` passed all 17/17 existing custom-rule fixtures. `pnpm lint` passed with zero warnings. The final staged-file hook also ran `prettier --write` on the staged logical change and `pnpm format:check` before each implementation commit; all hooks passed.

## 7. Bundle sizes

Production build measurements (gzip):

| Metric                                  |    Result |        Budget | Status |
| --------------------------------------- | --------: | ------------: | ------ |
| Portal loader entry                     |   1.44 kB | Informational | PASS   |
| Main app chunk                          |  96.54 kB | Informational | PASS   |
| Total initial-route JavaScript          | 224.90 kB |        250 kB | PASS   |
| Largest lazy route (`LessonEditorPage`) |   9.30 kB |         80 kB | PASS   |

The `/login` chunk report contains no student-registration or teacher-registration page chunk. The standard production build excludes the development gallery.

## 8. Deviations from the spec and why

- The browser fixture distinguishes Chromium’s `Failed to load resource` messages for observed, handled API failures from actual application console errors. Expected 4xx and network-failure scenarios intentionally produce those browser resource messages; uncaught page errors, other console errors, and unhandled MSW requests still fail the scenario. This keeps negative API scenarios testable without suppressing application errors.
- The target resumable `tus` upload method is documented only; current implementation uses the requested signed form-post transport.
- `gitleaks` could not run because it is not installed. A high-confidence credential-pattern scan was used before each commit and found no staged matches.
- Audits were not run because the owner is responsible for them.

## 9. Assumptions

- Mock mode implements the target catalog contract; live mode uses the documented current-backend adapters and capability limits.
- Cairo wall-clock input is converted only in `apps/portal/src/shared/time/time.ts`; server prices and totals are displayed as supplied.
- Public hosting configuration supplies `VITE_API_ORIGIN` and comma-separated HTTPS `VITE_UPLOAD_ORIGINS`; the example Cloudinary origin is a public placeholder.

## 10. Questions

- Backend owner: confirm live lesson-window enforcement and the response fields for locked starts and minimum allowed end times.
- Backend owner: confirm package-to-lesson membership support and server pricing-preview semantics before enabling `bundleLessons` in live mode.
- Backend owner: confirm supported upload provider origins and whether the signing endpoint permits browser-origin CORS for direct form-post upload.
- Product owner: confirm whether live lessons remain disabled for this release and when resumable uploads should be scheduled.
- Project owner: refresh `pnpm audit:prod` and `pnpm audit:full` outside this environment before accepting F4.

## 11. Risks and technical debt

- Current backend gaps limit live mode: lesson-window rules, package lesson membership, live lessons, and some processing-state data are not available. Capability flags prevent unsupported UI paths from crashing, but these flows require backend coordination.
- Direct form-post upload is not resumable. A failed large upload must be retried from the beginning; `tus` remains a documented future contract only.
- CSP deployment must set the actual upload provider origin list. Missing or invalid production values fail the build.
- ESLint 9.39.5 is deprecated but intentionally retained pending plugin support for ESLint 10.
- Audits and a Gitleaks binary were not available in this environment; the staged-pattern scan is not equivalent to a full secret scanner.

## 12. Commits

| Commit    | Message                                                        |
| --------- | -------------------------------------------------------------- |
| `5117b01` | `chore(deps): sync testing dependency lockfile`                |
| `cb1a852` | `feat(api): add teacher catalog contracts and endpoints`       |
| `d9b8640` | `feat(api): add direct upload transport and catalog mocks`     |
| `c0dc865` | `feat(ui): add catalog editor fields and file row`             |
| `aed4b36` | `feat(portal): add teacher course lesson and bundle flows`     |
| `dfc1219` | `test(e2e): verify teacher catalog workflows`                  |
| `af7ea11` | `build(security): allow configured upload origins in CSP`      |
| `a214600` | `docs(catalog): document target contract and upload decisions` |

All commits are local on `feat/f3-foundation`; nothing was pushed or merged. This report is committed separately after the implementation commits.

## 13. What to review first

1. Review the live contract mapping in `docs/api-target-catalog.md` and the evidence table in `docs/contract-differences.md`.
2. Review the lesson editor save and upload sequence in `apps/portal/src/features/catalog-teacher/hooks/`.
3. Review the single Cairo time helper and DST tests in `apps/portal/src/shared/time/`.
4. Review capability behavior for live mode in `packages/api/src/config/capabilities.ts`.
5. Review the CSP allowlist requirement and configure the real upload origin before deployment.
