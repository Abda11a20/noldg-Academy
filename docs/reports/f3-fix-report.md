# F3-FIX Technical Report

## 1. Summary

Completed the requested F3 test, coverage, formatting, and resubmission corrections on `feat/f3-foundation`. The normal E2E suite passes 29/29; the temporary negative-proof test made `pnpm test:e2e` exit 1 and was removed. UI coverage is 100% on all four metrics; API coverage exceeds all four requested thresholds. The latest standard production build passes the absolute bundle budgets and contains no production gallery marker.

No package was installed, and `node_modules` was not intentionally modified. No files under `referencebackend/` were changed, imported, or run. The owner remains responsible for the two audit commands.

## 2. Files created or changed

- Page-level MSW tests: `apps/portal/src/features/academic-admin/pages/AcademicPage.test.tsx`, `apps/portal/src/features/teacher-applications/pages/TeachersPage.test.tsx`, and `apps/portal/src/features/auth/pages/TeacherPendingPage.test.tsx`.
- Shared test support: `apps/portal/src/shared/testing/render-page.tsx`, `packages/api/src/mocks/testing.ts`, and the portal test setup/aliases.
- Coverage and UI tests: both package Vitest configs, API contract/adapter/admin tests, UI dialog/toast/navigation tests, and the `ToastItemView` test.
- Fixes: API track duplicate detection and academic capability guard; preserved teacher status history on resubmission; pending state refresh and timeline; safe duplicate-track translation; DropdownMenu RTL direction; review-conflict refresh; table and form test behavior.
- Tooling/docs: CI `format:check`, whole-repo Prettier LF settings, Knip test-tool exceptions, `.gitignore`, `CONTEXT.md`, `docs/api-target-admin.md`, and the prior F3 report test matrix.
- New browser screenshots are in the gitignored `docs/reports/screenshots/` folder: `f3-academic-en-1280.png`, `f3-application-detail-en-1280.png`, `f3-approved-teacher-en-1280.png`, `f3-resubmitted-teacher-en-1280.png`, `f3-teachers-ar-375.png`, `f3-teachers-en-1280.png`, and `f3-teachers-en-375.png`.
- `.gitattributes`, `.editorconfig`, and the standalone `chore: normalize line endings` commit were already present on this branch before the F3-FIX changes.

## 3. Versions

No package versions changed and no new package was installed.

| Tool/package                  |  Version | Reason/status                                                                                           |
| ----------------------------- | -------: | ------------------------------------------------------------------------------------------------------- |
| Node.js                       |  24.22.3 | `node -v`; required Node 24 line.                                                                       |
| pnpm                          | 11.28.11 | Existing root `packageManager` pin.                                                                     |
| React / React DOM             |   19.3.1 | Existing React 19 setup.                                                                                |
| TypeScript                    |    6.0.3 | Existing strict compiler.                                                                               |
| Vite                          |    8.3.7 | Existing portal builder.                                                                                |
| Vitest                        |    5.1.0 | Existing test runner.                                                                                   |
| ESLint                        |   9.39.5 | Retained per ADR-006 plugin compatibility.                                                              |
| Playwright                    |   1.65.0 | Existing browser test runner.                                                                           |
| `@testing-library/react`      |   16.3.3 | Existing UI-workspace test dependency used through the portal Vitest alias; not installed by this task. |
| `@testing-library/user-event` |   14.6.8 | Existing UI-workspace test dependency used through the portal Vitest alias; not installed by this task. |

The last two packages are ignored by Knip for the portal workspace because they are test-only imports resolved from the existing UI workspace dependency installation. No production dependency was added.

## 4. Commands run and results

