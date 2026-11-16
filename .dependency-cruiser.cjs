module.exports = {
  forbidden: [{ name: "no-backend-reference", from: {}, to: { path: "referencebackend" } }],
  options: {
    doNotFollow: { path: "(?:node_modules|\\.pnpm-modules)" },
    exclude: "(?:referencebackend|node_modules|\\.pnpm-modules)",
  },
};
