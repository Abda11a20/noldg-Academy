# Noldg Academy Frontend Foundation

Arabic-first tutoring platform frontend for the Egypt market. F0 provides the monorepo and API foundation; F1A provides the shared design system; F2 adds authentication screens and session handling; F3 adds the shared application shell and administrative academic and teacher-application modules; F4 adds teacher courses, lessons, uploads, and bundles; F5 adds student teacher discovery and target lesson/product previews; F6 adds student order and purchase screens plus the admin order queue.

## Requirements

- Node.js 24 LTS (`.nvmrc`)
- pnpm 11.28.11 via Corepack

## Install

```sh
corepack pnpm@11.28.11 install --frozen-lockfile
```

If pnpm cannot hard-link from its global store on Windows, `.npmrc` directs it to `.pnpm-store` inside this repository so links remain on the same volume.

The workspace uses a seven-day release age, strict peer dependencies, exact catalog pins, no-downgrade trust policy, and an explicit install-script allowlist. Do not install or run anything in `referencebackend/`; it is read-only reference material and excluded from tooling.

## Run

Mock mode is the default for the local portal:

```sh
pnpm dev
```

The portal uses `VITE_API_MODE=mock` by default during local development. To run against an API, set `VITE_API_MODE=live` and the public `VITE_API_BASE_URL` (and configure the hosting CSP API origin). `.env.example` documents public variables; never put secrets in Vite environment variables.

## Checks

```sh
pnpm lint
pnpm lint:rules
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:headers
pnpm check:bundle-size
pnpm check:no-dev-routes
pnpm knip
pnpm dependency-cruiser
pnpm audit:prod
pnpm audit:full
```

The UI gallery is available only in development at `/__ui` and is excluded from production builds. Production builds require public `VITE_API_ORIGIN`, comma-separated HTTPS `VITE_UPLOAD_ORIGINS`, and `VITE_IMAGE_ORIGINS` to generate static hosting security headers; `.env.example` shows the public configuration format. `pnpm test:e2e` exercises auth, administration, teacher catalog, student browse, and the gallery. Mock mode supports the target contracts. Live browse currently has only public teacher list/profile routes and single-product pricing; it does not provide student track filtering/profile track, rating and starting-price summaries, lesson availability timestamps, or course previews. These capabilities remain disabled with explanatory UI. See [the auth target contract](docs/api-target-auth.md), [the admin target contract](docs/api-target-admin.md), [the catalog target contract](docs/api-target-catalog.md), [the student browse target contract](docs/api-target-browse.md), and [the verified backend differences](docs/contract-differences.md).

F6 mock mode supports target order workflows. Live mode adapts the current backend's separate order creation and payment submission calls; expiry, cancellation, target idempotency, rich queue filters, and searchable student/product lookup remain unavailable. The one-time bundle analyzer is enabled with `ANALYZE=true`; its HTML output is ignored. See [the target orders contract](docs/api-target-orders.md).

F7 adds target student learning routes and file playback behind a normalized playback-source contract. Live mode supports the existing playback and progress routes, but the current backend has no target student lesson list/detail or dedicated attachment-download endpoint. Those screens show explanatory states. Current playback returns a time-limited direct downloadable file URL; HLS remains reserved until a streaming provider is selected. See [the target learning contract](docs/api-target-learning.md), [ADR-017](docs/decisions/ADR-017-playback-source.md), [ADR-018](docs/decisions/ADR-018-playback-heartbeats.md), and [verified backend differences](docs/contract-differences.md).

F8A currently includes target MCQ authoring in `/teacher/questions`, a mock-mode draft builder for exams and homework, and mock-mode teacher results with frozen attempt details. Lifecycle editing, lesson quiz integration, broader scenario coverage, and F8A end-to-end journeys remain incomplete. Live backend differences and capability limits are recorded in [the target assessments contract](docs/api-target-assessments.md) and [verified backend differences](docs/contract-differences.md). See [the F8A report](docs/reports/f8a-report.md) for exact verification.