| Command                                                                | Result                                                                                                                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node -v`                                                              | Pass: `v24.22.3`.                                                                                                                                                                     |
| `pnpm lint`                                                            | Pass: ESLint reported no errors or warnings.                                                                                                                                          |
| `pnpm lint:rules`                                                      | Pass: all 17/17 rule fixtures produced their expected violations.                                                                                                                     |
| `pnpm typecheck`                                                       | Pass: 3 Turbo tasks.                                                                                                                                                                  |
| `pnpm test`                                                            | Pass: 36 test files, 164 tests: API 54, UI 52, portal 58.                                                                                                                             |
| `pnpm format:check`                                                    | Pass: entire repository; only generated output and `referencebackend/` are excluded. Reran after formatting the report and after the implementation commits.                          |
| `pnpm build` with `VITE_API_ORIGIN=https://api.example.invalid`        | Pass: standard production build and headers generation.                                                                                                                               |
| `pnpm check:bundle-size`                                               | Pass: entry 1.44 kB gzip, main app 92.15 kB gzip, initial JavaScript 219.25 kB gzip; largest route is TeachersPage at 6.40 kB, all routes below 80 kB.                                |
| `pnpm check:no-dev-routes`                                             | Pass after the standard production build: no gallery marker found. An earlier check raced the E2E build output and saw its gallery; it was rerun after the standard build and passed. |
| `pnpm test:headers`                                                    | Pass: 3/3.                                                                                                                                                                            |
| `pnpm knip`                                                            | Pass.                                                                                                                                                                                 |
| `pnpm dependency-cruiser`                                              | Pass: 418 modules and 1,177 dependencies, zero violations.                                                                                                                            |
| `pnpm test:e2e`                                                        | Pass: 29/29, exit 0. Screenshots saved in the ignored report screenshot folder.                                                                                                       |
| Negative proof: temporary failing Playwright test then `pnpm test:e2e` | Expected failure confirmed: 29 passed, 1 intentional failure, exit 1. The temporary test file was removed.                                                                            |
| `git log --all -- '*postman*'`                                         | Pass: no history matches.                                                                                                                                                             |
| `pnpm audit:prod`, `pnpm audit:full`                                   | Not run; the owner runs these outside this environment.                                                                                                                               |
| `pnpm install`                                                         | Not run. `node_modules` was not deleted or intentionally modified.                                                                                                                    |

The E2E and standard production builds both completed. Build output is generated and ignored.

## 5. Test results and coverage

| Area            |              Result |                                                                                     Coverage |
| --------------- | ------------------: | -------------------------------------------------------------------------------------------: |
| `packages/api`  | 54 passed, 12 files | Statements 95.00%, branches 83.05%, functions 98.71%, lines 96.74% (thresholds 93/83/98/95). |
| `packages/ui`   | 52 passed, 12 files |                                  Statements 100%, branches 100%, functions 100%, lines 100%. |
| `apps/portal`   | 58 passed, 12 files |                                                  No portal coverage threshold is configured. |
| Playwright      |           29 passed |    Includes F2 auth scenarios, admin screen flows, Arabic/English and mobile/desktop checks. |
| Hosting headers |            3 passed |                       Configured origin, missing production origin, and invalid origin path. |

Page tests cover academic track, subject, and track-subject lists in loading, empty, server-error, and 403 states; track create/edit/disable and validation; subject create/edit/disable; mapping add/remove; applications and teacher tabs in loading/empty/error/403 states; review failure, reason validation and 409 refresh; suspend/reactivate success and failure; resubmission validation failure; and live-mode academic access denial. Contract tests enforce grade bounds and reject American Diploma in preparatory school. Resubmission sets status to `pending` while retaining the rejection event and reason in `statusHistory`.

## 6. Lint-rule proofs and component matrix

`pnpm lint` passed, and `pnpm lint:rules` proved 17/17 fixtures. No lint rule was weakened.

| Component/group                                            | Render/variants | axe | Keyboard     | RTL | States/edge cases                                                                                          |
| ---------------------------------------------------------- | --------------- | --- | ------------ | --- | ---------------------------------------------------------------------------------------------------------- |
| Dialog                                                     | Yes             | Yes | Escape       | Yes | Focus trap and focus return; disconnected opener and non-HTML opener covered.                              |
| ConfirmDialog                                              | Yes             | Yes | Yes          | Yes | Required reason minimum, missing/optional hint, cancellation, and bypassed disabled control covered.       |
| ToastProvider / toast                                      | Yes             | Yes | Yes          | Yes | Queue limit, dismiss, auto-dismiss, focus pause, hover pause, polite status and logical placement covered. |
| Tabs                                                       | Yes             | Yes | Arrow keys   | Yes | Empty collection covered.                                                                                  |
| DropdownMenu                                               | Yes             | Yes | Enter/Escape | Yes | Disabled destructive entry and direction context covered.                                                  |
| Pagination                                                 | Yes             | Yes | Yes          | Yes | Page/page-size callbacks and disabled boundaries covered.                                                  |
| Sidebar, NavItem, AppShell, Topbar, MobileNav, Breadcrumbs | Yes             | Yes | Yes          | Yes | Responsive drawer and navigation states covered.                                                           |
| DataTable                                                  | Yes             | Yes | Yes          | Yes | Loading, empty, error, actions/sort and stacked layout covered by existing UI suite.                       |

