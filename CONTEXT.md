# Noldg Academy Frontend Context

## Decisions

- F0 builds the frontend foundation only. No product pages are in scope.
- `referencebackend/` is read-only contract reference material. It is excluded from source tooling and Git; all backend observations belong in `docs/contract-differences.md`.
- Work is on `feat/f0-foundation`, based on the one-file-set bootstrap commit on `main` (`chore: initialize repository`).
- Node 24 and pnpm 11 are required. The current toolchain uses ESLint 9.39.5 because required plugins do not yet declare ESLint 10 support; see ADR-006. Revisit after every configured plugin includes ESLint 10 in its peer range.
- `Noldg Academy` is the provisional name in both languages, marked for owner confirmation in the brand config.
- API contracts are target contracts; adapters are the only place to translate verified backend differences.
- Access-token memory storage with a refresh cookie is the target. A sessionStorage fallback is temporary and enabled only by explicit configuration while the backend lacks refresh.

## Module status

- Monorepo, dependency catalog, security policy, CI, and developer hooks: implemented and checked.
- UI tokens, brand assets, and the six required shared components: implemented; component tests pass.
- API client, token stores, normalized errors, common contracts, and MSW setup: implemented; eight HTTP tests pass.
- Portal shell, Arabic/English direction switching, guards, layouts, error handling, and dev-only UI gallery: implemented; browser smoke assertions pass.
- ESLint architecture rules: implemented; 14/14 violation fixtures prove the configured errors.
- CI, security baseline, ADRs, contract differences, and the F0 verification report: implemented.

## How to run

- Install: `corepack pnpm@11.28.11 install --frozen-lockfile`
- Mock mode: `VITE_API_MODE=mock pnpm dev` (PowerShell: `$env:VITE_API_MODE='mock'; pnpm dev`).
- Live mode: set public `VITE_API_BASE_URL` and `VITE_API_MODE=live`, then run `pnpm dev`.
- Checks: `pnpm lint`, `pnpm lint:rules`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.
- Browser install for E2E: `pnpm --filter @noldg/portal exec playwright install chromium`.

## Open questions

- Owner confirmation of the provisional brand name and logo.
- Backend refresh endpoint and refresh-cookie contract are not available yet; current differences are recorded in `docs/contract-differences.md`.
- The ESLint/import toolchain currently resolves vulnerable `minimatch@10.2.6`; upstream must publish compatible ranges before the audit can pass without a prohibited override. Details are in `docs/reports/F0-report.md`.
