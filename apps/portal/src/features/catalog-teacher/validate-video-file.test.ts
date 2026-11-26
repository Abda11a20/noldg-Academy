import { describe, expect, it } from "vitest";
import { DEFAULT_UPLOAD_LIMITS } from "./constants";
import { validateVideoFile } from "./validate-video-file";

describe("video file validation", () => {
  it("accepts a supported video before requesting an upload ticket", () => {
    const file = new File([], "lesson.mp4", { type: "video/mp4" });
    expect(validateVideoFile(file)).toBeUndefined();
  });

  it("rejects unsupported types and files above the configured size", () => {
    const unsupported = new File([], "lesson.txt", { type: "text/plain" });
    const tooLarge = new File([], "lesson.mp4", { type: "video/mp4" });
    Object.defineProperty(tooLarge, "size", { value: DEFAULT_UPLOAD_LIMITS.videoBytes + 1 });
    expect(validateVideoFile(unsupported)).toBe("type");
    expect(validateVideoFile(tooLarge)).toBe("size");
  });
});
