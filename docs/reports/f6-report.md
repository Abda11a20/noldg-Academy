# F6 Technical Report — Orders and Purchases

## 1. Summary

Implemented the F6 order workflows on `feat/f6-orders`: target and legacy order contracts, normalized adapters, mocks, student checkout and purchase history/detail, admin order review and manual cash order, payment receipt and WhatsApp support links, display-only expiry countdowns, and Arabic/English copy. The current backend supports a legacy two-call order/payment workflow; target-only expiry, cancellation, idempotency, rich admin filters, and atomic manual order behavior remain disabled in live mode. Prices and order decisions remain server-owned.

The production initial route is 225.03 kB gzip, 3.66 kB below the F5 228.69 kB baseline and below the 250 kB budget. The largest lazy route is 7.10 kB, below the 80 kB per-route budget. All 36 existing Playwright tests pass. A temporary undeclared-network request made its scenario fail as required and was removed. `referencebackend/` was only read for contract evidence; no dependency install or audit was run during F6.

## 2. Files created or changed

- API: order contracts, schemas, target/live adapters, student/admin/settings endpoints, capability flags, mock handlers, fixtures, adapter and endpoint tests, and public exports under `packages/api/src/`.
- Portal feature: order query keys/hooks, checkout and receipt, purchases list/detail, admin queue/detail/manual order, error mapping, and page tests under `apps/portal/src/features/orders/`.
- Shared helpers: WhatsApp link/phone normalization, idempotency attempt key, and server-offset countdown under `apps/portal/src/shared/`.
- UI: `Stepper`, `CopyButton`, `StatusBadge`, and `Countdown` with tests, gallery entries, and Arabic/English labels under `packages/ui/` and `apps/portal/src/shared/i18n/locales/`.
- F6 performance follow-up: lazy route-specific locale loading, deferred role navigation and mobile account menu, and controlled account-menu state in the shared `DropdownMenu`.
- Documentation: `docs/api-target-orders.md`, `docs/decisions/ADR-015-single-step-order-contract.md`, `docs/decisions/ADR-016-whatsapp-idempotency-server-clock.md`, updated `docs/contract-differences.md`, `README.md`, `CONTEXT.md`, and this report.
- Screenshot: `f6-checkout-en-1280.png` is in the ignored `docs/reports/screenshots/` directory. No screenshot is committed.

## 3. Versions

No dependency versions were changed in F6. The owner installed the previously declared bundle visualizer dependency with `pnpm install --frozen-lockfile` before continuation. Versions below are the exact workspace pins and runtime versions observed during this work.

| Tool or package               |         Version | Notes                                                                            |
| ----------------------------- | --------------: | -------------------------------------------------------------------------------- |
| Node.js                       |         24.22.3 | Required by `.nvmrc` and engine policy.                                          |
| pnpm                          |        11.28.11 | Root `packageManager` pin.                                                       |
| React / React DOM             |          19.3.1 | Existing portal runtime.                                                         |
| React Router                  |           8.5.1 | Existing route and lazy route layer.                                             |
| TanStack Query                |         5.107.1 | Existing server state/cache layer.                                               |
| React Hook Form               |          7.92.0 | Existing form layer.                                                             |
| `@hookform/resolvers`         |           7.0.6 | Existing Zod integration.                                                        |
| Zod                           |           4.6.7 | Order request and response contracts.                                            |
| i18next / react-i18next       | 27.0.1 / 18.0.1 | Bilingual translations and lazy namespace loading.                               |
| Vite / `@vitejs/plugin-react` |   8.3.7 / 6.3.0 | Existing portal build.                                                           |
| TypeScript                    |           6.0.3 | Existing strict TypeScript configuration.                                        |
| Vitest / coverage-v8          |   5.1.0 / 5.1.0 | Existing unit and component test runner.                                         |
| Playwright                    |          1.65.0 | Existing E2E runner.                                                             |
| MSW                           |           3.0.4 | Existing mock network handlers.                                                  |
| Tailwind CSS / Vite plugin    |   4.3.5 / 4.3.5 | Existing token-driven styles.                                                    |
| Radix UI                      |           1.8.1 | Existing shared accessible primitives.                                           |
| Lucide React                  |          1.71.0 | Existing icon registry implementation.                                           |
| ESLint                        |          9.39.5 | Kept on ESLint 9 per ADR-006 until configured plugins declare ESLint 10 support. |
| Prettier                      |          3.9.10 | Existing formatter.                                                              |
| Turbo                         |         2.11.10 | Existing monorepo task runner.                                                   |
| Knip                          |          6.44.2 | Existing unused-code/dependency check.                                           |
| dependency-cruiser            |          18.7.2 | Existing module boundary check.                                                  |
| rollup-plugin-visualizer      |           7.1.3 | Previously declared and installed by owner; analysis is gated by `ANALYZE=true`. |

## 4. Commands run with results

