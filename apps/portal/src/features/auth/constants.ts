export const AUTH_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const AUTH_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const AUTH_BIO_MAX_LENGTH = 1000;
export const AUTH_OTP_COOLDOWN_SECONDS = 60;
export const AUTH_COOLDOWN_TICK_MS = 1000;

const AUTH_IMAGE_MIME_TYPES = new Set(AUTH_IMAGE_ACCEPT.split(","));
const MAX_AUTH_IMAGE_FILENAME_LENGTH = 255;

/** Checks teacher application photo MIME type, non-empty size, and filename length.
 * @param file Selected browser file.
 */
export function isValidAuthImageFile(file: File): boolean {
  return (
    AUTH_IMAGE_MIME_TYPES.has(file.type) &&
    file.size > 0 &&
    file.size <= AUTH_IMAGE_MAX_BYTES &&
    file.name.length > 0 &&
    file.name.length <= MAX_AUTH_IMAGE_FILENAME_LENGTH
  );
}
