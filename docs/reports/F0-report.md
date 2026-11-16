# F0 Foundation Report

## 1. Summary

Completed the frontend-only F0 foundation on `feat/f0-foundation`. The work includes the pnpm
monorepo and policy tooling, shared tokens and UI components, API client/auth/mock foundations,
Arabic-first portal shell, lint-rule fixtures, CI/security workflows, ADRs, and backend contract
notes. No product pages were added. `referencebackend/` remained read-only and is ignored or
excluded by every requested workspace and source-analysis tool.

The installed graph passed strict peer resolution with zero peer-dependency warnings. Lint,
type-check, unit/component tests, build, Knip, dependency-cruiser, formatting, lint-rule proofs,
and all three Playwright smoke assertions passed. `pnpm audit` reports one moderate transitive
`minimatch` advisory; no override was added because the architecture decision prohibits hiding
peer or dependency problems with overrides. The Playwright command passed all three tests and
exited normally after running against a separately started local Vite server.

The temporary sessionStorage access-token fallback is only selected by
`VITE_AUTH_STORAGE=session`; memory storage with refresh-cookie flow remains the target. The current
backend has no refresh endpoint. The backend evidence and target differences are documented in
`docs/contract-differences.md`; frontend code does not import from the backend folder.

## 2. Files created or changed

