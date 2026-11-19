# Noldg Academy Frontend Context

## Decisions

- F0 builds the frontend foundation only; no product pages are in scope.
- referencebackend/ is read-only backend reference material. It is excluded from source tooling and Git; backend observations belong in docs/contract-differences.md.
- F0 is merged into main at aab5296. F1A work is on feat/f1a-design-system, based on that main commit. Do not merge or push this branch.
- Node 24 and pnpm 11 are required. ESLint 9.39.5 is retained because configured plugins do not declare ESLint 10 support; see ADR-006. Revisit when every configured plugin supports ESLint 10.
- Noldg Academy is a provisional brand name in both languages, marked for owner confirmation.
- F1A uses lucide-react in the sole icon registry and Radix primitives for Select, Checkbox, RadioGroup, and Switch. See ADR-007 and ADR-008.
- UI components live in packages/ui; API calls and auth token storage live in packages/api.
- F1A-FIX uses absolute portal JS gzip budgets: entry <=150 kB and initial-route total <=250 kB.
- E2E uses a Node script to build a test-only gallery and mock-worker bundle, launch Vite preview on port 4174, run Playwright, fail on browser console/page errors, and terminate the preview. The standard production build does not include the gallery or mock worker.
- API access-token memory storage with refresh-cookie flow is the target. sessionStorage fallback is temporary while the backend lacks a refresh endpoint.

## Module status

- Monorepo, dependency catalog, security policy, CI, and developer hooks: implemented in F0; F1A adds design-system dependencies and F1A-FIX adds the bundle gate.
- UI tokens, brand assets, and shared components: implemented. Latest coverage is 100% statements, branches, functions, and lines across packages/ui; 14 UI tests pass.
- API client, token stores, normalized errors, common contracts, and MSW setup: implemented; 8 tests pass.
- Portal shell, Arabic/English direction switching, guards, layouts, error handling, and dev-only UI gallery: implemented. E2E passed twice with MSW strict mode active (4/4 each; exit code 0); screenshots are under docs/reports/.
- ESLint architecture rules and fixture proofs: 17/17 pass.
- Latest lint, typecheck, unit/component tests, build, bundle budget, no-dev-route check, header tests, knip, and dependency-cruiser passed.
- F1A-FIX left audit scripts unchanged and did not run audit commands; owner runs them outside sandbox. Current recorded moderate development-only minimatch advisory remains in docs/security-exceptions.md.

## How to run

- Install (when authorized): corepack pnpm@11.28.11 install --frozen-lockfile
- Mock mode: VITE_API_MODE=mock pnpm dev (PowerShell: $env:VITE_API_MODE='mock'; pnpm dev).
- Live mode: set public VITE_API_BASE_URL and VITE_API_MODE=live, then run pnpm dev.
- Standard checks: pnpm lint, pnpm lint:rules, pnpm typecheck, pnpm test, pnpm build, pnpm check:bundle-size, pnpm check:no-dev-routes, pnpm test:headers, pnpm test:e2e.
- Additional checks: pnpm knip, pnpm dependency-cruiser, pnpm audit:prod, pnpm audit:full. Production build requires VITE_API_ORIGIN.
- Browser installation for E2E: pnpm --filter @noldg/portal exec playwright install chromium.

## Open questions

- Owner confirmation of the provisional brand name and logo.
- Backend refresh endpoint and refresh-cookie contract are not available yet; differences are in docs/contract-differences.md.
- Run pnpm audit:prod and pnpm audit:full outside sandbox; these were not run during F1A-FIX.
- Third-party visualizer is not installed. F1A-FIX inspected the Vite manifest/chunk graph instead; consider a visualizer only if approved in a future step.
