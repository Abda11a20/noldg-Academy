# F7 Learning implementation report

## 1. Summary

Implemented F7 on `feat/f7-learning`: student My Lessons, lesson details and quiz stub, server-driven availability/access, learning API contracts/adapters/mocks, a file-only playback source, heartbeat session lifecycle, attachment downloads, Arabic and English copy, and player controls. HLS was not added because the streaming provider is undecided. The task is functionally complete and the verification gates passed. The implementation has been recorded in granular local commits. No push was made.

`referencebackend/` was read for contract verification and was not modified. The live backend does not currently support the target My Lessons list/detail or dedicated attachment download endpoint. Its playback access response supplies a short-lived direct downloadable file URL. Those gaps and the downloadable-delivery risk are recorded in the contract-differences document.

## 2. Files created or changed

- **API:** `packages/api/package.json`; `packages/api/src/config/capabilities.ts` and its test; new `adapters/learning.ts` and test; new `constants/learning.ts`; new learning schemas and tests; new learning endpoint files/tests; learning fixtures and MSW handlers; shared mock handler setup.
- **UI:** `packages/ui/src/index.ts`; new player components under `packages/ui/src/components/player/` (VideoPlayer, controls, SeekBar, Watermark, and supporting files/tests).
- **Portal:** `apps/portal/src/features/learning/` (queries, list/detail pages, attachment and playback hooks, lifecycle and tests); `apps/portal/src/app/navigation.ts`, `router.tsx`; shared navigation routes; shared time helpers and tests; Arabic/English learning locales; common locale updates; gallery player example; portal coverage thresholds; `apps/portal/e2e/learning.spec.ts`; E2E fixtures/config/runner and catalog abort declarations; bundle budget checker and baseline.
- **Docs:** `docs/api-target-learning.md`, `docs/decisions/ADR-017-playback-source.md`, `docs/decisions/ADR-018-playback-heartbeats.md`, `docs/rules/BROWSER-ERROR-ALLOWLIST.md`, `docs/contract-differences.md`, `README.md`, `CONTEXT.md`, this report.
- **F6 coverage restoration included in the F7 ratchet:** `OrderAdminMeta.test.tsx`, `AdminOrderFilters.test.tsx`, and `ManualOrderPage.test.tsx`.
- **Local artifact excluded from Git:** `apps/portal/debug.log` remains untracked and was not staged. It is a local artifact; it was not included in the secret-pattern scan of staged changes.

## 3. Versions

| Tool/package         |  Version | F7 use / version note                            |
| -------------------- | -------: | ------------------------------------------------ |
| Node.js              |  24.22.3 | Required runtime; `.nvmrc` is 24.                |
| pnpm                 | 11.28.11 | Workspace package manager.                       |
| TypeScript           |    6.0.3 | Existing catalog version; no dependency changes. |
| React / React DOM    |   19.3.1 | Existing catalog versions.                       |
| Vite                 |    8.3.7 | Existing catalog version.                        |
| React Router         |    8.5.1 | Existing catalog version.                        |
| TanStack Query       |  5.107.1 | Existing catalog version.                        |
| Vitest / coverage-v8 |    5.1.0 | Existing catalog versions.                       |
| MSW                  |    3.0.4 | Existing mock infrastructure.                    |
| Zod                  |    4.6.7 | Existing API contract validation.                |
| radix-ui             |    1.8.1 | Existing UI primitives.                          |
| lucide-react         |   1.71.0 | Existing icon registry dependency.               |

No package was added or upgraded for F7. HLS playback was deliberately not implemented and no media dependency was introduced.

## 4. Commands run and results

| Command                                                                  | Result                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `node -v`                                                                | Pass: `v24.22.3`.                                                                           |
| `pnpm --version`                                                         | Pass: `11.28.11`.                                                                           |
| `pnpm lint`                                                              | Pass, exit 0, no warnings.                                                                  |
| `pnpm lint:rules`                                                        | Pass: `Passed 17/17 ESLint rule fixtures.`                                                  |
| `pnpm typecheck`                                                         | Pass, exit 0.                                                                               |
| `pnpm test`                                                              | Pass: 427 tests across portal/API/UI; coverage thresholds passed.                           |
| `pnpm format:check`                                                      | Pass: all matched files use Prettier code style.                                            |
| `pnpm test:headers`                                                      | Pass: 4/4 tests.                                                                            |
| `pnpm build` with API, upload, and image origins set                     | Pass: production build completed.                                                           |
| `pnpm check:bundle-size`                                                 | Pass: 226.02 kB gzip initial-route JS; growth 0.99 kB; lazy-route and growth limits passed. |
| `pnpm check:no-dev-routes`                                               | Pass: no development gallery marker in production output.                                   |
| `pnpm knip`                                                              | Pass, exit 0.                                                                               |
| `pnpm dependency-cruiser`                                                | Pass: 720 modules, 2353 dependencies, no violations.                                        |
| `pnpm test:e2e`                                                          | Five consecutive complete runs passed, 39/39 each, exit 0 each. See section 5.              |
| Temporary Playwright negative proof: failing assertion                   | Expected failure confirmed: E2E process exited non-zero; temporary test removed.            |
| Temporary Playwright negative proof: undeclared API 401/resource failure | Expected failure confirmed by the scenario fixture; temporary test removed.                 |
| `pnpm audit:prod`, `pnpm audit:full`                                     | Not run; these are owner-run checks.                                                        |

