import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const REPOSITORY_DIRECTORY = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const PORTAL_DIST_DIRECTORY = resolve(REPOSITORY_DIRECTORY, "apps/portal/dist");
const MANIFEST_PATH = resolve(PORTAL_DIST_DIRECTORY, ".vite/manifest.json");
const HTML_ENTRY_KEY = "index.html";
const INITIAL_ROUTE_KEY = "src/app/layouts/AuthLayout.tsx";
const STARTUP_KEY = "src/startPortal.tsx";
const LOGIN_FEATURE_KEY = "src/features/auth/index.ts";
const MAX_ENTRY_GZIP_BYTES = 150_000;
const MAX_INITIAL_GZIP_BYTES = 250_000;

function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    throw new Error("Production manifest not found; run the portal production build first.");
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

function formatKilobytes(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB gzip`;
}

const manifest = readManifest();
const entry = manifest[HTML_ENTRY_KEY];
if (!entry) throw new Error("Production manifest has no entry chunk.");
if (!manifest[INITIAL_ROUTE_KEY])
  throw new Error(`Initial route chunk missing: ${INITIAL_ROUTE_KEY}`);

const entryGzipBytes = compressedSize(entry.file);
const initialScripts = collectStaticScripts(manifest, HTML_ENTRY_KEY);
collectStaticScripts(manifest, STARTUP_KEY, initialScripts);
collectRouteScripts(manifest, INITIAL_ROUTE_KEY, initialScripts);
collectStaticScripts(manifest, LOGIN_FEATURE_KEY, initialScripts);
const initialGzipBytes = [...initialScripts].reduce(
  (total, file) => total + compressedSize(file),
  0,
);
process.stdout.write(`Initial entry: ${formatKilobytes(entryGzipBytes)}\n`);
process.stdout.write(`Total initial JavaScript: ${formatKilobytes(initialGzipBytes)}\n`);

const violations = [];
if (entryGzipBytes > MAX_ENTRY_GZIP_BYTES) violations.push("entry exceeds 150 kB gzip");
if (initialGzipBytes > MAX_INITIAL_GZIP_BYTES)
  violations.push("initial JavaScript exceeds 250 kB gzip");
if (violations.length) throw new Error(violations.join("; "));

process.stdout.write("Portal JavaScript budgets passed.\n");
