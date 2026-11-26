# F3 Implementation Report

## 1. Summary

Implemented F3 foundation for administrative navigation, academic administration, and teacher application review/resubmission on `feat/f3-foundation`. The portal now has role-based navigation, responsive sidebar/drawer shells, dialogs, confirmation dialogs, toast notifications, tabs, breadcrumbs, dropdown menus, pagination, URL-backed list state, and Arabic/English admin screens. API contracts, current-backend adapters, capability flags, and MSW handlers cover the new admin domains.

**Verified:** lint, custom lint fixtures, typecheck, unit/component tests, production build, bundle budgets, production gallery exclusion, headers, knip, dependency-cruiser, and Playwright pass. API line coverage is 95.22%, above the F2 baseline of 94.94%; UI line coverage remains 100%. Playwright passed 29/29, including academic track creation, teacher approval, rejection, and the same teacher resubmitting.

The owner must still run `pnpm audit:prod` and `pnpm audit:full`. Several detailed admin error/empty/403 and account-status UI scenarios remain untested; see sections 8 and 11. No F3 dependency was added. `referencebackend/` was not modified or run.

## 2. Files created or changed

- `packages/ui/src/components/`: shared F3 dialog, confirmation, navigation, toast, shell and data-table support; all remain in the UI package. Tests cover the new primitives.
- `apps/portal/src/app/navigation.ts` and `apps/portal/src/app/layouts/`: role-aware navigation config and the shared shell layouts.
- `apps/portal/src/features/academic-admin/`: academic tracks, subjects and track-subject mapping screens, query hooks, forms and dialogs.
- `apps/portal/src/features/teacher-applications/`: application and account lists, detail/review, query keys and mutation hooks.
- `apps/portal/src/features/auth/`: teacher pending summary, timeline, resubmission form and its hook; auth routes no longer use a broad feature barrel.
- `apps/portal/src/shared/navigation/`: validated URL list-state hook, schemas/constants and tests. `apps/portal/src/shared/errors/` centralizes API error toasts.
- `packages/api/src/`: admin contracts, adapters, endpoints, capability flags, mock fixtures, handlers and tests.
- `apps/portal/e2e/`: admin workflow tests and table-driven auth scenario coverage; `apps/portal/scripts/check-bundle-size.mjs` reports entry, app and route sizes.
- `docs/api-target-admin.md`, `docs/contract-differences.md`, ADR-010, ADR-011, `README.md`, `CONTEXT.md`, and this report.
- Playwright screenshots: `f3-academic-en-1280.png`, `f3-application-detail-en-1280.png`, `f3-approved-teacher-en-1280.png`, `f3-resubmitted-teacher-en-1280.png`, `f3-teachers-en-1280.png`, `f3-teachers-en-375.png`, `f3-teachers-ar-375.png` in `docs/reports/`.

The user-provided `noldg Academy.postman_collection.json` remains untracked and was not staged or included in any commit.

## 3. Versions table

No dependencies were added in F3. These are the existing pinned versions used during the checks; they were not upgraded or re-resolved in this step.

| Package/tool      |  Version | Reason/status                                                        |
| ----------------- | -------: | -------------------------------------------------------------------- |
| Node.js           |  24.22.3 | Observed with `node -v`; required runtime line.                      |
| pnpm              | 11.28.11 | Root `packageManager` pin.                                           |
| React / React DOM |   19.3.1 | Existing React 19 application setup.                                 |
| React Router      |    8.5.1 | Existing router; portal routes remain lazy.                          |
| TanStack Query    |  5.107.1 | Existing server-state/cache tool.                                    |
| TypeScript        |    6.0.3 | Existing strict compiler version.                                    |
| Vite              |    8.3.7 | Existing SPA builder; production and E2E builds ran.                 |
| Vitest            |    5.1.0 | Existing unit/component test runner.                                 |
| ESLint            |   9.39.5 | Kept per ADR-006 until configured plugins declare ESLint 10 support. |
| Radix UI          |    1.8.1 | Existing primitives used for the new interactive controls.           |
| Zod               |    4.6.7 | Existing validation library for contracts and list state.            |
| Playwright        |   1.65.0 | Existing browser runner; 29 scenarios passed.                        |

## 4. Commands run with results