- Root setup: `.gitignore`, `.npmrc`, `.nvmrc`, `package.json`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`, `turbo.json`, `.env.example`, `README.md`, and `CONTEXT.md`.
- Quality and supply-chain config: `eslint.config.js`, `packages/config/`, `.prettierrc.cjs`,
  `.prettierignore`, `commitlint.config.js`, `.husky/`, `knip.json`, `.dependency-cruiser.cjs`,
  `renovate.json`, and `tools/eslint-rules/`.
- Portal shell: `apps/portal/` with providers, lazy router, role/auth guards, four empty layouts,
  route error and not-found pages, Arabic/English i18n, formatting helpers, development-only
  `/__ui` gallery, Playwright smoke test, and `public/_headers`.
- UI package: `packages/ui/` with palette, semantic and scale tokens; brand config and SVG
  wordmark; image/icon registries; and exactly the requested Button, Icon, Image, Logo,
  VisuallyHidden, and Spinner components.
- API package: `packages/api/` with the fetch client, normalized errors, token stores, auth header
  strategy, common Zod contracts, MSW browser/node setup, empty domain endpoints and handler
  folders, adapter pattern README, fixtures README, and API/UI tests.
- Documentation: `docs/rules/FRONTEND-RULES.md`, six ADRs, `docs/contract-differences.md`,
  `docs/security.md`, and this report.
- CI/security: `.github/workflows/ci.yml`, `codeql.yml`, and `security.yml`; pinned GitHub Actions.
- Visual evidence: `docs/reports/F0-gallery.png` and the palette-only comparison pair
  `F0-gallery-before.png` / `F0-gallery-after.png`.
- Rule proof: `tools/lint-fixtures/` contains 14 negative fixtures and the `pnpm lint:rules`
  verifier.

Nothing was created outside F0 scope. There is no `apps/web` or product feature page.

## 3. Versions table

Runtime and package manager:

| Component            |   Exact version | Reason for a non-latest selection                                                                                                                                                   |
| -------------------- | --------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js              |         24.22.3 | Required Node 24 LTS; `.nvmrc` is `24`.                                                                                                                                             |
| pnpm                 |        11.28.11 | Exact `packageManager` pin and lockfile producer.                                                                                                                                   |
| React / React DOM    | 19.3.1 / 19.3.1 | Highest compatible stable catalog versions.                                                                                                                                         |
| React Router         |           8.5.1 | Library/data-router mode, with lazy routes and loader redirects.                                                                                                                    |
| TanStack Query       |         5.107.1 | Requested server-state provider.                                                                                                                                                    |
| TypeScript           |           6.0.3 | TypeScript 7.0.2 is registry latest, but typescript-eslint 8.72.2 declares support below 6.1; Vite/Vitest and the full TS API toolchain must also support a version before upgrade. |
| Vite / React plugin  |   8.3.7 / 6.3.0 | Compatible stable pair.                                                                                                                                                             |
| Vitest / coverage-v8 |   5.1.0 / 5.1.0 | Same-version test and coverage pair.                                                                                                                                                |

All external direct dependencies are exact catalog pins. Rows below give every direct package and
its resolved version; `workspace:*` packages are local workspace references.

| Area                                      | Package versions                                                                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| i18n, validation, API, fonts, UI variants | `i18next@27.0.1`, `react-i18next@18.0.1`, `zod@4.6.7`, `msw@3.0.4`, `@fontsource/ibm-plex-sans-arabic@5.3.0`, `class-variance-authority@0.7.1`                                                                                                          |
| Styling and build                         | `tailwindcss@4.3.5`, `@tailwindcss/vite@4.3.5`, `@vitejs/plugin-react@6.3.0`, `vite@8.3.7`, `turbo@2.11.10`                                                                                                                                             |
| React and test types                      | `@types/react@19.3.0`, `@types/react-dom@19.3.0`, `@types/node@24.19.2`                                                                                                                                                                                 |
| ESLint core and plugins                   | `eslint@9.39.5`, `@eslint/js@9.39.5`, `typescript-eslint@8.72.2`, `@boundaries/eslint-plugin@7.4.2`, `eslint-plugin-import@2.32.0`, `eslint-plugin-jsx-a11y@6.10.2`, `eslint-plugin-react@7.37.5`, `eslint-plugin-react-hooks@7.1.1`, `globals@17.14.0` |
| Component, browser, and API tests         | `@playwright/test@1.65.0`, `@testing-library/dom@10.4.1`, `@testing-library/react@16.3.3`, `@testing-library/user-event@14.6.8`, `@testing-library/jest-dom@7.0.1`, `jest-axe@11.0.0`, `jsdom@31.0.0`                                                   |
| Repository quality and commits            | `prettier@3.9.10`, `husky@9.1.7`, `lint-staged@17.6.0`, `@commitlint/cli@21.2.4`, `@commitlint/config-conventional@21.2.4`, `knip@6.44.2`, `dependency-cruiser@18.7.2`                                                                                  |

The compatibility check (`pnpm outdated --recursive` plus the strict frozen install) identified
these newer registry tags, which were not adopted:

| Package                | Selected | Newer registry tag | Reason                                                                                                                     |
| ---------------------- | -------: | -----------------: | -------------------------------------------------------------------------------------------------------------------------- |
| ESLint                 |   9.39.5 |            10.14.0 | Architect decision and plugin peers: React, jsx-a11y, and import plugins have not declared ESLint 10 support. See ADR-006. |
| `@eslint/js`           |   9.39.5 |             10.0.1 | Kept aligned to required ESLint 9.                                                                                         |
| TypeScript             |    6.0.3 |              7.0.2 | TypeScript API peer support is not declared across the full toolchain.                                                     |
| `@types/node`          |  24.19.2 |             26.6.6 | Keep ambient Node types aligned to runtime Node 24.                                                                        |
| `@testing-library/dom` |   10.4.1 |             10.4.2 | Newer release was inside the configured seven-day release-age window at resolution.                                        |
| `i18next`              |   27.0.1 |             27.1.0 | Newer release was inside the configured seven-day release-age window at resolution.                                        |

The versions table records the actual registry comparison at resolution; `minimumReleaseAge` is
10,080 minutes. The install also applies `trustPolicy: no-downgrade`, strict peer dependencies,
exact pins, and the explicit `esbuild` install-script allowlist.

Pinned GitHub Actions:

| Action release                 | Pinned commit SHA                          |
| ------------------------------ | ------------------------------------------ |
| `actions/checkout@v7.0.1`      | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node@v7.1.0`    | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| `pnpm/setup@v3.2.0`            | `731dfb6463bbd11c11fd0ee11fe00ed0e36d48a1` |
| `github/codeql-action@v4.39.3` | `33d7b85da1a04171e211befe2c739303b9a4c066` |
| `gitleaks/gitleaks-action@v3`  | `e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e` |

### Dependency justification and maintenance

