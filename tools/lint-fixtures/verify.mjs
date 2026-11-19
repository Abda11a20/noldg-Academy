import assert from "node:assert/strict";
import path from "node:path";
import { ESLint } from "eslint";

const fixtures = new Map([
  ["icon-library.tsx", "noldg/no-icon-library-outside-registry"],
  ["native-element.tsx", "noldg/no-native-ui-elements"],
  ["style-prop.tsx", "noldg/no-style-jsx-attribute"],
  ["color-literal.tsx", "noldg/no-color-literals"],
  ["network-api.tsx", "noldg/no-network-outside-http"],
  ["web-storage.tsx", "noldg/no-web-storage-outside-token-store"],
  ["dangerous-html.tsx", "noldg/no-dangerous-html-or-eval"],
  ["literal-user-text.tsx", "noldg/no-literal-user-text-in-jsx"],
  [path.join("features", "alpha", "private-import.tsx"), "noldg/feature-public-imports-only"],
  ["core-rule.tsx", "no-console"],
  ["explicit-any.tsx", "@typescript-eslint/no-explicit-any"],
  ["max-lines.tsx", "max-lines"],
  ["max-lines-per-function.tsx", "max-lines-per-function"],
  ["complexity.tsx", "complexity"],
  [path.join("packages-ui", "literal-user-text.tsx"), "noldg/no-literal-user-text-in-jsx"],
  ["external-lucide.tsx", "noldg/no-icon-library-outside-registry"],
  [path.join("features", "alpha", "native-anchor.tsx"), "noldg/no-native-ui-elements"],
]);

const eslint = new ESLint({ cwd: process.cwd() });
let passed = 0;

for (const [fixture, expectedRule] of fixtures) {
  const [result] = await eslint.lintFiles([path.join("tools", "lint-fixtures", fixture)]);
  const rules = new Set(result.messages.map(({ ruleId }) => ruleId));
  assert.ok(rules.has(expectedRule), `${fixture} did not trigger ${expectedRule}`);
  passed += 1;
}

assert.equal(passed, fixtures.size);
process.stdout.write(`Passed ${passed}/${fixtures.size} ESLint rule fixtures.\n`);