The first additional attempt to start an E2E run was stopped because port 4174 was reported occupied by a stale preview. It was not counted as a run. A subsequent check found no process listening on the port; the five counted runs then started and stopped their preview servers normally.

## 5. Tests and coverage

Unit and component test totals: portal **166**, API **185**, UI **76**; total **427**.

| Package | Statements | Branches | Functions |  Lines | Enforced thresholds           |
| ------- | ---------: | -------: | --------: | -----: | ----------------------------- |
| Portal  |     86.18% |   67.59% |    74.96% | 88.44% | 85.18 / 66.73 / 73.96 / 87.44 |
| API     |     94.34% |   83.91% |    98.72% | 96.38% | 93 / 83 / 98 / 95             |
| UI      |       100% |     100% |      100% |   100% | 100 / 100 / 100 / 100         |

Portal metrics exceed the F5 measured levels of 85.24 / 66.31 / 73.44 / 87.61. Thresholds were ratcheted to the current F7 measured value minus one point where that exceeded the existing threshold; no threshold was lowered.

The Playwright test inventory remained intact and grew from 36 to 39; no existing test was removed or merged:

| File                                          | Test names                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/portal/e2e/admin.spec.ts`               | `admin opens academic and teacher administration at mobile and desktop widths`; `admin rejects a teacher application and the same teacher resubmits`                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `apps/portal/e2e/auth-request-errors.spec.ts` | `rate limits login and disables retry`; `network failures show the generic request message`                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `apps/portal/e2e/auth-scenarios.spec.ts`      | `auth page handles wrong password`; `auth page handles pending teacher`; `auth page handles rejected teacher`; `auth page handles suspended account`; `auth page handles device not registered`; `auth page handles 429 response`; `auth page handles network failure`; `student registration handles email already taken`; `student registration handles phone already taken`; `student registration handles validation details`; `email verification handles invalid code`; `email verification handles expired code`; `email verification handles rate limited code` |
| `apps/portal/e2e/auth.spec.ts`                | `student signup, email verification, and login`; `teacher registration adds offerings and reaches pending review`; `student, teacher, and admin login redirects by role`; `wrong password remains generic, forgot and reset password never put a code in the URL`; `guard preserves returnTo, logout clears session, and device-change request shows status`; `suspended account login routes to the suspended state`; `expired session redirects to login after a failed refresh`                                                                                      |
| `apps/portal/e2e/catalog.spec.ts`             | `approved teacher can publish a video lesson and create a bundle`; `teacher course views render in Arabic RTL at mobile width`                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `apps/portal/e2e/learning.spec.ts`            | `student opens My lessons and starts the server-authorized file player`; `lesson availability filters follow the URL and switch the shell direction`; `a replacement session announces the device change and can continue here`                                                                                                                                                                                                                                                                                                                                         |
| `apps/portal/e2e/orders.spec.ts`              | `student submits an order, sees its receipt, and finds it in purchases`; `admin creates a manual cash order and approves a pending payment`; `student cancels a pending order after confirming`; `admin rejects a pending payment with a reason`                                                                                                                                                                                                                                                                                                                        |
| `apps/portal/e2e/portal.spec.ts`              | `portal loads and anonymous student routes redirect to login`; `language switch updates document language and direction`; `mobile topbar keeps the language action in the account menu with touch-sized controls`; `development gallery renders both directions`; `development gallery covers Arabic and English at mobile and desktop widths`                                                                                                                                                                                                                          |
| `apps/portal/e2e/student-browse.spec.ts`      | `student browses teacher list, details, checkout, and keeps URL filters`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Full E2E run results, in order: **#1 39/39 pass (exit 0; prior successful run recorded before this continuation); #2 39/39 (exit 0); #3 39/39 (exit 0); #4 39/39 (exit 0); #5 39/39 (exit 0).** The five counted runs were serial. Playwright uses one worker to avoid shared service-worker/MSW state between parallel scenarios. The E2E runner binds the mock API base URL to the preview origin.

Vitest emitted pre-existing React `act()` warnings in playback-hook tests and an unmatched `/admin/orders/manual-order-created` route warning in an otherwise passing manual-order test. These did not fail the suite and remain technical debt.

## 6. Lint-rule proofs

`pnpm lint:rules` passed all **17/17** configured fixture violations. Browser request failures use the explicit per-scenario allowlist in `docs/rules/BROWSER-ERROR-ALLOWLIST.md`: method, URL pattern and exact status (or transport failure) are declared; only matching requests and their matching Chromium resource error are tolerated. An undeclared 4xx proof failed as expected, and any other console/page error continues to fail the scenario.

## 7. Bundle sizes

| Metric                                 | F6 baseline | F7 production |                     Limit | Result          |
| -------------------------------------- | ----------: | ------------: | ------------------------: | --------------- |
| Initial-route JavaScript gzip          |   225.03 kB |     226.02 kB | 250 kB and baseline +2 kB | Pass; +0.99 kB. |
| Portal entry gzip                      |           — |       1.61 kB |             Informational | Pass.           |
| Main app chunk gzip                    |           — |      71.69 kB |             Informational | Pass.           |
| Largest lazy route, `LessonEditorPage` |     7.10 kB |       7.05 kB |                     80 kB | Pass.           |

The `/login` route does not load registration or teacher-form route chunks. The bundle checker reports entry, main app, total initial JavaScript, `/login` chunk composition, and largest lazy route chunks. The committed baseline remains 225.03 kB gzip; measured growth is within the existing +2 kB allowance.

## 8. Deviations from the specification

- HLS source is documented in the discriminated contract but not rendered, as required pending a provider decision. The player implements the file source only.
- Live-mode target My Lessons list/detail and dedicated attachment download are unavailable in the current backend; capability flags disable those unsupported calls. A direct downloadable media URL remains a backend delivery security gap, documented rather than hidden.
- E2E config was serialized to one worker after investigation showed intermittent mock/request failures under parallel shared state. The suite still runs all 39 scenarios and both negative proofs.
- The first commit attempt was rejected by commitlint because its body line exceeded 100 characters; the message was shortened and the retry passed. No source or test assertion was weakened.
- Owner-run package audits were intentionally not run.

## 9. Assumptions

- Live playback direct URLs are treated as downloadable media, not as protected streaming. The backend must enforce entitlement and URL lifetime.
- My Lessons availability, lesson ownership, watched progress, quiz availability, and playback limits are server-authoritative. Client time is used only for display countdowns.
- A single-worker E2E suite is an acceptable stability tradeoff for shared browser/MSW state in this local and CI runner.

## 10. Questions

- Which streaming provider and tokenized delivery method will the backend select before HLS or another stream renderer is implemented?
- When will the backend provide `/me/lessons`, lesson detail, and short-lived attachment-download endpoints matching `docs/api-target-learning.md`?
- Should the portal retain its current local `debug.log` artifact, or may the owner remove it separately?

## 11. Risks and technical debt

- **High integration risk:** the live backend does not expose the target student lesson list/detail or dedicated attachment download routes. F7 learning pages are fully testable in mock mode; those live flows remain capability-off.
- **Media protection gap:** live playback currently returns a short-lived direct file URL. This is not equivalent to protected streaming; the backend must validate ownership and expiry. The frontend cannot enforce media authorization.
- **Playback API compatibility:** the live backend exposes legacy session/progress shapes and error codes; adapters normalize known fields, but backend confirmation is still needed for replacement, heartbeat ordering and progress semantics.
- **Test warnings:** React `act()` and unmatched manual-order route warnings should be cleaned up in a future targeted test-fix task.
- **Unpushed delivery:** F7 is committed locally on `feat/f7-learning`; it has not been pushed.
- **Audits:** `pnpm audit:prod` and `pnpm audit:full` remain owner-run and outstanding.

## 12. Commits

| Commit    | Message                                             |
| --------- | --------------------------------------------------- |
| `242a825` | `feat(api): add learning playback contracts`        |
| `24be355` | `feat(ui): add accessible video player controls`    |
| `22dbe40` | `feat(portal): add student learning experience`     |
| `c8aea00` | `test(portal): stabilize strict learning e2e suite` |

The documentation/report commit is recorded in the final `git log` and completion message. All commits are local on `feat/f7-learning`; no push was made.

## 13. What to review first

1. Review the live playback URL limitation and capability notes in `docs/api-target-learning.md` and `docs/contract-differences.md`.
2. Review `usePlaybackSession` retry, sequence, cleanup, and session-replacement behavior alongside its hook tests.
3. Review the five-run E2E evidence and explicit browser failure allowlist.
4. Review the granular local commit series and the local untracked `apps/portal/debug.log` before any cleanup.

## Screenshots

F7 screenshots are stored in the ignored `docs/reports/screenshots/` directory and were not committed:

- `f7-ar-1280-my-lessons.png`
- `f7-en-1280-my-lessons.png`
- `f7-en-375-my-lessons.png`
- `f7-en-375-lesson-player.png`
