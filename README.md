# Noldg Academy Frontend Foundation

Arabic-first tutoring platform frontend foundation for the Egypt market. F0 provides the monorepo, API foundation and portal shell; F1A adds the shared design system and component gallery. Product pages are out of scope.

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
pnpm check:no-dev-routes
pnpm knip
pnpm dependency-cruiser
pnpm audit:prod
pnpm audit:full
```

The UI gallery is available only in development at `/__ui` and is excluded from production builds. Production builds require `VITE_API_ORIGIN` to generate the static hosting security headers; `.env.example` shows the public configuration format. Run `pnpm test:e2e` with the installed Playwright browser to exercise the portal and gallery at mobile and desktop widths in Arabic and English.