| Command                                                           | Result                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node -v` / `pnpm -v`                                             | PASS — `v24.22.3` / `11.28.11`.                                                                                                                                                                                                                                                 |
| `pnpm lint`                                                       | PASS — ESLint completed with zero errors and warnings.                                                                                                                                                                                                                          |
| `pnpm lint:rules`                                                 | PASS — `Passed 17/17 ESLint rule fixtures.`                                                                                                                                                                                                                                     |
| `pnpm typecheck`                                                  | PASS — Turbo 3/3 tasks.                                                                                                                                                                                                                                                         |
| `pnpm test`                                                       | PASS — 363 tests across 85 files; all thresholds passed.                                                                                                                                                                                                                        |
| `pnpm format:check`                                               | PASS — all matched files formatted.                                                                                                                                                                                                                                             |
| `pnpm test:headers`                                               | PASS — 4/4.                                                                                                                                                                                                                                                                     |
| `pnpm knip`                                                       | PASS — no unused dependency or export findings.                                                                                                                                                                                                                                 |
| `pnpm dependency-cruiser`                                         | PASS — 646 modules, 2035 dependencies; no dependency violations.                                                                                                                                                                                                                |
| `pnpm test:e2e`                                                   | PASS — 36/36 scenarios on the final positive run.                                                                                                                                                                                                                               |
| Temporary E2E undeclared-request proof                            | EXPECTED FAILURE — runner exited 1 and the fixture reported the undeclared network request; temporary spec removed. During that full run, one unrelated catalog scenario also saw a transient network request failure. The immediate clean rerun passed all 36 permanent tests. |
| `pnpm --filter @noldg/portal build` with API/upload/image origins | PASS — production Vite build completed.                                                                                                                                                                                                                                         |
| `pnpm check:bundle-size`                                          | PASS — entry 1.59 kB, main app 71.34 kB, initial route 225.03 kB gzip; largest lazy route 7.10 kB.                                                                                                                                                                              |
| `pnpm check:no-dev-routes`                                        | PASS — no UI gallery marker in the final production output.                                                                                                                                                                                                                     |
| `git diff --check`                                                | PASS — no whitespace errors before final staging.                                                                                                                                                                                                                               |
| `pnpm audit:prod`, `pnpm audit:full`                              | NOT RUN — these are owner-run checks.                                                                                                                                                                                                                                           |

No install, node_modules mutation, or command against `referencebackend/` was run during this continuation.

## 5. Test results and coverage

| Package   | Test files |   Tests | Statements | Branches | Functions |  Lines | Threshold                                     |
| --------- | ---------: | ------: | ---------: | -------: | --------: | -----: | --------------------------------------------- |
| Portal    |         39 |     138 |     85.05% |   64.32% |    71.50% | 87.27% | Baseline-minus-one ratchet remains satisfied. |
| API       |         29 |     155 |     94.41% |   83.35% |    99.16% | 96.31% | 93 / 83 / 98 / 95.                            |
| UI        |         17 |      70 |       100% |     100% |      100% |   100% | 100% on all four metrics.                     |
| **Total** |     **85** | **363** |          — |        — |         — |      — | —                                             |

Permanent E2E inventory (36 tests; no prior scenario was removed or merged):

- `admin.spec.ts`: `admin opens academic and teacher administration at mobile and desktop widths`; `admin rejects a teacher application and the same teacher resubmits`.
- `auth-request-errors.spec.ts`: `rate limits login and disables retry`; `network failures show the generic request message`.
- `auth-scenarios.spec.ts`: `auth page handles wrong password`; `auth page handles pending teacher`; `auth page handles rejected teacher`; `auth page handles suspended account`; `auth page handles device not registered`; `auth page handles 429 response`; `auth page handles network failure`; `student registration handles email already taken`; `student registration handles phone already taken`; `student registration handles validation details`; `email verification handles invalid code`; `email verification handles expired code`; `email verification handles rate limited code`.
- `auth.spec.ts`: `student signup, email verification, and login`; `teacher registration adds offerings and reaches pending review`; `student, teacher, and admin login redirects by role`; `wrong password remains generic, forgot and reset password never put a code in the URL`; `guard preserves returnTo, logout clears session, and device-change request shows status`; `suspended account login routes to the suspended state`; `expired session redirects to login after a failed refresh`.
- `catalog.spec.ts`: `approved teacher can publish a video lesson and create a bundle`; `teacher course views render in Arabic RTL at mobile width`.
- `orders.spec.ts`: `student submits an order, sees its receipt, and finds it in purchases`; `admin creates a manual cash order and approves a pending payment`; `student cancels a pending order after confirming`; `admin rejects a pending payment with a reason`.
- `portal.spec.ts`: `portal loads and anonymous student routes redirect to login`; `language switch updates document language and direction`; `mobile topbar keeps the language action in the account menu with touch-sized controls`; `development gallery renders both directions`; `development gallery covers Arabic and English at mobile and desktop widths`.
- `student-browse.spec.ts`: `student browses teacher list, details, checkout, and keeps URL filters`.

## 6. Lint-rule proofs

The rule fixture verifier passed all 17/17 expected violations. Existing no-literal-text, component boundary, storage, HTTP, style, color, safe HTML, complexity, and import restrictions were not weakened. The temporary E2E negative proof was removed after it produced a scenario failure for its undeclared request.

## 7. Bundle sizes

| Measurement              | F5 baseline |  F6 final | Budget/result             |
| ------------------------ | ----------: | --------: | ------------------------- |
| Portal entry JS gzip     |           — |   1.59 kB | Informational.            |
| Main app JS gzip         |           — |  71.34 kB | Informational.            |
| Initial route total gzip |   228.69 kB | 225.03 kB | ≤250 kB; reduced 3.66 kB. |
| Largest lazy route gzip  |           — |   7.10 kB | ≤80 kB.                   |

The one-time visualizer run recorded the largest contributing source modules before the final cheap-splitting changes. These are individually gzipped module contributions, not emitted chunk sizes, so their sum is not expected to equal the final route bundle: `startPortal` 167.79 kB; `client` 44.28 kB; `hooks` 38.71 kB; `useTranslation` 24.71 kB; `index.esm` 20.92 kB; `dist-BC` 16.48 kB; `dist-HV` 15.07 kB; `es2015` 14.47 kB; `LessonEditorPage` 14.39 kB; `GlyphRenderer` 14.12 kB. Final lazy route namespace and role-menu imports reduced initial route bytes to 225.03 kB. Analyzer HTML was not committed.

## 8. Deviations from the spec and why

- Live order submission adapts the target single request to the backend's separate order-create and payment-submit requests. If payment submission fails after order creation, the UI reports the saved order reference and does not claim the payment was recorded.
- Live manual-order entry uses IDs instead of searchable student/product selectors because the inspected backend does not expose the required search/list contracts.
- Live target idempotency, order expiry, cancellation, atomic manual creation, rich queue filters, public WhatsApp setting, and short sequential order numbers remain capability-off when unsupported by the current backend.
- The full E2E run used to prove the undeclared request also observed one transient catalog network failure. The temporary negative proof itself failed for the intended allowlist assertion; a clean run afterward passed 36/36. This is recorded rather than hidden.
- Owner-run dependency audits were not run, per instruction.

## 9. Assumptions

- Backend route and payload facts in `docs/contract-differences.md` reflect the read-only source inspected for F6; target behavior remains a contract for the backend team, not an assertion that it exists today.
- `orderExpiryHours`, when provided, is server-owned. The browser displays remaining time from `serverNow` and `expiresAt`; it does not mark orders expired or decide whether an action is valid.
- Checkout amounts and snapshots are accepted only from pricing/order responses; the frontend does not calculate prices or totals.

## 10. Questions

- Backend owner: confirm the target idempotency key contract, one-step order/payment submission, short order number, expiry, student cancellation, atomic manual order, filter parameters, and searchable student/product lookup before enabling their live capabilities.
- Product owner: confirm the target display copy for payment instructions and the WhatsApp handoff details once the backend settings contract is available.
- Owner: run `pnpm audit:prod` and `pnpm audit:full` and provide the results before accepting this step.

## 11. Risks and technical debt

- The legacy live two-request flow cannot be atomic. A payment-submit failure can leave an order awaiting payment; the UI preserves and reports the returned order reference, but reconciliation remains a backend operational requirement.
- Without backend expiry and idempotency, the UI cannot guarantee order uniqueness or deadlines in live mode. Authorization and order-state transitions must remain backend-enforced.
- Manual order IDs are error-prone until authenticated searchable lookup routes exist.
- The full negative-proof run had one unrelated, non-reproducible catalog request failure before the clean 36/36 rerun; keep watching this E2E scenario for flakiness.

## 12. Commits

| Commit               | Message                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `26ee63e`            | `feat(api): add orders contracts and endpoints`                                                                                                                |
| `31949c0`            | `feat(ui): add order flow primitives`                                                                                                                          |
| `828b6fd`            | `feat(portal): add student purchases and admin orders`                                                                                                         |
| `4e52ef3`            | `perf(portal): defer secondary route code`                                                                                                                     |
| Documentation commit | This report and F6 handover docs are committed separately; its hash is included in the completion message because a report cannot contain its own commit hash. |

## 13. What the owner should review first

1. Review the two-step live order/payment failure handling and the capability-off behavior against the backend contract.
2. Review manual-order ID entry and decide with the backend owner how searchable student/product selection should be exposed.
3. Review the F6 target contract and the corresponding current-backend evidence in `docs/contract-differences.md`.
4. Run both owner audits, then review the final branch commits before merging.
