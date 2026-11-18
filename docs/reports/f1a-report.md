# F1A Report — Design System, Part 1

## 1. Summary

F1A established shared design foundations on feat/f1a-design-system: tokens, UI components, icons, forms, feedback and data display, the Arabic/English UI gallery, tooling, lint proofs, CI and docs. F1A-FIX resolves the Windows Playwright exit behavior, adds absolute portal bundle budgets and API tree-shaking metadata, fixes the anonymous redirect's unhandled request, and adds keyboard and axe coverage for the requested controls. No product pages were added. referencebackend/ remained read-only. No install command ran and node_modules was not touched.

Lint, all 17 custom lint fixtures, typecheck, unit/component tests, build, no-dev-route check, headers tests, knip, dependency-cruiser, bundle budgets, and two Playwright runs passed. Both E2E runs passed 4/4 scenarios and exited with code 0. Audit scripts were left unchanged and not run, as requested.

## 2. Files created or changed

- Portal E2E: apps/portal/scripts/run-e2e.mjs, e2e-constants.mjs, Playwright config, Vite route gating, E2E redirect scenario, strict MSW handling.
- Bundle gate: apps/portal/scripts/check-bundle-size.mjs, root package script, Vite manifest setting, CI order/check.
- Tree-shaking: packages/api/package.json sets sideEffects false; packages/ui/package.json keeps only CSS files marked side effectful.
- Tests: packages/ui/src/f1a-forms.test.tsx and f1a-display.test.tsx add keyboard and axe checks.
- Gallery screenshots: docs/reports/f1a-gallery-ar-375.png, f1a-gallery-ar-1280.png, f1a-gallery-en-375.png, f1a-gallery-en-1280.png.
- F1A implementation files and docs are described in the earlier F1A commits listed in section 12.
- Updated docs/reports/f1a-report.md and CONTEXT.md.

## 3. Versions

No package version or dependency changed during F1A-FIX. Relevant resolved versions:

| Package/tool                    |         Version | Reason                                                                     |
| ------------------------------- | --------------: | -------------------------------------------------------------------------- |
| Node.js                         |         24.22.3 | Required Node 24 runtime.                                                  |
| pnpm                            |        11.28.11 | Required pnpm 11; exact packageManager pin.                                |
| React / React DOM               | 19.3.1 / 19.3.1 | Existing compatible catalog versions.                                      |
| ESLint / @eslint/js             | 9.39.5 / 9.39.5 | ADR-006 keeps ESLint 9 until configured plugins declare ESLint 10 support. |
| TypeScript                      |           6.0.3 | TypeScript 7 is newer, but toolchain peers do not yet declare support.     |
| Vite / Vitest                   |   8.3.7 / 5.1.0 | Existing catalog versions; retained.                                       |
| React Router / TanStack Query   | 8.5.1 / 5.107.1 | Existing catalog versions.                                                 |
| Tailwind / @tailwindcss/vite    |   4.3.5 / 4.3.5 | Existing compatible pair.                                                  |
| lucide-react                    |          1.71.0 | F1A-required icon library; maintained upstream, ISC.                       |
| radix-ui                        |           1.8.1 | F1A-required accessible controls; maintained upstream, MIT.                |
| @playwright/test                |          1.65.0 | Existing exact pin; no dependency changes in this fix.                     |
| Fontsource IBM Plex Sans Arabic |           5.3.0 | Self-hosted Arabic and Latin font package; OFL.                            |

Other exact pins and selection reasons are in docs/reports/F0-report.md and the previous F1A report history. No new dependency was added.

## 4. Commands run with results

No pnpm install, node_modules deletion, or node_modules modification occurred.

