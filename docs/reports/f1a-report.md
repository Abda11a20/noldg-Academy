# F1A Report — Design System, Part 1

## 1. Summary

Implemented the F1A design system and housekeeping scope on `feat/f1a-design-system`: responsive tokens, shared UI components, Lucide icon registry, Radix-backed controls, the Arabic/English UI gallery, headers generation, security and tooling updates, lint fixtures, and CI/docs updates. No product pages were added. `referencebackend/` remained read-only and excluded from tooling and Git. No install command ran and `node_modules` was not touched.

Lint, all 17 custom lint-rule fixtures, typecheck, unit/component tests, production build, production-gallery exclusion, headers tests, knip, and dependency-cruiser passed. The two npm audit commands could not reach npm's advisory endpoint (`EACCES`). Playwright listed all four scenarios as passed and generated all four requested screenshots, but the Playwright process did not exit after the final scenario; it was interrupted, so the e2e command is not recorded as a clean pass. The change is therefore implemented but not fully verified against every F1A gate.

## 2. Files created or changed

- UI: expanded `packages/ui/src/` with F1A layout, typography, form, feedback, and data-display components; Button extensions; `UiProvider`; Lucide registry and lazy glyph renderer; tokens; and tests split by concern in `f1a-buttons-icons.test.tsx`, `f1a-forms.test.tsx`, and `f1a-display.test.tsx`. Updated `packages/ui/package.json` and `src/index.ts`.
- Portal: expanded the development-only `/__ui` gallery with separate forms, feedback, and data showcase components, language switch, gallery fixtures/translations, and Playwright coverage. Added CSP header generator and tests under `apps/portal/scripts/`; removed static `apps/portal/public/_headers`.
- Tooling and supply chain: updated `pnpm-workspace.yaml`, `pnpm-lock.yaml`, package scripts, `turbo.json`, `.npmrc`, `.gitignore`, `.prettierignore`, ESLint/TypeScript config, Husky, dependency-cruiser, Knip configuration, and CI.
- Lint proof: added F1A fixtures for literal strings in UI, external Lucide imports, and feature anchors; updated the fixture verifier.
- Docs: updated `README.md`, `CONTEXT.md`, `docs/rules/FRONTEND-RULES.md`; added ADR-007, ADR-008, and `docs/security-exceptions.md`.
- Screenshots: `docs/reports/f1a-gallery-ar-375.png`, `f1a-gallery-ar-1280.png`, `f1a-gallery-en-375.png`, and `f1a-gallery-en-1280.png`.

## 3. Versions

| Package/tool                    |         Version | Selection reason                                                                                                                                                                                            |
| ------------------------------- | --------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js                         |         24.22.3 | Required Node 24 runtime; `.nvmrc` and engines pin the major.                                                                                                                                               |
| pnpm                            |        11.28.11 | Required pnpm 11; exact packageManager pin.                                                                                                                                                                 |
| React / React DOM               | 19.3.1 / 19.3.1 | Existing compatible catalog versions.                                                                                                                                                                       |
| ESLint / `@eslint/js`           | 9.39.5 / 9.39.5 | ESLint 9 is required by ADR-006 because configured React, jsx-a11y, and import plugins have not declared ESLint 10 support.                                                                                 |
| TypeScript                      |           6.0.3 | TypeScript 7.0.2 is newer, but the full TypeScript API toolchain does not declare compatible support.                                                                                                       |
| Vite / Vitest                   |   8.3.7 / 5.1.0 | Existing catalog versions; retained for the configured toolchain.                                                                                                                                           |
| React Router / TanStack Query   | 8.5.1 / 5.107.1 | Existing catalog versions used for library-mode routing and query provider.                                                                                                                                 |
| Tailwind / `@tailwindcss/vite`  |   4.3.5 / 4.3.5 | Existing compatible catalog pair.                                                                                                                                                                           |
| `lucide-react`                  |          1.71.0 | Required by F1A to replace handwritten icon paths with the requested maintained library; highest release selected under seven-day release-age and React peer constraints. Maintained upstream; ISC license. |
| `radix-ui`                      |           1.8.1 | Required for the requested accessible Select, Checkbox, RadioGroup, and Switch primitives; the unified package supports those controls. Maintained upstream; MIT license.                                   |
| Fontsource IBM Plex Sans Arabic |           5.3.0 | Existing self-hosted font package retained; OFL license and Arabic/Latin subsets.                                                                                                                           |

