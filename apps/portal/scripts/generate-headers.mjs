import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), "../dist/_headers");

function parseHttpsOrigins(value, envName, { rejectWildcards = false } = {}) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${envName} is required for a production build.`);
  }
  return value.split(",").map((raw) => {
    const origin = raw.trim();
    if (rejectWildcards && origin.includes("*")) {
      throw new Error(`${envName} must not contain wildcard hosts.`);
    }
    const parsed = new globalThis.URL(origin);
    if (parsed.protocol !== "https:" || parsed.origin !== origin) {
      throw new Error(`${envName} must contain HTTPS origins without paths or queries.`);
    }
    return parsed.origin;
  });
}

/** Creates static hosting headers with a restrictive CSP for the supplied API origin.
 * @param apiOrigin Public API origin; a path, query, or fragment is not accepted.
 * @param uploadOriginsValue Comma-separated HTTPS upload origins.
 * @param imageOriginsValue Comma-separated HTTPS image origins.
 * @param mediaOriginsValue Optional comma-separated HTTPS media playback origins.
 */
export function createHeaders(apiOrigin, uploadOriginsValue, imageOriginsValue, mediaOriginsValue) {
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
  const parsedUploadOrigins = parseHttpsOrigins(uploadOriginsValue, "VITE_UPLOAD_ORIGINS");
  const parsedImageOrigins = parseHttpsOrigins(imageOriginsValue, "VITE_IMAGE_ORIGINS", {
    rejectWildcards: true,
  });
  const parsedMediaOrigins =
    typeof mediaOriginsValue === "string" && mediaOriginsValue.trim().length > 0
      ? parseHttpsOrigins(mediaOriginsValue, "VITE_MEDIA_ORIGINS")
      : [];

  const uploadSources = parsedUploadOrigins.join(" ");
  const imageSources = parsedImageOrigins.join(" ");
  const mediaSources = [...new Set([...parsedUploadOrigins, ...parsedMediaOrigins])].join(" ");
  return `/*\n  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: ${imageSources}; font-src 'self'; connect-src 'self' ${parsedOrigin.origin} ${uploadSources}; media-src 'self' ${mediaSources}; worker-src 'self'; upgrade-insecure-requests\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Cross-Origin-Opener-Policy: same-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`;
}

if (globalThis.process.argv[1] === fileURLToPath(import.meta.url)) {
  const headers = createHeaders(
    globalThis.process.env.VITE_API_ORIGIN,
    globalThis.process.env.VITE_UPLOAD_ORIGINS,
    globalThis.process.env.VITE_IMAGE_ORIGINS,
    globalThis.process.env.VITE_MEDIA_ORIGINS,
  );
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, headers, "utf8");
}