| Command                                                | Result                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| pnpm lint                                              | Pass; ESLint completed with zero warnings.                     |
| pnpm lint:rules                                        | Pass; 17/17 expected fixture violations detected.              |
| pnpm typecheck                                         | Pass; 3 workspace tasks succeeded.                             |
| pnpm test                                              | Pass; UI 14/14, API 8/8; portal has no unit-test files.        |
| VITE_API_ORIGIN=https://api.example.invalid pnpm build | Pass; production build completed.                              |
| pnpm check:bundle-size                                 | Pass; entry 126.00 kB gzip, initial-route JS 131.11 kB gzip.   |
| pnpm check:no-dev-routes                               | Pass; production output has no gallery marker.                 |
| pnpm test:headers                                      | Pass; 3/3 tests.                                               |
| pnpm knip                                              | Pass; no unused files, exports, or dependencies.               |
| pnpm dependency-cruiser                                | Pass; 171 modules and 263 dependencies, no violations.         |
| pnpm test:e2e — run 1                                  | Pass; 4/4 scenarios, E2E_EXIT_CODE=0.                          |
| pnpm test:e2e — run 2                                  | Pass; 4/4 scenarios, E2E_EXIT_CODE=0.                          |
| pnpm audit:prod and pnpm audit:full                    | Not run and unchanged; owner runs outside sandbox per request. |

The E2E runner builds a test-only production bundle with the dev gallery enabled, launches Vite preview directly with Node on port 4174, and starts Playwright with list and JSON reporters. The JSON report provides the result if Playwright remains alive after reporting. On Windows, taskkill was denied for the Playwright child; direct child termination fallback allowed both commands to exit with code 0. The preview port was no longer listening after each run. Playwright workers printed Node NO_COLOR/FORCE_COLOR warnings only.

## 5. Test results and coverage

- UI: 14 passed; 100% statements, branches, functions, and lines.
- API: 8 passed; 87.61% statements, 81.81% branches, 84% functions, 88.23% lines.
- Header generation: 3/3 passed.
- Portal unit tests: none currently exist; Vitest reports no test files and exits 0.
- E2E: two passes, each 4/4: portal/auth redirect, language and direction switch, gallery in both directions, and Arabic/English gallery at 375px and 1280px.
- The anonymous redirect scenario now uses client-side navigation after login so it does not issue a document GET /student. MSW mock mode configures onUnhandledFrame: "error". Neither E2E run printed an unhandled-request warning.
- Gallery screenshots were generated at 375px and 1280px in Arabic and English.

| Component     | Render/variants | axe | Keyboard                       | RTL                | States                                           |
| ------------- | --------------- | --- | ------------------------------ | ------------------ | ------------------------------------------------ |
| Select        | ✓               | ✓   | ✓ ArrowDown/Enter              | Gallery in RTL/LTR | options, placeholder, disabled, error            |
| Checkbox      | ✓               | ✓   | ✓ Space                        | Gallery in RTL/LTR | checked, unchecked, controlled, disabled         |
| RadioGroup    | ✓               | ✓   | ✓ ArrowDown                    | Gallery in RTL/LTR | selected, controlled, disabled, orientation      |
| Switch        | ✓               | ✓   | ✓ Space                        | Gallery in RTL/LTR | checked, unchecked, controlled, disabled         |
| Stars input   | ✓               | ✓   | ✓ Enter                        | Gallery in RTL/LTR | read-only and selected rating                    |
| PasswordField | ✓               | ✓   | ✓ Enter                        | Gallery in RTL/LTR | masked, visible, error, required                 |
| FileDropzone  | ✓               | ✓   | ✓ Space                        | Gallery in RTL/LTR | empty, selected, progress, error, disabled, drag |
| DataTable     | ✓               | ✓   | Not applicable; presentational | Gallery in RTL/LTR | rows, loading, empty, error, responsive gallery  |

## 6. Lint-rule proofs

pnpm lint:rules passed all 17 fixture proofs, including literal user-facing text in packages/ui, a direct Lucide import outside the registry, and a feature anchor. Existing fixtures cover the F0 architecture rules. pnpm lint passed with zero warnings.

## 7. Bundle sizes

Absolute budgets: entry JavaScript <=150 kB gzip and total initial-route JavaScript <=250 kB gzip. The checker reads the production Vite manifest, follows the portal entry plus lazy AuthLayout route, gzip-compresses the emitted JS with Node, and fails if either limit is exceeded.