| Dependencies                                                             | What they do and why included                                                                                                                                                                                                                                                                                              | Maintenance status                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| React, React DOM, React Router                                           | Requested SPA runtime, rendering, and library-mode router; required for the portal shell.                                                                                                                                                                                                                                  | Actively maintained upstream.                                          |
| TanStack Query                                                           | Requested query provider and server-state foundation; no equivalent included in React.                                                                                                                                                                                                                                     | Actively maintained upstream.                                          |
| i18next, react-i18next                                                   | Requested Arabic/English resources, typed translation keys, language and direction switching.                                                                                                                                                                                                                              | Actively maintained upstream.                                          |
| Zod                                                                      | Requested runtime validation for JSON responses and shared contracts.                                                                                                                                                                                                                                                      | Actively maintained upstream.                                          |
| MSW                                                                      | Requested browser and Node mock layer and HTTP tests.                                                                                                                                                                                                                                                                      | Actively maintained upstream.                                          |
| Fontsource IBM Plex Sans Arabic                                          | Required self-hosted Arabic and Latin font package; local build emits both Latin and Arabic subsets. Fontsource lists OFL-1.1 and its package workflow; see [Fontsource font details](https://fontsource.org/fonts/ibm-plex-sans-arabic/about) and [package usage](https://fontsource.org/fonts/ibm-plex-sans-arabic/use). | Actively maintained by Fontsource; OFL-1.1 verified.                   |
| class-variance-authority                                                 | Requested typed Button variants without building a custom variant abstraction.                                                                                                                                                                                                                                             | Maintained upstream.                                                   |
| Tailwind CSS and `@tailwindcss/vite`                                     | Requested semantic-token utility styling and Vite integration; `--color-*: initial` removes the default palette per [current Tailwind color docs](https://tailwindcss.com/docs/colors).                                                                                                                                    | Actively maintained upstream.                                          |
| Vite and `@vitejs/plugin-react`                                          | Requested frontend dev server/build and React transform.                                                                                                                                                                                                                                                                   | Actively maintained upstream.                                          |
| TypeScript and `@types/*`                                                | Requested strict TypeScript and React/Node declarations.                                                                                                                                                                                                                                                                   | Actively maintained upstream; versions match runtime peer constraints. |
| Vitest, coverage-v8, jsdom, Testing Library packages, jest-axe           | Required unit/component testing, DOM rendering, user interactions, coverage, and axe assertions.                                                                                                                                                                                                                           | Actively maintained upstream.                                          |
| Playwright                                                               | Required real-browser smoke tests; Chromium is installed explicitly in CI.                                                                                                                                                                                                                                                 | Actively maintained upstream.                                          |
| ESLint, TypeScript ESLint, React/a11y/import/boundaries plugins, globals | Explicitly required flat-config lint rules and custom architecture-rule integration. `@boundaries/eslint-plugin` is the maintained scoped package used for boundaries.                                                                                                                                                     | Maintained upstream; ESLint 9 is held by ADR-006.                      |
| Prettier, Husky, lint-staged, Commitlint                                 | Requested formatting, staged-file formatting, Git hooks, and Conventional Commit enforcement.                                                                                                                                                                                                                              | Actively maintained upstream.                                          |
| Knip, dependency-cruiser, Turborepo                                      | Requested dead-code/dependency checks and task orchestration.                                                                                                                                                                                                                                                              | Actively maintained upstream.                                          |
| `@commitlint/cli` and `@commitlint/config-conventional`                  | Enforce the specified Conventional Commit message pattern.                                                                                                                                                                                                                                                                 | Actively maintained upstream.                                          |

No icon, HTTP client, or Radix dependency was added: registry icons are small local SVG paths,
`fetch` is built in, and this foundation has no overlay primitive requiring Radix. This avoids
dependencies for capabilities already covered by the requested stack.

## 4. Commands run with results

| Command/check                                                   | Result                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node -v`                                                       | PASS — `v24.22.3`.                                                                                                                                                                                                                                                   |
| Frozen pnpm install with `.pnpm-modules` and copy import method | PASS — 552 packages; strict peer resolution produced zero peer warnings. The Windows workspace could not hard-link from the shared store, so the install used the local copy-based modules directory. Registry retries occurred but the frozen graph completed.      |
| `pnpm lint`                                                     | PASS — ESLint completed with zero warnings/errors.                                                                                                                                                                                                                   |
| `pnpm lint:rules`                                               | PASS — all 14/14 negative fixtures triggered their expected rules.                                                                                                                                                                                                   |
| `pnpm typecheck`                                                | PASS — API, UI, and portal TypeScript projects.                                                                                                                                                                                                                      |
| `pnpm test`                                                     | PASS — 14 tests: API 8/8, UI 6/6. Portal has no unit test files; browser coverage is in Playwright.                                                                                                                                                                  |
| `pnpm test:e2e`                                                 | PASS — 3/3 browser smoke tests: portal/auth redirect, locale+direction, and gallery in RTL/LTR. Vite was launched on a dedicated local test port; the Playwright process exited normally.                                                                            |
| `pnpm build`                                                    | PASS — Vite production build, 199 modules transformed.                                                                                                                                                                                                               |
| `pnpm knip`                                                     | PASS — no unused files, exports, or dependencies reported. Knip scans only `apps/portal` and `packages/*`, so `referencebackend/` is outside its workspace set.                                                                                                      |
| `pnpm dependency-cruiser`                                       | PASS — no dependency violations (102 modules, 126 dependencies).                                                                                                                                                                                                     |
| `pnpm format:check`                                             | PASS — Prettier reports all matched files formatted.                                                                                                                                                                                                                 |
| Tailwind proof                                                  | PASS — a source probe using `bg-red-500` did not produce that utility; production CSS also contains no `.bg-red-500`.                                                                                                                                                |
| `pnpm audit`                                                    | FAIL — one moderate advisory in `minimatch@10.2.6`, through TypeScript ESLint/import tooling. Patched advisory version is `>=11.0.1`; current upstream peer graph does not allow replacing it without an override, which is prohibited. Full risk is recorded below. |
| Local secret scan                                               | PASS — credential-pattern scan returned no matches. `gitleaks` binary was unavailable locally; the pinned gitleaks workflow is configured for CI.                                                                                                                    |
| `git diff --cached --check`                                     | PASS — no whitespace errors.                                                                                                                                                                                                                                         |
| GitHub CI, CodeQL, and hosted gitleaks workflows                | NOT RUN — no remote workflow runner was available in this workspace.                                                                                                                                                                                                 |

The install used `corepack pnpm@11.28.11 install --frozen-lockfile --modules-dir .pnpm-modules --package-import-method copy` because the Windows shared package store could not hard-link into this workspace. Root scripts were run with local dependency verification disabled only to accommodate this local copy-based module directory; CI uses the documented normal frozen install.

## 5. Test results and coverage

| Package                  | Test count | Statements | Branches | Functions |  Lines |
| ------------------------ | ---------: | ---------: | -------: | --------: | -----: |
| `packages/api`           |   8 passed |     87.61% |   81.81% |    84.00% | 88.23% |
| `packages/ui`            |   6 passed |       100% |   93.93% |      100% |   100% |
| `apps/portal` unit       |          0 |          — |        — |         — |      — |
| Playwright browser smoke |   3 passed |          — |        — |         — |      — |

HTTP cases cover validated success, schema failure, network failure, timeout, successful refresh,
failed refresh/logout, concurrent single-flight refresh, and abort. Button tests cover variants,
sizes, loading/disabled behavior, and axe. Icon tests cover accessible labels, RTL direction flip,
and axe.

Chromium screenshots are saved in `docs/reports/`. I visually inspected the Arabic-first gallery
and the before/after palette images. The palette comparison changes `palette.css` only; it changes
the primary/accent colors throughout both-direction galleries. IBM Plex Sans Arabic emitted
self-hosted Latin, Latin Extended, and Arabic WOFF/WOFF2 files in the production build.

## 6. Lint-rule proofs

`pnpm lint:rules` uses ESLint’s API to require the expected rule ID for each fixture. The 14
fixtures cover: icon-library imports, native UI elements, JSX `style`, literal colors, network APIs
outside API HTTP, browser storage outside token auth, dangerous HTML/eval, literal JSX user text,
feature private imports, `no-console`, explicit `any`, max file lines, max function lines, and
complexity. Result: **14/14 expected errors observed**.

The rules run across `apps/**` and `packages/**`; config and generated files are scoped or ignored.
They also enforce zero console calls, no explicit `any`, max 300 lines per file, max 150 lines per
function, and complexity 10. The verified Tailwind palette reset follows the current
[Tailwind CSS color namespace guidance](https://tailwindcss.com/docs/colors).

## 7. Bundle sizes

Production output from the final Vite build:

| Asset                                             |       Raw |                      Gzip |
| ------------------------------------------------- | --------: | ------------------------: |
| HTML entry                                        |   0.56 kB |                   0.32 kB |
| CSS                                               |  22.37 kB |                   7.84 kB |
| Initial JavaScript entry                          | 344.06 kB |                 108.92 kB |
| Lazy i18n chunk                                   |  61.02 kB |                  20.11 kB |
| Other lazy/runtime JavaScript combined            |   3.89 kB |                   2.57 kB |
| Total JavaScript chunks                           | 408.97 kB |                 131.60 kB |
| Fonts (Arabic, Latin, Latin Extended; WOFF/WOFF2) | 135.39 kB | not gzip-reported by Vite |

No build output or `node_modules` is tracked.

## 8. Deviations from this spec and why

- `pnpm audit` is not green because of the moderate transitive `minimatch` advisory. It was not
  hidden with an override, since the architect explicitly forbids overrides.
- The development UI gallery is the only UI page; all other portal layouts are empty shells, as
  required for F0. No product features/pages were created.
- The browser suite was run locally with Vite started separately on its isolated test port so the
  Windows process tree would not leave a server child attached to the test command. All 3/3 tests
  passed and the command exited with status 0.
- No Radix primitive or icon library was added because no dialog/menu primitive was requested and
  the fixed icon set is implemented as local SVG path data.
- The local install used copy-based package imports because the shared Windows package store could
  not hard-link to the workspace. CI uses normal `pnpm install --frozen-lockfile`.

## 9. Assumptions

- This deliverable is frontend-only. `referencebackend/` provides read-only route, request, and
  response evidence; backend code is not part of the frontend build or imports.
- `Noldg Academy` is provisional in both locales; `brand.ts` includes the requested owner TODO.
- The memory token store with a refresh cookie is the target design. The current header strategy
  defaults to the verified legacy `token` header until the backend contract changes.
- EGP values accept integer amounts or decimal strings until domain contracts define their final
  representation. No domain endpoints or feature schemas were inferred.
- `https://API_ORIGIN` in the static hosting CSP is a documented placeholder to replace with the
  deployment’s exact API origin.

## 10. Questions

- Can the owner confirm the platform name and placeholder logo before F1 branding is finalized?
- What refresh endpoint/cookie contract will replace the temporary sessionStorage fallback?
- Which production API origin should replace `https://API_ORIGIN` in the hosting headers?
- Should domain money contracts normalize mixed backend integer/Decimal values to one wire format?

## 11. Risks and technical debt

- **Moderate supply-chain advisory:** `minimatch@10.2.6` is transitive in the ESLint/import parser
  graph; `pnpm audit` fails. Resolve when compatible upstream releases remove the affected range.
  Do not use an override to hide it.
- **Temporary auth storage:** sessionStorage can be enabled only by `VITE_AUTH_STORAGE=session`;
  it is technical debt until the backend supports the refresh-cookie target.
- **CSP deployment step:** static hosting cannot interpolate Vite variables in `_headers`; replace
  the documented API origin placeholder during hosting configuration.
- **ESLint major hold:** ESLint 9.39.5 is required by ADR-006 until every configured plugin
  declares ESLint 10 support. pnpm reported the ESLint 9 package as deprecated; revisit weekly.
- **CI not executed remotely:** workflow definitions and SHA pins were reviewed locally but no
  GitHub Actions run was available.
- The browser shell uses React Router lazy routes; Playwright shows only expected initial lazy-route
  hydration fallback warnings during local startup. Functional smoke assertions passed.

## 12. Commits

| Hash      | Message                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| `4d00558` | `chore: initialize repository` — only `.gitignore`, `README.md`, `.npmrc`, `.nvmrc` on `main`.                 |
| `7832185` | `feat(f0): establish frontend foundation` — F0 source, tooling, CI, and docs baseline on `feat/f0-foundation`. |

This verification report is committed separately as a docs-only follow-up so it can record the
foundation commit hash. The report commit’s own hash is included in the delivery message because a
commit cannot embed its own hash in its tree.

## 13. What I should review first

1. `docs/contract-differences.md` for the backend evidence and target-contract gaps.
2. `packages/ui/src/tokens/palette.css` and `packages/ui/src/brand/brand.ts` for owner-facing brand
   choices; compare the gallery screenshots in this report folder.
3. `packages/api/src/auth/token-store.ts` and ADR-004 for the temporary storage boundary.
4. `.github/workflows/ci.yml` and the `pnpm audit` advisory before relying on CI as a green gate.
5. The `apps/portal` router/layout/guard shell before the next frontend step.

The complete F0 implementation commit is `7832185`; no merge or push was performed.