## 7. Bundle sizes

Measured after the final standard production build:

| Metric                              | Gzip size |      Budget | Result |
| ----------------------------------- | --------: | ----------: | ------ |
| Portal entry                        |   1.44 kB | Report only | Pass   |
| Main app chunk                      |  92.15 kB | Report only | Pass   |
| Initial JavaScript                  | 219.25 kB |      250 kB | Pass   |
| Largest lazy route (`TeachersPage`) |   6.40 kB |       80 kB | Pass   |
| Academic page route                 |   4.56 kB |       80 kB | Pass   |

The `/login` manifest dependency walk contains its auth and shared UI/runtime chunks; it does not contain `RegisterChoicePage`, `StudentRegistrationPage`, or `TeacherRegistrationPage`. The standard production build excludes the gallery.

## 8. Deviations from the spec and why

- No package installation or version changes were needed. Existing test libraries are resolved through the already-installed UI workspace and a portal Vitest alias.
- Audit commands remain owner-run and were not executed.
- Earlier committed F1A/F2 screenshots were regenerated by Playwright during the check and restored from the repository index. New F3 screenshots are ignored under `docs/reports/screenshots/`; no history was rewritten.
- The first post-E2E gallery exclusion check observed E2E build artifacts due command ordering. The standard production build was run, then the check passed against its output.

## 9. Assumptions

- Mock mode remains the acceptance path for academic and teacher administration until the backend implements the documented target contracts.
- The target behavior on teacher resubmission is immediate `pending`, with prior rejection history retained.
- `referencebackend/` and the owner-supplied Postman files are reference material and are not modified or committed.

## 10. Questions

- The owner should rerun `pnpm audit:prod` and `pnpm audit:full` locally before accepting F3-FIX.
- Confirm with the backend owner when the target F3 routes and capabilities are implemented before enabling them in live mode.

## 11. Risks and technical debt

- Live backend administration still differs from the target contract: admin access, pagination/filtering, teacher application detail/review conflict semantics, reasoned account status and resubmission history require backend support. Adapters/capabilities keep those gaps out of page code.
- The testing-library packages remain declared under the UI workspace rather than as portal devDependencies. Portal test resolution uses explicit aliases, and Knip ignores those test-only package names; a future tooling cleanup may centralize shared test dependencies.
- Audit state is not current for this run. The owner previously reported no production advisories and one moderate full-audit advisory, but those results were not refreshed here.
- Git status reports 241 worktree entries, while only three tracked paths have content diffs and one untracked report is present. I preserved these entries because their origin is unclear and did not reset or clean the worktree. Review this state before merging.

## 12. Commits

F3-FIX implementation commits:

| Hash      | Message                                                 |
| --------- | ------------------------------------------------------- |
| `699c88b` | `chore(tooling): enforce full repository format checks` |
| `7791f21` | `build(api): expose mock testing helpers`               |
| `0b42e04` | `test(portal): cover F3 administration scenarios`       |
| `a56f1e5` | `test(api): enforce F3 coverage thresholds`             |
| `2781084` | `test(ui): restore F3 interaction coverage`             |

The report and final documentation are committed separately after this implementation list. No changes were made on `main`; branch is `feat/f3-foundation`. The Postman history query returned no matches.

## 13. What to review first

1. Review the new page tests and the 100% UI/API coverage thresholds.
2. Review resubmission history behavior in the mock handler, teacher timeline and `docs/api-target-admin.md`.
3. Review the duplicate-track safe error and the admin live capability guard.
4. Review the `DropdownMenu` RTL direction and the corrected component matrix.
5. Run both audit commands locally, then review the F3-FIX diff before merge.