| Measurement                 | Before API sideEffects change |     After |   Budget | Result |
| --------------------------- | ----------------------------: | --------: | -------: | ------ |
| Entry JS gzip               |                     126.00 kB | 126.00 kB | <=150 kB | Pass   |
| Total initial-route JS gzip |                     131.11 kB | 131.11 kB | <=250 kB | Pass   |

The API metadata change produced no measurable size change because the entry currently imports no API implementation code. UI already declares only CSS files as side-effectful, so its JavaScript remains tree-shakeable. Import scan found named workspace imports and no whole-library or namespace imports. The production entry is 404.70 kB raw / 127.48 kB gzip as reported by Vite; the initial AuthLayout closure measured by the gate is 131.11 kB gzip and includes PortalFrame. Production excludes the gallery; the separate E2E build includes it.

No visualizer package exists in the installed dependency store. Adding dependencies and reinstalling were prohibited for this fix, so I inspected the Vite manifest and emitted chunk graph once instead. The production entry declares lazy AuthLayout, StudentLayout, TeacherLayout, AdminLayout, NotFound, and gallery route chunks. No third-party treemap is claimed.

## 8. Deviations from this spec and why

- No third-party visualizer was run because the dependency is absent and this fix does not authorize adding dependencies or reinstalling. Manifest/chunk graph analysis was used.
- Audit scripts were intentionally left unchanged and not run per owner instruction; vulnerability status is not updated here.
- Windows denied taskkill for the Playwright CLI child. The script uses direct child termination as a fallback; both runs exited zero and the preview port closed.
- E2E creates a test-only production build with gallery enabled. The ordinary production build and bundle gate remain gallery-free.
- Install and peer-warning checks were not rerun, honoring the no-install/no-node_modules rule.

## 9. Assumptions

- The owner's manually installed node_modules is the intended dependency state.
- https://api.example.invalid is a build-only CSP placeholder, not a service endpoint or secret.
- F0 bundle figures are taken from docs/reports/F0-report.md.

## 10. Questions

- Can the owner run pnpm audit:prod and pnpm audit:full outside the sandbox and attach the results?
- Is Vite manifest/chunk-graph analysis sufficient, or should a visualizer dependency be approved in a later step?

## 11. Risks and technical debt

- Audit state was not checked in this fix. The documented development-only minimatch advisory remains in docs/security-exceptions.md.
- Windows denied taskkill for the Playwright child in this sandbox; direct child termination worked twice and the preview port was closed after both runs.
- No third-party module treemap is available without adding a dependency.
- The temporary sessionStorage auth fallback and missing backend refresh endpoint remain documented F0 technical debt.

## 12. Commits

F1A commits before this fix:

- 8cbb6ae docs(f1a): record design decisions and rules
- d0a3d88 chore(tooling): enforce F1A validation and security rules
- 0e4006b refactor(ui): split gallery examples and tests
- 94b76be feat(portal): expand the development UI gallery
- 5808396 feat(ui): add F1A shared design system

Earlier history: aab5296 docs(f0): add foundation verification report; 7832185 feat(f0): establish frontend foundation; 4d00558 chore: initialize repository. F1A-FIX implementation commits:

- ee96404 fix(portal): exit Windows E2E runs cleanly
- 59bc402 build(portal): enforce initial bundle gzip budgets
- 1429102 test(ui): cover keyboard and accessibility interactions

Earlier history: aab5296 docs(f0): add foundation verification report; 7832185 feat(f0): establish frontend foundation; 4d00558 chore: initialize repository. This report and CONTEXT are committed in a separate docs commit; its own hash is included in the final chat git log because a commit cannot contain its own hash.

## 13. What I should review first

1. Inspect the four gallery screenshots and verify the 150/250 kB gzip budgets.
2. Review the Windows E2E runner, teardown fallback, and strict mock behavior.
3. Run both audit commands outside the sandbox.
4. Review the component coverage matrix and docs/security-exceptions.md, then the F1A/F1A-FIX changes.
