# Browser error allowlist

Each Playwright scenario that intentionally exercises an unsuccessful request must call
`declareExpectedApiFailure` before triggering it. A declaration contains the HTTP method, a URL
regular expression, and either the exact non-2xx status or `network` for a transport failure.

The fixture observes all failed browser requests. A declaration identifies an expected failure
signature; repeated requests with that same method, URL pattern, and status are tolerated because
the query layer may retry them. Every observed request must match a declared signature. Some
declared signatures can be absent when query cancellation timing varies between runs. Chromium's
`Failed to load resource` console message is tolerated only when paired with a matching failed
request. All other console errors and every uncaught page error fail the scenario. Unhandled MSW
requests remain errors.

Do not declare status-only or wildcard allowances: declarations belong to the scenario that expects
the failure and must identify its request method, URL, and outcome.

The rule is exercised by a temporary Playwright scenario that triggers an undeclared 418 response.
That scenario must fail, then the temporary test is removed and not committed.
