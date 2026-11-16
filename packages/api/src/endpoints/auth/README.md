# Endpoint pattern

Keep endpoint functions in a domain folder. Each function builds a request with `request()` from `packages/api/src/http/client.ts`, passes the domain response schema, and accepts typed input. Map legacy backend shapes only in `adapters/`; feature code must not import from the backend reference folder.
