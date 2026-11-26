const INTERNAL_PATH_PREFIX = "/";
const EXTERNAL_PATH_PREFIX = "//";

/** Accepts only same-origin absolute paths and rejects protocol-relative or malformed destinations. @param value Query or history value to validate. */
export function sanitizeReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith(INTERNAL_PATH_PREFIX)) return null;
  if (
    value.startsWith(EXTERNAL_PATH_PREFIX) ||
    value.includes("\\") ||
    containsControlCharacter(value)
  ) {
    return null;
  }
  try {
    const parsed = new URL(value, "https://portal.invalid");
    if (parsed.origin !== "https://portal.invalid") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => character.charCodeAt(0) < 32);
}
