import { DEFAULT_UPLOAD_LIMITS } from "./constants";
import { VIDEO_ACCEPTED_TYPES } from "./upload-constants";

const MAX_UPLOAD_FILENAME_LENGTH = 255;

export type VideoValidationFailure = "type" | "size";

/** Checks video type, filename length, and non-empty size before asking the backend to sign an upload.
 * @param file Browser file selected by the teacher.
 * @returns A validation reason or undefined when acceptable.
 */
export function validateVideoFile(file: File): VideoValidationFailure | undefined {
  if (file.name.length === 0 || file.name.length > MAX_UPLOAD_FILENAME_LENGTH) return "type";
  if (!VIDEO_ACCEPTED_TYPES.some((type) => type === file.type)) return "type";
  if (file.size <= 0 || file.size > DEFAULT_UPLOAD_LIMITS.videoBytes) return "size";
  return undefined;
}
