# Noldg Academy Frontend Foundation

Arabic-first tutoring platform frontend for the Egypt market. F0 provides the monorepo and API foundation; F1A provides the shared design system; F2 adds authentication screens and session handling; F3 adds the shared application shell and first administrative modules for academic structure and teacher applications. Student and teacher homes remain placeholders for later modules.

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

The UI gallery is available only in development at `/__ui` and is excluded from production builds. Production builds require public `VITE_API_ORIGIN` and comma-separated HTTPS `VITE_UPLOAD_ORIGINS` to generate static hosting security headers; `.env.example` shows the public configuration format. `pnpm test:e2e` exercises auth, administration, teacher course/lesson/upload/bundle flows, and the gallery. Mock mode supports the target contracts. Live catalog behavior is limited by the current backend: course/lesson lists are unpaginated, drafts and processing-state reports are absent, live lessons are rejected, advanced window rules are not enforced, and package lesson membership is not stored. The UI adapts supported routes and shows capability limits. See [the auth target contract](docs/api-target-auth.md), [the admin target contract](docs/api-target-admin.md), [the catalog target contract](docs/api-target-catalog.md), and [the verified backend differences](docs/contract-differences.md).