| Command                                                                              | Result                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node -v`                                                                            | Pass: `v24.22.3`.                                                                                                                                                 |
| `pnpm -v`                                                                            | Pass: `11.28.11`.                                                                                                                                                 |
| `pnpm lint`                                                                          | Pass: zero errors and warnings.                                                                                                                                   |
| `pnpm lint:rules`                                                                    | Pass: all 17/17 fixture violations were detected.                                                                                                                 |
| `pnpm typecheck`                                                                     | Pass: 3 Turbo tasks.                                                                                                                                              |
| `pnpm test`                                                                          | Pass: 99 tests across 29 test files (42 API, 36 UI, 21 portal).                                                                                                   |
| `pnpm build` with `VITE_API_ORIGIN=https://api.example.invalid` and gallery disabled | Pass: production build and hosting headers generated.                                                                                                             |
| `pnpm check:bundle-size`                                                             | Pass: 1.44 kB entry, 92.05 kB main app, 219.16 kB initial route; route budget passed.                                                                             |
| `pnpm check:no-dev-routes`                                                           | Pass: no gallery marker in production output.                                                                                                                     |
| `pnpm test:headers`                                                                  | Pass: 3/3.                                                                                                                                                        |
| `pnpm knip`                                                                          | Pass.                                                                                                                                                             |
| `pnpm dependency-cruiser`                                                            | Pass: 400 modules and 1,130 dependencies, zero violations.                                                                                                        |
| `pnpm test:e2e`                                                                      | Pass: 29/29, exit code 0; screenshots saved under `docs/reports/`.                                                                                                |
| E2E negative proof                                                                   | Pass: a temporary failing Playwright test previously produced exit code 1; it was removed and is not committed.                                                   |
| Targeted `prettier --check` on F3 source and docs                                    | Pass.                                                                                                                                                             |
| `pnpm format:check`                                                                  | The whole-repository check was previously observed failing on about 330 files, largely outside F3. F3-changed files were formatted and the targeted check passed. |
| `pnpm audit:prod`, `pnpm audit:full`                                                 | Not run; the owner runs these outside this environment.                                                                                                           |
| `referencebackend/` commands                                                         | None run.                                                                                                                                                         |

The full E2E browser build intentionally includes the development gallery for its gallery smoke checks. The ordinary production build excludes it and passed `check:no-dev-routes`.

## 5. Test results and coverage

| Area              |              Result |                                                                                                                      Coverage |
| ----------------- | ------------------: | ----------------------------------------------------------------------------------------------------------------------------: |
| API               |     42 tests passed |                                 95.22% lines; 93.19% statements; 78.69% branches; 98.70% functions. F2 line baseline: 94.94%. |
| UI                |     36 tests passed |                                                               100% lines; 98.96% statements; 96.67% branches; 100% functions. |
| Portal unit tests |     21 tests passed |                                                                                   No portal coverage threshold is configured. |
| Playwright        | 29 scenarios passed | Includes mobile/desktop, Arabic/English, F2 auth scenarios, track creation, application approval, rejection and resubmission. |
| Hosting headers   |      3 tests passed |                                                  Covers configured origin, missing production origin and invalid origin path. |

Component test matrix (F3 additions):

| Component/group                                            | Render/states | axe | Keyboard | RTL     | Notes                                                                                                           |
| ---------------------------------------------------------- | ------------- | --- | -------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| Dialog / ConfirmDialog                                     | Yes           | Yes | Yes      | Yes     | Focus behavior, Escape, return-focus, required reason and cancellation tested.                                  |
| ToastProvider / toast                                      | Yes           | Yes | Yes      | Yes     | Queue limit, dismiss, timed removal, focus pause, hover pause, and logical RTL placement tested.                |
| Tabs                                                       | Yes           | Yes | Yes      | Partial | Arrow-key navigation and accessible rendering covered.                                                          |
| DropdownMenu                                               | Yes           | Yes | Yes      | Yes     | Keyboard opening, accessible menu, and RTL UI context covered.                                                  |
| Pagination                                                 | Yes           | Yes | Yes      | Yes     | Page and page-size events and disabled boundaries covered.                                                      |
| Breadcrumbs, Sidebar, NavItem, AppShell, Topbar, MobileNav | Yes           | Yes | Yes      | Yes     | Combined accessible-shell test and Playwright mobile drawer/direction checks.                                   |
| DataTable                                                  | Yes           | Yes | Yes      | Yes     | Loading/empty/error and responsive layout covered by existing display suite; sorting and action header covered. |
| Chip, Avatar, Image                                        | Yes           | Yes | N/A      | Partial | Image and alt/initials behavior covered.                                                                        |

The detailed academic error/empty/loading/403 states, application race/validation failures, and suspend/reactivate flows do not yet have full page-level test coverage. See section 8.

## 6. Lint-rule proofs

`pnpm lint` passed with the configured rules active. `pnpm lint:rules` passed all 17 fixtures, including the F0 rule set and F1A additions for UI literal text, out-of-registry Lucide imports, and feature anchor elements. No lint rules were weakened. The split endpoint and test modules now remain within the configured file/function limits.

