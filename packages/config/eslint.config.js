import js from "@eslint/js";
import boundaries from "@boundaries/eslint-plugin";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import architecture from "../../tools/eslint-rules/architecture.mjs";
import { cssProcessor } from "../../tools/eslint-rules/css-processor.mjs";

const sourceFiles = [
  "apps/**/*.{js,jsx,ts,tsx}",
  "packages/**/*.{js,jsx,ts,tsx}",
  "tools/lint-fixtures/**/*.tsx",
];
const projectIgnores = [
  "referencebackend/**",
  "**/referencebackend/**",
  "node_modules/**",
  "**/node_modules/**",
  ".pnpm-store/**",
  "**/.pnpm-store/**",
  "**/.vite/**",
  "**/dist/**",
  "**/dist-e2e/**",
  "**/coverage/**",
  "**/playwright-report/**",
  "**/test-results/**",
];

export default defineConfig(
  { ignores: projectIgnores },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: sourceFiles,
    languageOptions: { globals: globals.browser },
    plugins: {
      react,
      import: importPlugin,
      noldg: architecture,
    },
    settings: { react: { version: "19.3" } },
    rules: {
      "react/jsx-no-duplicate-props": "error",
      "react/no-unknown-property": "error",
      "import/no-duplicates": "error",
      "noldg/no-icon-library-outside-registry": "error",
      "noldg/no-style-jsx-attribute": "error",
      "noldg/no-color-literals": "error",
      "noldg/no-network-outside-http": "error",
      "noldg/no-web-storage-outside-token-store": "error",
      "noldg/no-dangerous-html-or-eval": "error",
      "noldg/no-literal-user-text-in-jsx": "error",
      "noldg/feature-public-imports-only": "error",
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 150, skipBlankLines: true, skipComments: true }],
      complexity: ["error", 10],
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: [
      "**/*.{mjs,cjs}",
      "**/vite.config.*",
      "**/vitest.config.*",
      "**/playwright.config.*",
      "**/*.test.*",
      "**/*.spec.*",
      "apps/portal/e2e/**",
      "apps/portal/test/**",
      "packages/api/test/**",
      "tools/**",
    ],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: [
      "apps/**/*.{js,jsx,ts,tsx}",
      "packages/**/*.{js,jsx,ts,tsx}",
      "tools/lint-fixtures/**/*.tsx",
    ],
    ignores: ["packages/ui/**"],
    plugins: { noldg: architecture },
    rules: { "noldg/no-native-ui-elements": "error" },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { globals: globals.node },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["apps/portal/src/**/*.{js,jsx,ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      },
      "boundaries/elements": [
        { type: "feature", partialMatch: false, pattern: "apps/*/src/features/**" },
        { type: "shared", partialMatch: false, pattern: "apps/*/src/shared/**" },
        { type: "pages", partialMatch: false, pattern: "apps/*/src/pages/**" },
        { type: "app", partialMatch: false, pattern: "apps/*/src/**" },
        { type: "package", partialMatch: false, pattern: "packages/**" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          checkUnknownLocals: true,
          default: "disallow",
          policies: [
            {
              from: { element: { type: ["app", "pages"] } },
              allow: {
                to: { element: { type: ["app", "pages", "feature", "shared", "package"] } },
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: { to: { element: { type: ["feature", "shared", "package"] } } },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: ["shared", "package"] } } },
            },
          ],
        },
      ],
      "noldg/feature-public-imports-only": "error",
    },
  },
  {
    files: ["apps/**/*.css", "packages/**/*.css"],
    processor: cssProcessor,
    plugins: { noldg: architecture },
    rules: { "noldg/no-color-literals": "error" },
  },
  {
    files: ["packages/ui/src/tokens/**/*", "packages/ui/src/brand/**/*"],
    rules: { "noldg/no-color-literals": "off" },
  },
);
