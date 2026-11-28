module.exports = {
  forbidden: [
    { name: "no-backend-reference", severity: "error", from: {}, to: { path: "referencebackend" } },
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    {
      name: "no-shared-to-app-pages-or-features",
      severity: "error",
      from: { path: "^apps/portal/src/shared" },
      to: { path: "^apps/portal/src/(app|features|pages)" },
    },
    {
      name: "no-feature-to-app-or-pages",
      severity: "error",
      from: { path: "^apps/portal/src/features" },
      to: { path: "^apps/portal/src/(app|pages)" },
    },
    {
      name: "no-ui-to-api-or-portal",
      severity: "error",
      from: { path: "^packages/ui" },
      to: { path: "^(packages/api|apps/)" },
    },
    {
      name: "no-api-to-ui-or-portal",
      severity: "error",
      from: { path: "^packages/api" },
      to: { path: "^(packages/ui|apps/)" },
    },
  ],
  options: {
    doNotFollow: { path: "(?:node_modules|\\.pnpm-store)" },
    exclude:
      "(?:^|/)(?:referencebackend|node_modules|\\.pnpm-store|dist|dist-e2e|coverage|playwright-report|test-results)(?:/|$)",
  },
};
