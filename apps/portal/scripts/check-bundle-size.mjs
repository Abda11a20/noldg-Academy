import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const REPOSITORY_DIRECTORY = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const PORTAL_DIST_DIRECTORY = resolve(REPOSITORY_DIRECTORY, "apps/portal/dist");
const MANIFEST_PATH = resolve(PORTAL_DIST_DIRECTORY, ".vite/manifest.json");
const BASELINE_PATH = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "bundle-size-baseline.json",
);
const HTML_ENTRY_KEY = "index.html";
const INITIAL_ROUTE_KEY = "src/app/layouts/AuthLayout.tsx";
const STARTUP_KEY = "src/startPortal.tsx";
const LOGIN_ROUTE_KEY = "src/features/auth/pages/LoginPage.tsx";
const LOGIN_EXCLUDED_ROUTE_KEYS = [
  "src/features/auth/pages/RegisterChoicePage.tsx",
  "src/features/auth/pages/StudentRegistrationPage.tsx",
  "src/features/auth/pages/TeacherRegistrationPage.tsx",
];
const LOGIN_EXCLUDED_CHUNK_PATTERNS = [
  /RegisterChoicePage-/,
  /StudentRegistrationPage-/,
  /TeacherRegistrationPage-/,
  /CatalogSystemSelect-/,
];
const MAX_LAZY_ROUTE_GZIP_BYTES = 80_000;
const MAX_INITIAL_GZIP_BYTES = 250_000;
const MAX_INITIAL_GROWTH_GZIP_BYTES = 2_000;
const LARGEST_ROUTE_CHUNK_COUNT = 5;

function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    throw new Error("Production manifest not found; run the portal production build first.");
  }
}

