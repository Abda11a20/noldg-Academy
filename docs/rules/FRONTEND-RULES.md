# Frontend rules (Common Rules v2)

This foundation is the frontend only for an Arabic-first tutoring platform for Egypt, with English support. The `referencebackend/` directory is read-only contract evidence: never edit, move, run, install, build, or lint it. Keep it excluded from Git, pnpm, TypeScript, ESLint, Prettier, knip, dependency-cruiser, Turbo, and test runners. Record backend observations in `docs/contract-differences.md`; frontend source must never import it.

## Scope and structure

- Do not add unrequested features, pages, dependencies, or abstractions. Record ambiguity under Questions and choose the simplest safe option while continuing.
- Shared UI elements live only in `packages/ui`; pages/features import those components. A page or feature cannot define a button, input, card, dialog, table, badge, or similar control. UI components receive all labels, aria labels, and messages through props and own no user-facing text.
- Icon library imports are limited to the single registry under `packages/ui/src/icons/`. Directional icons flip in RTL through the registry helper.
- Image and logo files live under `packages/ui/src/assets/`, are registered in one `images.ts`, and render only through `Image` and `Logo`.
- Brand identity changes must be possible by editing only the specified brand files. Primitive colors and font families are in `tokens/palette.css`; semantic colors are in `tokens/semantic.css`; spacing, radii, shadows, type scale, z-index, and motion are in `tokens/scale.css`.
- Components use semantic tokens. No raw hex, RGB, HSL, or arbitrary Tailwind colors elsewhere. No inline styles. Use logical layout properties (`ms`, `me`, `ps`, `pe`, `start`, `end`). Keep token structure ready for a future dark theme without adding dark mode now.
- Every user-visible string comes from Arabic or English i18n resources. Arabic is the default and language changes update the document language and direction.
- All network access lives in `packages/api`. Browser storage is allowed only inside `packages/api/src/auth/` for token handling.
- The frontend displays backend-provided money through the shared formatting helper; it never calculates prices, fees, or totals.
- Strict TypeScript. Do not use `any` without a justified inline comment. Do not leave dead or commented-out code or `console.log`.
- Components render props and emit events. Logic/data live in hooks, server calls in API files, schemas/constants/types in their own files, and pages stay thin.
- No magic strings or numbers; use constants, enums, or settings. Extract duplicated logic. Keep functions small and single-purpose, use meaningful names and early returns.
- One component per file. No barrel files except a feature's public `index.ts`, the required package entry, and the icon registry.
- Add English TSDoc to each exported function, hook, and component describing purpose, parameters, and edge cases. Inline comments explain why, not what.
- Files should stay near 300 lines, components near 200 lines, and cyclomatic complexity at or below 10.

## Safety and errors

- No secrets in the repository or client environment. Only public configuration belongs in `VITE_*` variables. Never store tokens in localStorage.
- Do not use `dangerouslySetInnerHTML` or `eval`. Sanitize anything rendered from outside the application.
- Backend authorization is authoritative. Hiding a control is only a convenience.
- Centralize error handling in the normalized `AppError` model. Never show raw backend errors to users.
- Ship a baseline Content Security Policy in the static hosting headers file.

## Dependencies and delivery

- Use pnpm 11, Node 24 LTS, exact dependency pins, strict peer dependencies, a seven-day minimum release age, no-downgrade trust, blocked install scripts with an explicit allowlist, and a frozen CI lockfile.
- Verify package versions and APIs against current official documentation. Every new dependency needs a report entry: purpose, why it cannot be avoided, and maintenance status.
- Work on a branch created from `main`; never commit to `main`, force-push, or merge. Use granular Conventional Commits and commit logical changes only when lint, type checks, and tests pass.
- Before each commit, inspect `git status` and run a secret scan. Never commit secrets, `.env` files, build output, `node_modules`, or `referencebackend/`.
- Run lint, lint-rule proof, type checking, unit/component tests, build, and end-to-end smoke. If a browser is available, exercise the screens and include screenshots when possible. Report only checks that actually ran, and state what could not be checked and why.
- Keep root `CONTEXT.md` current. After writing `docs/reports/<step>-report.md`, print the same report in chat and stop.
