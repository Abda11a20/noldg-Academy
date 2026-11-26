import { DEFAULT_UPLOAD_LIMITS } from "./constants";
import { VIDEO_ACCEPTED_TYPES } from "./upload-constants";

export type VideoValidationFailure = "type" | "size";

/** Checks video type and size before asking the backend to sign an upload.
 * @param file Browser file selected by the teacher.
 * @returns A validation reason or undefined when acceptable.
 */
export function validateVideoFile(file: File): VideoValidationFailure | undefined {
  if (!VIDEO_ACCEPTED_TYPES.some((type) => type === file.type)) return "type";
  if (file.size > DEFAULT_UPLOAD_LIMITS.videoBytes) return "size";
  return undefined;
}
