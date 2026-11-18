# Noldg Academy Frontend Context

## Decisions

- F0 builds the frontend foundation only. No product pages are in scope.
- `referencebackend/` is read-only contract reference material. It is excluded from source tooling and Git; all backend observations belong in `docs/contract-differences.md`.
- F0 is merged into `main` at `aab5296`. F1A work is on `feat/f1a-design-system`, created from that main commit. Do not merge or push this branch.
- Node 24 and pnpm 11 are required. The current toolchain uses ESLint 9.39.5 because required plugins do not yet declare ESLint 10 support; see ADR-006. Revisit after every configured plugin includes ESLint 10 in its peer range.
- `Noldg Academy` is the provisional name in both languages, marked for owner confirmation in the brand config.
- F1A uses `lucide-react` in the sole icon registry and Radix primitives for Select, Checkbox, RadioGroup, and Switch. See ADR-007 and ADR-008. ESLint remains on 9.x per ADR-006; Renovate should revisit ESLint 10 when every configured plugin declares support.
- F1A added shared layout, typography, form, feedback, and data-display components in `packages/ui`; the development-only `/__ui` gallery covers Arabic/English and RTL/LTR. No product pages are in scope.
- API contracts are target contracts; adapters are the only place to translate verified backend differences.
- Access-token memory storage with a refresh cookie is the target. A sessionStorage fallback is temporary and enabled only by explicit configuration while the backend lacks refresh.

## Module status

- Monorepo, dependency catalog, security policy, CI, and developer hooks: implemented in F0; F1A updates audit policy and dev-route/CSP checks.
- UI tokens, brand assets, and F1A shared components: implemented and covered by 14 passing UI tests. Current `packages/ui` coverage is 100% across statements, branches, functions, and lines.
- API client, token stores, normalized errors, common contracts, and MSW setup: implemented; eight HTTP tests pass.
- Portal shell, Arabic/English direction switching, guards, layouts, error handling, and dev-only UI gallery: implemented. Four Playwright scenarios reported `ok` and produced screenshots at 375px and 1280px in both languages; the runner did not exit after the final scenario and had to be interrupted, so e2e is not recorded as a clean command pass.
- ESLint architecture rules and F1A fixture proofs: implemented; `pnpm lint:rules` passes 17/17 fixtures.
- CI, security baseline, ADRs, contract differences, and F0 verification report: implemented. F1A lint, typecheck, unit/component tests, build, no-dev-route check, headers tests, knip, and dependency-cruiser pass. Both audit commands fail to reach npm's security endpoint (`EACCES`); see the F1A report.

## How to run

- Install: `corepack pnpm@11.28.11 install --frozen-lockfile`
- Mock mode: `VITE_API_MODE=mock pnpm dev` (PowerShell: `$env:VITE_API_MODE='mock'; pnpm dev`).
- Live mode: set public `VITE_API_BASE_URL` and `VITE_API_MODE=live`, then run `pnpm dev`.
- Checks: `pnpm lint`, `pnpm lint:rules`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.
- F1A checks: `pnpm test:headers`, `pnpm check:no-dev-routes`, `pnpm knip`, `pnpm dependency-cruiser`, `pnpm audit:prod`, and `pnpm audit:full`. Production build needs `VITE_API_ORIGIN`.
- Browser install for E2E: `pnpm --filter @noldg/portal exec playwright install chromium`.

## Open questions

- Owner confirmation of the provisional brand name and logo.
- Backend refresh endpoint and refresh-cookie contract are not available yet; current differences are recorded in `docs/contract-differences.md`.
- The portal entry bundle grew about 17.6% versus F0, above the 15% target; total emitted JavaScript grew about 4.7%. This remains open for review in the F1A report.
- Audit status cannot be determined while npm's advisory endpoint is unreachable. The recorded moderate development-only `minimatch@10.2.6` advisory remains in `docs/security-exceptions.md`.
- The owner installed dependencies manually and authorized validation without touching `node_modules`; no install, deletion, or install-method change was performed in this continuation. The npm audit service is unreachable from this environment. Playwright produced all four required F1A screenshots and reported all four scenarios as passed, but did not exit cleanly after the final scenario.
