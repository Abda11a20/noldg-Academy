# Browser request error allowlist

Every Playwright scenario uses `declareExpectedApiFailure` to list each expected failed request with its HTTP method, URL regular expression, and exact HTTP status (or `network` for a transport failure). The fixture records failed HTTP responses and failed requests. It tolerates a Chromium “Failed to load resource” console error only when the exact request URL matches a request failure that the same scenario declared. Undeclared failures, undeclared resource errors, unmatched declarations, all other browser console errors, and all uncaught page errors fail the scenario. A declaration does not suppress unrelated requests or messages.

Use the narrowest URL pattern practical. Do not declare failures that the scenario does not exercise. The negative proof temporarily issues an undeclared 4xx and verifies the test fails; that temporary test is removed after the proof.
