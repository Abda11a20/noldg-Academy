import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadFile } from "../uploads/uploadFile";
import type { UploadTicket } from "../contracts/catalog";

class FakeXmlHttpRequest {
  static nextStatus = 200;
  static nextResponseText = "";
  upload = new EventTarget();
  status = 0;
  responseText = "";
  timeout = 0;
  body?: FormData;
  private listeners = new Map<string, EventListener[]>();
  open(): void {}
  send(body: FormData): void {
    this.body = body;
    this.status = FakeXmlHttpRequest.nextStatus;
    this.responseText = FakeXmlHttpRequest.nextResponseText;
    const progress = Object.assign(new Event("progress"), {
      lengthComputable: true,
      loaded: 5,
      total: 10,
    });
    this.upload.dispatchEvent(progress);
    queueMicrotask(() => this.emit("load"));
  }
  abort(): void {
    this.emit("abort");
  }
  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener(new Event(type));
  }
}

const formPostTicket: UploadTicket = {
  method: "form-post",
  url: "https://uploads.example.test/form",
  fields: { signature: "signed-value" },
  uploadToken: "opaque-upload-token",
};

afterEach(() => {
  FakeXmlHttpRequest.nextStatus = 200;
  FakeXmlHttpRequest.nextResponseText = "";
  vi.unstubAllGlobals();
});

describe("uploadFile", () => {
  it("sends ticket fields and file, returning progress and the opaque upload token", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXmlHttpRequest);
    const onProgress = vi.fn();
    const result = await uploadFile(formPostTicket, new File(["data"], "lesson.mp4"), {
      onProgress,
    });
    expect(result.uploadToken).toBe("opaque-upload-token");
    expect(onProgress).toHaveBeenCalledWith({ loaded: 5, total: 10 });
  });

  it("maps rejected and expired provider responses", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXmlHttpRequest);
    FakeXmlHttpRequest.nextStatus = 400;
    await expect(
      uploadFile(formPostTicket, new File(["data"], "lesson.mp4")),
    ).rejects.toMatchObject({ code: "UPLOAD_REJECTED" });
    FakeXmlHttpRequest.nextStatus = 400;
    FakeXmlHttpRequest.nextResponseText =
      '{"error":{"message":"Stale request - expired timestamp"}}';
    await expect(
      uploadFile(formPostTicket, new File(["data"], "lesson.mp4")),
    ).rejects.toMatchObject({ code: "UPLOAD_EXPIRED" });
    FakeXmlHttpRequest.nextStatus = 410;
    FakeXmlHttpRequest.nextResponseText = "";
    await expect(
      uploadFile(formPostTicket, new File(["data"], "lesson.mp4")),
    ).rejects.toMatchObject({ code: "UPLOAD_EXPIRED" });
  });

  it("rejects reserved tus tickets and already-aborted signals", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXmlHttpRequest);
    const tusTicket: UploadTicket = {
      method: "tus",
      url: "https://uploads.example.test/tus",
      headers: {},
      uploadToken: "opaque-upload-token",
    };
    await expect(uploadFile(tusTicket, new File(["data"], "lesson.mp4"))).rejects.toMatchObject({
      status: 501,
    });
    const controller = new AbortController();
    controller.abort();
    await expect(
      uploadFile(formPostTicket, new File(["data"], "lesson.mp4"), { signal: controller.signal }),
    ).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("maps provider error and timeout events", async () => {
    vi.stubGlobal(
      "XMLHttpRequest",
      class extends FakeXmlHttpRequest {
        override send(): void {
          queueMicrotask(() => this.emit("error"));
        }
      },
    );
    await expect(
      uploadFile(formPostTicket, new File(["data"], "lesson.mp4")),
    ).rejects.toMatchObject({ code: "UPLOAD_NETWORK_FAILED" });
    vi.stubGlobal(
      "XMLHttpRequest",
      class extends FakeXmlHttpRequest {
        override send(): void {
          queueMicrotask(() => this.emit("timeout"));
        }
      },
    );
    await expect(
      uploadFile(formPostTicket, new File(["data"], "lesson.mp4")),
    ).rejects.toMatchObject({ code: "UPLOAD_TIMEOUT" });
  });

  it("maps abort and removes the abort listener after completion", async () => {
    vi.stubGlobal(
      "XMLHttpRequest",
      class extends FakeXmlHttpRequest {
        override send(): void {
          queueMicrotask(() => this.abort());
        }
      },
    );
    const controller = new AbortController();
    await expect(
      uploadFile(formPostTicket, new File(["data"], "lesson.mp4"), { signal: controller.signal }),
    ).rejects.toMatchObject({ code: "ABORTED" });
  });
});