function readInitialRouteBaseline() {
  try {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
    if (
      !Number.isSafeInteger(baseline.initialRouteGzipBytes) ||
      baseline.initialRouteGzipBytes <= 0
    )
      throw new Error("The initial-route baseline must contain a positive integer byte count.");
    return baseline.initialRouteGzipBytes;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Could not read a valid initial-route baseline: ${error.message}`
        : "Could not read a valid initial-route baseline.",
    );
  }
}

function resolveAsset(file) {
  const assetPath = resolve(PORTAL_DIST_DIRECTORY, file);
  if (!assetPath.startsWith(PORTAL_DIST_DIRECTORY + sep)) {
    throw new Error(`Manifest asset escapes the portal build directory: ${file}`);
  }
  return assetPath;
}

function compressedSize(file) {
  return gzipSync(readFileSync(resolveAsset(file))).byteLength;
}

function collectStaticScripts(manifest, entryKey, scripts = new Set()) {
  const chunk = manifest[entryKey];
  if (!chunk || scripts.has(chunk.file)) return scripts;
  if (chunk.file.endsWith(".js")) scripts.add(chunk.file);
  for (const importedKey of chunk.imports ?? []) {
    collectStaticScripts(manifest, importedKey, scripts);
  }
  return scripts;
}

function collectRouteScripts(manifest, routeKey, scripts = new Set()) {
  const chunk = manifest[routeKey];
  if (!chunk || scripts.has(chunk.file)) return scripts;
  collectStaticScripts(manifest, routeKey, scripts);
  for (const dynamicKey of chunk.dynamicImports ?? []) {
    collectRouteScripts(manifest, dynamicKey, scripts);
  }
  return scripts;
}

function lazyChunks(manifest) {
  return Object.entries(manifest)
    .filter(
      ([key, chunk]) =>
        key !== STARTUP_KEY &&
        chunk.isDynamicEntry === true &&
        (key.startsWith("src/app/layouts/") ||
          key.startsWith("src/pages/") ||
          key.startsWith("src/features/") ||
          key.includes("/pages/")),
    )
    .map(([key, chunk]) => ({ key, file: chunk.file, gzipBytes: compressedSize(chunk.file) }))
    .sort((left, right) => right.gzipBytes - left.gzipBytes);
}

function formatKilobytes(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB gzip`;
}

const manifest = readManifest();
const entry = manifest[HTML_ENTRY_KEY];
if (!entry) throw new Error("Production manifest has no entry chunk.");
if (!manifest[INITIAL_ROUTE_KEY])
  throw new Error(`Initial route chunk missing: ${INITIAL_ROUTE_KEY}`);
if (!manifest[LOGIN_ROUTE_KEY]) throw new Error(`Login route chunk missing: ${LOGIN_ROUTE_KEY}`);

const entryGzipBytes = compressedSize(entry.file);
const mainAppGzipBytes = compressedSize(manifest[STARTUP_KEY].file);
const initialScripts = collectStaticScripts(manifest, HTML_ENTRY_KEY);
collectStaticScripts(manifest, STARTUP_KEY, initialScripts);
collectRouteScripts(manifest, INITIAL_ROUTE_KEY, initialScripts);
collectRouteScripts(manifest, LOGIN_ROUTE_KEY, initialScripts);
const loadedChunks = [...initialScripts].sort();
const initialGzipBytes = [...initialScripts].reduce(
  (total, file) => total + compressedSize(file),
  0,
);
const initialRouteBaselineGzipBytes = readInitialRouteBaseline();
const routes = lazyChunks(manifest);
const largestRoutes = routes.slice(0, LARGEST_ROUTE_CHUNK_COUNT);
process.stdout.write(`Portal entry: ${formatKilobytes(entryGzipBytes)}\n`);
process.stdout.write(`Main app chunk: ${formatKilobytes(mainAppGzipBytes)}\n`);
process.stdout.write(`Total initial JavaScript: ${formatKilobytes(initialGzipBytes)}\n`);
process.stdout.write(
  `Initial-route growth: ${formatKilobytes(initialGzipBytes - initialRouteBaselineGzipBytes)}; limit ${formatKilobytes(MAX_INITIAL_GROWTH_GZIP_BYTES)} over ${formatKilobytes(initialRouteBaselineGzipBytes)} baseline\n`,
);
process.stdout.write("JavaScript chunks loaded by /login:\n");
loadedChunks.forEach((file) => {
  process.stdout.write(`  ${file}: ${formatKilobytes(compressedSize(file))}\n`);
});
process.stdout.write("Largest lazy route chunks:\n");
largestRoutes.forEach(({ key, gzipBytes }) => {
  process.stdout.write(`  ${key}: ${formatKilobytes(gzipBytes)}\n`);
});

const violations = [];
if (initialGzipBytes > MAX_INITIAL_GZIP_BYTES)
  violations.push("initial JavaScript exceeds 250 kB gzip");
if (initialGzipBytes - initialRouteBaselineGzipBytes > MAX_INITIAL_GROWTH_GZIP_BYTES)
  violations.push("initial route grew by more than 2 kB gzip from its committed baseline");
LOGIN_EXCLUDED_ROUTE_KEYS.forEach((key) => {
  const chunk = manifest[key];
  if (chunk && initialScripts.has(chunk.file)) {
    violations.push(`/login loads an excluded registration route chunk: ${key}`);
  }
});
loadedChunks
  .filter((file) => LOGIN_EXCLUDED_CHUNK_PATTERNS.some((pattern) => pattern.test(file)))
  .forEach((file) => violations.push(`/login loads a registration-only chunk: ${file}`));
routes
  .filter(({ gzipBytes }) => gzipBytes > MAX_LAZY_ROUTE_GZIP_BYTES)
  .forEach(({ key, gzipBytes }) => {
    violations.push(`lazy route chunk ${key} exceeds 80 kB gzip (${formatKilobytes(gzipBytes)})`);
  });
if (violations.length) throw new Error(violations.join("; "));

process.stdout.write("Portal JavaScript budgets passed.\n");
