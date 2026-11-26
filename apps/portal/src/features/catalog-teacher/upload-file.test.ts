import { describe, expect, it } from "vitest";
import { requestLessonUploadTicket } from "@noldg/api/endpoints/catalog";
import { uploadFile } from "@noldg/api/uploads";

describe("direct form-post uploads", () => {
  it("sends a file and returns only its opaque upload token", async () => {
    const ticket = await requestLessonUploadTicket("course-general-secondary-1", {
      kind: "video",
      name: "lesson.mp4",
    });
    const result = await uploadFile(
      ticket,
      new File(["video"], "lesson.mp4", { type: "video/mp4" }),
    );
    expect(result).toEqual({ uploadToken: "mock-upload-token" });
  });

  it("maps provider rejection without exposing its response body", async () => {
    const ticket = await requestLessonUploadTicket("course-general-secondary-1", {
      kind: "video",
      name: "failure-lesson.mp4",
    });
    await expect(
      uploadFile(ticket, new File(["video"], "failure-lesson.mp4")),
    ).rejects.toMatchObject({
      code: "UPLOAD_REJECTED",
      status: 400,
      message_key: "errors:uploadRejected",
    });
  });

  it("maps expired provider tickets for the upload hook to refresh", async () => {
    const ticket = await requestLessonUploadTicket("course-general-secondary-1", {
      kind: "video",
      name: "expired-ticket.mp4",
    });
    await expect(
      uploadFile(ticket, new File(["video"], "expired-ticket.mp4")),
    ).rejects.toMatchObject({
      code: "UPLOAD_EXPIRED",
      status: 410,
    });
  });

  it("normalizes provider network failures", async () => {
    const ticket = await requestLessonUploadTicket("course-general-secondary-1", {
      kind: "video",
      name: "network-failure-video.mp4",
    });
    await expect(
      uploadFile(ticket, new File(["video"], "network-failure-video.mp4")),
    ).rejects.toMatchObject({
      code: "UPLOAD_NETWORK_FAILED",
      message_key: "errors:networkError",
    });
  });

  it("returns a normalized cancellation for an aborted signal", async () => {
    const ticket = await requestLessonUploadTicket("course-general-secondary-1", {
      kind: "video",
      name: "lesson.mp4",
    });
    const controller = new AbortController();
    controller.abort();
    await expect(
      uploadFile(ticket, new File([], "lesson.mp4"), { signal: controller.signal }),
    ).rejects.toMatchObject({
      code: "ABORTED",
      message_key: "errors:requestCancelled",
    });
  });

  it("rejects reserved resumable tickets until the tus transport is implemented", async () => {
    await expect(
      uploadFile(
        {
          method: "tus",
          url: "https://uploads.example.test/tus",
          headers: {},
          uploadToken: "opaque",
        },
        new File([], "lesson.mp4"),
      ),
    ).rejects.toMatchObject({ code: "UPLOAD_METHOD_UNSUPPORTED", status: 501 });
  });
});
