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
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
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
    files: [
      "apps/portal/src/features/**/*.{js,jsx,ts,tsx}",
      "tools/lint-fixtures/features/**/*.tsx",
    ],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "feature", pattern: "apps/*/src/features/**/*" },
        { type: "shared", pattern: "apps/*/src/shared/**/*" },
        { type: "app", pattern: "apps/*/src/**/*" },
        { type: "package", pattern: "packages/**/*" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          checkUnknownLocals: true,
          default: "allow",
          policies: [
            {
              from: { element: { type: "feature" } },
              allow: { to: { element: { type: ["feature", "shared", "package"] } } },
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
