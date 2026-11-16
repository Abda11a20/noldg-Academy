import path from "node:path";

const forbiddenElements = new Set(["button", "input", "select", "textarea", "img", "svg", "a"]);
const userFacingAttributes = new Set(["alt", "aria-label", "label", "placeholder", "title"]);
const technicalAttributes = new Set([
  "className",
  "type",
  "role",
  "dir",
  "lang",
  "viewBox",
  "width",
  "height",
  "fill",
  "stroke",
  "aria-hidden",
  "data-theme",
  "data-flip-rtl",
]);
const colorPattern =
  /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|color)\s*\(|(?:bg|text|border|ring|outline|shadow|fill|stroke)-\[[^\]]*(?:#[\da-f]|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|color)\s*\(|var\(|currentcolor|transparent|\b(?:black|white|red|blue|green|yellow|purple|orange|pink|gray|grey)\b)[^\]]*\]/i;

function normalizedPath(context) {
  return context.filename.replaceAll("\\", "/");
}

function isAllowedHttpFile(filename) {
  return /\/packages\/api\/src\/(http|realtime)\//.test(filename);
}

function hasForbiddenFeatureImport(filename, source) {
  const normalized = filename.replaceAll("\\", "/");
  const current = normalized.match(/\/features\/([^/]+)\//);
  if (!current) return false;
  const resolved = source.startsWith(".")
    ? path.resolve(path.dirname(filename), source).replaceAll("\\", "/")
    : source;
  const targetFeature = resolved.match(/(?:^|\/)features\/([^/]+)\/(.*)$/);
  if (targetFeature) {
    return targetFeature[1] !== current[1] && !/(?:^|\/)index(?:\.[^/]*)?$/.test(targetFeature[2]);
  }
  const appSource = resolved.match(/\/apps\/portal\/src\/(.*)$/);
  return Boolean(appSource && !appSource[1].startsWith("shared/"));
}

const plugin = {
  meta: { name: "noldg-architecture" },
  rules: {
    "no-icon-library-outside-registry": {
      meta: {
        type: "problem",
        schema: [],
        messages: { forbidden: "Import icon libraries only in the UI icon registry." },
      },
      create(context) {
        const filename = normalizedPath(context);
        if (/\/packages\/ui\/src\/icons\//.test(filename)) return {};
        return {
          ImportDeclaration(node) {
            const source = node.source.value.toLowerCase();
            const isExternalIconLibrary =
              !node.source.value.startsWith(".") &&
              (source.includes("icon") || source.includes("lucide"));
            if (isExternalIconLibrary) context.report({ node, messageId: "forbidden" });
          },
        };
      },
    },
    "no-native-ui-elements": {
      meta: {
        type: "problem",
        schema: [],
        messages: { forbidden: "Use the shared UI component instead of this native control." },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.type === "JSXIdentifier" && forbiddenElements.has(node.name.name))
              context.report({ node, messageId: "forbidden" });
          },
        };
      },
    },
    "no-style-jsx-attribute": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          forbidden: "Move styles to tokens or a stylesheet; style props are not allowed.",
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.type === "JSXIdentifier" && node.name.name === "style")
              context.report({ node, messageId: "forbidden" });
          },
        };
      },
    },
    "no-color-literals": {
      meta: {
        type: "problem",
        schema: [],
        messages: { forbidden: "Use a semantic design token instead of a color literal." },
      },
      create(context) {
        const filename = normalizedPath(context);
        if (/\/packages\/ui\/src\/(tokens|brand)\//.test(filename)) return {};
        const inspect = (node, value) => {
          if (typeof value === "string" && colorPattern.test(value))
            context.report({ node, messageId: "forbidden" });
        };
        return {
          Literal(node) {
            inspect(node, node.value);
          },
          TemplateElement(node) {
            inspect(node, node.value.raw);
          },
        };
      },
    },
    "no-network-outside-http": {
      meta: {
        type: "problem",
        schema: [],
        messages: { forbidden: "Keep network APIs inside packages/api/src/http or realtime." },
      },
      create(context) {
        if (isAllowedHttpFile(normalizedPath(context))) return {};
        return {
          Identifier(node) {
            if (["fetch", "axios", "EventSource", "WebSocket"].includes(node.name))
              context.report({ node, messageId: "forbidden" });
          },
          ImportDeclaration(node) {
            if (node.source.value === "axios") context.report({ node, messageId: "forbidden" });
          },
        };
      },
    },
    "no-web-storage-outside-token-store": {
      meta: {
        type: "problem",
        schema: [],
        messages: { forbidden: "Use browser storage only in packages/api/src/auth." },
      },
      create(context) {
        if (/\/packages\/api\/src\/auth\//.test(normalizedPath(context))) return {};
        return {
          Identifier(node) {
            if (node.name === "localStorage" || node.name === "sessionStorage")
              context.report({ node, messageId: "forbidden" });
          },
        };
      },
    },
    "no-dangerous-html-or-eval": {
      meta: {
        type: "problem",
        schema: [],
        messages: { forbidden: "Avoid dangerouslySetInnerHTML and eval." },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.type === "JSXIdentifier" && node.name.name === "dangerouslySetInnerHTML")
              context.report({ node, messageId: "forbidden" });
          },
          CallExpression(node) {
            if (node.callee.type === "Identifier" && node.callee.name === "eval")
              context.report({ node, messageId: "forbidden" });
          },
          Identifier(node) {
            if (node.name === "eval") context.report({ node, messageId: "forbidden" });
          },
        };
      },
    },
    "no-literal-user-text-in-jsx": {
      meta: {
        type: "problem",
        schema: [],
        messages: { forbidden: "Use the translated i18n resource for user-facing JSX text." },
      },
      create(context) {
        if (/\.(?:test|spec)\.[jt]sx?$/.test(normalizedPath(context))) return {};
        return {
          JSXText(node) {
            if (node.value.trim()) context.report({ node, messageId: "forbidden" });
          },
          JSXExpressionContainer(node) {
            const expression = node.expression;
            if (
              expression.type === "Literal" &&
              typeof expression.value === "string" &&
              expression.value.trim()
            )
              context.report({ node, messageId: "forbidden" });
            if (
              expression.type === "TemplateLiteral" &&
              expression.expressions.length === 0 &&
              expression.quasis[0]?.value.raw.trim()
            )
              context.report({ node, messageId: "forbidden" });
          },
          JSXAttribute(node) {
            const name = node.name.type === "JSXIdentifier" ? node.name.name : "";
            if (!userFacingAttributes.has(name) || technicalAttributes.has(name)) return;
            if (node.value?.type === "Literal" && typeof node.value.value === "string")
              context.report({ node, messageId: "forbidden" });
            if (
              node.value?.type === "JSXExpressionContainer" &&
              node.value.expression.type === "Literal" &&
              typeof node.value.expression.value === "string"
            )
              context.report({ node, messageId: "forbidden" });
            if (
              node.value?.type === "JSXExpressionContainer" &&
              node.value.expression.type === "TemplateLiteral" &&
              node.value.expression.expressions.length === 0
            )
              context.report({ node, messageId: "forbidden" });
          },
        };
      },
    },
    "feature-public-imports-only": {
      meta: {
        type: "problem",
        schema: [],
        messages: { forbidden: "Import another feature only through its public index." },
      },
      create(context) {
        const check = (node) => {
          if (hasForbiddenFeatureImport(context.filename, node.source.value))
            context.report({ node, messageId: "forbidden" });
        };
        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: (node) => {
            if (node.source) check(node);
          },
        };
      },
    },
  },
};

export default plugin;
