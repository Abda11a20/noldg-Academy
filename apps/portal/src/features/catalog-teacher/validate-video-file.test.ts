import { describe, expect, it } from "vitest";
import { DEFAULT_UPLOAD_LIMITS } from "./constants";
import { validateVideoFile } from "./validate-video-file";

describe("video file validation", () => {
  it("accepts a supported video before requesting an upload ticket", () => {
    const file = new File(["video-bytes"], "lesson.mp4", { type: "video/mp4" });
    expect(validateVideoFile(file)).toBeUndefined();
  });

  it("rejects unsupported types, empty files, oversized files, and overly long names", () => {
    const unsupported = new File(["bytes"], "lesson.txt", { type: "text/plain" });
    const empty = new File([], "lesson.mp4", { type: "video/mp4" });
    const tooLongName = new File(["bytes"], `${"a".repeat(252)}.mp4`, { type: "video/mp4" });
    const tooLarge = new File(["bytes"], "lesson.mp4", { type: "video/mp4" });
    Object.defineProperty(tooLarge, "size", { value: DEFAULT_UPLOAD_LIMITS.videoBytes + 1 });
    expect(validateVideoFile(unsupported)).toBe("type");
    expect(validateVideoFile(tooLongName)).toBe("type");
    expect(validateVideoFile(empty)).toBe("size");
    expect(validateVideoFile(tooLarge)).toBe("size");
  });
});
