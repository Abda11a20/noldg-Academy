# Noldg Academy Frontend Foundation

Arabic-first tutoring platform frontend foundation for the Egypt market. This F0 step contains the monorepo, design tokens and shared UI components, API foundation and mocks, and the portal shell. Product pages are out of scope.

## Requirements

- Node.js 24 LTS (`.nvmrc`)
- pnpm 11.28.11 via Corepack

## Install

```sh
corepack pnpm@11.28.11 install --frozen-lockfile
```

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
```

The UI gallery is available only in development at `/__ui`. Run `pnpm test:e2e` with the installed Playwright browser to exercise the portal smoke flow.