Other exact pins retained from F0 include i18next 27.0.1, react-i18next 18.0.1, Zod 4.6.7, MSW 3.0.4, class-variance-authority 0.7.1, TanStack Query 5.107.1, Playwright 1.65.0, Testing Library React 16.3.3, jest-axe 11.0.0, Tailwind 4.3.5, Turbo 2.11.10, Prettier 3.9.10, Husky 9.1.7, Knip 6.44.2, dependency-cruiser 18.7.2, typescript-eslint 8.72.2, and the configured ESLint plugins. The full resolved F0 catalog and reasons for other non-latest selections remain in [F0-report.md](F0-report.md); F1A changed only the two dependencies listed above. A fresh install/peer-warning transcript was not produced in this continuation because the owner supplied the installed modules and prohibited install operations.

## 4. Commands run with results

Commands were run in the requested gate order after the final code change, except that the production build needed the documented public API origin.

| Command                        | Result                                                                                                                                                                                                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                    | Pass; ESLint completed with `--max-warnings 0`.                                                                                                                                                                                                                                        |
| `pnpm lint:rules`              | Pass; 17/17 expected fixture violations detected.                                                                                                                                                                                                                                      |
| `pnpm typecheck`               | Pass; 3 workspace typecheck tasks succeeded.                                                                                                                                                                                                                                           |
| `pnpm test`                    | Pass; UI 14/14, API 8/8; portal has no unit-test files.                                                                                                                                                                                                                                |
| `pnpm build`                   | First invocation failed because required `VITE_API_ORIGIN` was absent. Rerun with `VITE_API_ORIGIN=https://api.example.invalid` passed.                                                                                                                                                |
| `pnpm check:no-dev-routes`     | Pass; no gallery marker in production output.                                                                                                                                                                                                                                          |
| `pnpm test:headers`            | Pass; 3/3 tests.                                                                                                                                                                                                                                                                       |
| `pnpm knip`                    | Pass; no unused files, exports, or dependencies reported.                                                                                                                                                                                                                              |
| `pnpm dependency-cruiser`      | Pass; 158 modules and 242 dependencies, no violations.                                                                                                                                                                                                                                 |
| `pnpm audit:prod`              | Fail/blocked; npm advisory bulk endpoint POST returned `EACCES`, then `fetch failed` after retries.                                                                                                                                                                                    |
| `pnpm audit:full`              | Fail/blocked for the same npm endpoint network error.                                                                                                                                                                                                                                  |
| `pnpm test:e2e -- --workers=1` | Incomplete command result: Playwright displayed all 4 scenarios as `ok`, generated the four screenshots, then remained alive without a final summary/exit code. Interrupted well before the 10-minute limit. CI-mode and direct Playwright invocations showed the same post-test hang. |

No install, cleanup, or modification of `node_modules` was performed. The F0 screenshot accidentally overwritten during gallery smoke was restored from the committed F0 artifact.

## 5. Test results and coverage

- UI: 14 tests passed. Coverage was 100% statements, 100% branches, 100% functions, and 100% lines for `packages/ui`.
- API: 8 tests passed. Coverage was 87.61% statements, 81.81% branches, 84% functions, and 88.23% lines.
- Header generator: 3/3 Node tests passed.
- Portal unit tests: no test files exist; Vitest exited successfully with that notice.
- E2E: the browser reported 4/4 scenarios passed: portal/auth redirect, language and direction switch, both gallery directions, and Arabic/English gallery at 375px and 1280px. The runner hang means the suite's command exit status remains unverified.
- The E2E output included an MSW warning for an unhandled `GET /student` during the anonymous redirect scenario; the redirect assertion passed, but the warning remains visible in the output.
- Screenshots generated:
  - Arabic 375px: `docs/reports/f1a-gallery-ar-375.png`
  - Arabic 1280px: `docs/reports/f1a-gallery-ar-1280.png`
  - English 375px: `docs/reports/f1a-gallery-en-375.png`
  - English 1280px: `docs/reports/f1a-gallery-en-1280.png`

