import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), "../dist/_headers");

/** Creates static hosting headers with a restrictive CSP for the supplied API origin.
 * @param apiOrigin Public API origin; a path, query, or fragment is not accepted.
 */
export function createHeaders(apiOrigin) {
  if (typeof apiOrigin !== "string" || apiOrigin.length === 0) {
    throw new Error("VITE_API_ORIGIN is required for a production build.");
  }
  const parsedOrigin = new globalThis.URL(apiOrigin);
  if (parsedOrigin.protocol !== "https:" && parsedOrigin.protocol !== "http:") {
    throw new Error("VITE_API_ORIGIN must use HTTP or HTTPS.");
  }
  if (parsedOrigin.origin !== apiOrigin.replace(/\/$/, "")) {
    throw new Error("VITE_API_ORIGIN must be an origin without a path or query.");
  }

  return `/*\n  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${parsedOrigin.origin}; media-src 'self' https://res.cloudinary.com; worker-src 'self'; upgrade-insecure-requests\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Cross-Origin-Opener-Policy: same-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`;
}

if (globalThis.process.argv[1] === fileURLToPath(import.meta.url)) {
  const headers = createHeaders(globalThis.process.env.VITE_API_ORIGIN);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, headers, "utf8");
}
