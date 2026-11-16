# Mocks

Use `handlers/` for one empty handler module per API domain and `fixtures/` for deterministic response data. Browser development uses `browserWorker`; Node tests use `nodeServer`. `VITE_API_MODE=mock|live` selects whether the portal starts the browser worker.
