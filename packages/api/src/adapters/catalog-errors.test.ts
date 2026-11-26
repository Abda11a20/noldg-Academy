import { describe, expect, it } from "vitest";
import { AppError } from "../errors/app-error";
import { adaptCourse, adaptLesson, adaptProduct, adaptUploadTicket } from "./catalog";

describe("catalog adapter errors", () => {
  it.each([
    ["course", () => adaptCourse({})],
    ["lesson", () => adaptLesson({})],
    ["product", () => adaptProduct({})],
    ["upload ticket", () => adaptUploadTicket({})],
  ])("normalizes invalid mock %s payloads", (_name, adapt) => {
    expect(adapt).toThrow(AppError);
    try {
      adapt();
    } catch (error) {
      expect(error).toMatchObject({
        code: "RESPONSE_VALIDATION_FAILED",
        status: 502,
        message_key: "errors:invalidResponse",
      });
    }
  });
});