## 6. Lint-rule proofs

`pnpm lint:rules` passed all 17 fixtures. The F1A additions prove rejection of a literal user-facing string in `packages/ui`, a direct Lucide import outside the icon registry, and an anchor element in a feature. Existing fixtures cover the F0 architectural rules. The portal test task declares empty Turbo outputs because it has no unit test artifacts; E2E outputs are declared separately.

## 7. Bundle sizes

The production build emitted a 404.70 kB entry chunk (127.48 kB gzip), a 10.42 kB lazy glyph chunk (3.76 kB gzip), and an 11.18 kB PortalFrame chunk (4.95 kB gzip). Summing emitted JavaScript chunks gives approximately 428.32 kB (137.71 kB gzip).

F0 recorded a 344.06 kB entry (108.92 kB gzip) and 408.97 kB across JavaScript chunks (131.60 kB gzip). Compared with F0, the entry grew about 17.6% (18.6% gzip), above the approximately 15% entry limit. Total emitted JavaScript grew about 4.7% (4.6% gzip), within 15%. The required entry-size target is therefore not met; this is a deviation for review, not a claimed pass.

## 8. Deviations from this spec and why

- The Playwright process did not exit cleanly even though it reported all four tests as passed. The command is marked incomplete and needs a clean rerun.
- Both audit commands were blocked by the environment's denied network access to npm's advisory endpoint. No vulnerability-free claim is made.
- Initial entry JavaScript grew 17.6% versus F0, exceeding the approximately 15% target. Total emitted JavaScript remains under that threshold.
- Production build requires `VITE_API_ORIGIN`; the unconfigured command correctly fails, and the configured build passed.
- No install/peer-warning check was rerun, honoring the owner's prohibition on install operations and touching `node_modules`.

## 9. Assumptions

- The owner's manually installed `node_modules` is the intended dependency state for this validation pass.
- `https://api.example.invalid` is a build-only documented placeholder used to test CSP generation; it is not a real service endpoint or secret.
- The reported F0 bundle sizes are taken from `docs/reports/F0-report.md`.

## 10. Questions

- Can the audit commands be rerun in an environment permitted to reach npm's security endpoint?
- Can the Playwright hang be investigated on the owner's machine or in CI to obtain a clean process exit?
- Should the portal entry's 17.6% increase be reduced below the F1A threshold before acceptance?

## 11. Risks and technical debt

- Audit status is unknown until the registry endpoint is reachable. The recorded moderate development-only `minimatch` advisory remains in `docs/security-exceptions.md`.
- The e2e test process hang prevents a fully clean end-to-end gate result.
- The portal entry-size budget is exceeded; emitted total JavaScript remains within the requested growth budget.
- Existing temporary sessionStorage auth fallback and missing backend refresh endpoint remain documented F0 technical debt.

## 12. Commits

F1A commits before this report:

- `8cbb6ae docs(f1a): record design decisions and rules`
- `d0a3d88 chore(tooling): enforce F1A validation and security rules`
- `0e4006b refactor(ui): split gallery examples and tests`
- `94b76be feat(portal): expand the development UI gallery`
- `5808396 feat(ui): add F1A shared design system`

Earlier history: `aab5296 docs(f0): add foundation verification report`, `7832185 feat(f0): establish frontend foundation`, `4d00558 chore: initialize repository`. The complete final `git log --oneline` is included in the chat summary.

## 13. What I should review first

1. Inspect the four gallery screenshots and the 17.6% portal entry-size increase.
2. Re-run `pnpm test:e2e` where the runner can exit normally.
3. Re-run `pnpm audit:prod` and `pnpm audit:full` with registry access.
4. Review `docs/security-exceptions.md`, then the F1A component and tooling changes.