## 7. Bundle sizes

Measured from the final standard production build with gzip sizes:

| Metric                              |      Size |      Budget | Result |
| ----------------------------------- | --------: | ----------: | ------ |
| Portal entry loader                 |   1.44 kB | Report only | Pass   |
| Main app chunk                      |  92.05 kB | Report only | Pass   |
| Total initial-route JavaScript      | 219.16 kB |      250 kB | Pass   |
| Largest lazy route (`TeachersPage`) |   6.39 kB |       80 kB | Pass   |
| Academic route (`AcademicPage`)     |   4.33 kB |       80 kB | Pass   |

The `/login` manifest dependency walk includes shared runtime, auth, login, and UI chunks. It does not include `RegisterPage`, `StudentRegistrationPage`, `TeacherRegistrationPage`, or teacher form route chunks. Entry/app/route figures are provided by `check:bundle-size`; a visualizer report was not generated in this F3 pass.

## 8. Deviations from this spec and why

- No new dependencies were needed; the existing Radix, query, and form stack was reused.
- The work implemented UI infrastructure, academic administration, and teacher applications, but the full requested page scenario matrix is not complete. In particular, page-level list loading/empty/error/403, track/subject edit-disable validation, `ALREADY_REVIEWED`, and suspend/reactivate scenarios still need dedicated tests. Do not treat these as verified flows.
- F3 has not been merged. It remains on `feat/f3-foundation` for owner review.
- Audit commands were not run per the owner-run audit rule.
- No visualizer bundle report was generated; the configured bundle checker measured and reported entry, initial route, and largest lazy route chunks.

## 9. Assumptions

- Mock mode is the acceptance environment for the F3 admin workflows; live capability defaults remain disabled where the current backend does not support the target contract.
- Existing backend routes and shapes are summarized in `docs/contract-differences.md`; `referencebackend/` remains the evidence source and is excluded from tooling.
- Existing F2 baseline coverage is 94.94% API lines and 100% UI lines, taken from `docs/reports/f2-report.md`.
- The uploaded Postman collection is owner data and was kept outside the commits.

## 10. Questions

- Confirm the target backend contract and roles for academic admin, paginated filtering/sorting, application detail/review, reasoned account status, and rejected-teacher resubmission before enabling those live capabilities.
- Confirm whether post-resubmission teacher status should immediately become `pending` or remain rejected until a separate server decision.
- Confirm if screenshots should remain committed assets or be stored as CI artifacts in future steps.

## 11. Risks and technical debt

- **High:** current-backend admin API does not support the complete target contract. Admin pages are mock-verified; do not enable live capability flags until the backend implementation is confirmed.
- **Medium:** application detail/list race handling and `ALREADY_REVIEWED` are not covered in page-level tests. A review race must be handled by the backend, with the frontend refresh behavior verified against the agreed response.
- **Medium:** list APIs currently normalize legacy list responses locally when backend pagination is unavailable; they cannot prove scalability for large collections. Backend pagination/filtering is required before production data volumes grow.
- **Medium:** F3 page tests do not yet cover list empty/error/403, track/subject update-disable errors, and account suspend/reactivate UI flows.
- **Low:** full repository Prettier check has pre-existing failures outside the F3-changed files; changed files passed the targeted check.
- **Low:** audit status is not current for this step. The last owner-provided output showed no production advisories and one moderate full-audit advisory; owner must rerun both commands.

## 12. Commits

Verified commits on `feat/f3-foundation` at report authoring:

| Hash      | Message                                                        |
| --------- | -------------------------------------------------------------- |
| `d4ddbf7` | `feat(ui): add admin navigation and feedback primitives`       |
| `6d4d093` | `feat(api): add academic and teacher administration contracts` |
| `5e37301` | `feat(portal): implement academic and teacher workflows`       |

The docs/report commit is recorded in the final chat after this report is committed; it is not self-listed here. No commit was made on `main`. The owner-provided Postman collection was excluded.

## 13. What to review first

1. Review `docs/contract-differences.md` and `docs/api-target-admin.md`; confirm target/current API boundaries with the backend owner.
2. Review admin role access and the capability defaults in `packages/api/src/config/capabilities.ts`.
3. Review track/subject constraints and disable flows in `apps/portal/src/features/academic-admin/`.
4. Review teacher rejection/resubmission and the missing account status scenarios in `apps/portal/src/features/teacher-applications/` and `apps/portal/src/features/auth/`.
5. Run `pnpm audit:prod` and `pnpm audit:full` locally before accepting F3.
