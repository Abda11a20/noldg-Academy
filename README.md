# Noldg Academy Frontend Foundation

Arabic-first tutoring platform frontend for the Egypt market. F0 provides the monorepo and API foundation; F1A provides the shared design system; F2 adds authentication screens and session handling; F3 adds the shared application shell and administrative academic and teacher-application modules; F4 adds teacher courses, lessons, uploads, and bundles; F5 adds student teacher discovery and target lesson/product previews.

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
