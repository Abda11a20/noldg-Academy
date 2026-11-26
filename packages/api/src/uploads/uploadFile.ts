import type { UploadTicket } from "../contracts/catalog";
import { AppError } from "../errors/app-error";

const HTTP_OK_MIN = 200;
const HTTP_OK_MAX = 299;
const HTTP_GONE = 410;
const UPLOAD_TIMEOUT_MS = 30 * 60 * 1000;

export interface UploadProgress {
  loaded: number;
  total: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export interface UploadResult {
  uploadToken: string;
}

function uploadError(code: string, messageKey: string, status = 0): AppError {
  return new AppError({ code, status, message_key: messageKey });
}

/** Sends a file directly to a signed form-post provider ticket and reports progress; tus tickets remain reserved for later. */
export function uploadFile(
  ticket: UploadTicket,
  file: File,
  { onProgress, signal }: UploadOptions = {},
): Promise<UploadResult> {
  if (ticket.method !== "form-post") {
    return Promise.reject(
      uploadError("UPLOAD_METHOD_UNSUPPORTED", "errors:capabilityUnavailable", 501),
    );
  }
  if (signal?.aborted) {
    return Promise.reject(uploadError("ABORTED", "errors:requestCancelled"));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    for (const [key, value] of Object.entries(ticket.fields)) body.append(key, value);
    body.append("file", file);
    xhr.open("POST", ticket.url);
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    const cleanup = () => signal?.removeEventListener("abort", abortUpload);
    const abortUpload = () => xhr.abort();
    signal?.addEventListener("abort", abortUpload, { once: true });
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress?.({ loaded: event.loaded, total: event.total });
    });
    xhr.addEventListener("load", () => {
      cleanup();
      if (xhr.status >= HTTP_OK_MIN && xhr.status <= HTTP_OK_MAX) {
        resolve({ uploadToken: ticket.uploadToken });
        return;
      }
      const expired = xhr.status === HTTP_GONE;
      reject(
        uploadError(
          expired ? "UPLOAD_EXPIRED" : "UPLOAD_REJECTED",
          expired ? "errors:uploadExpired" : "errors:uploadRejected",
          xhr.status,
        ),
      );
    });
    xhr.addEventListener("error", () => {
      cleanup();
      reject(uploadError("UPLOAD_NETWORK_FAILED", "errors:networkError"));
    });
    xhr.addEventListener("timeout", () => {
      cleanup();
      reject(uploadError("UPLOAD_TIMEOUT", "errors:requestTimeout", 408));
    });
    xhr.addEventListener("abort", () => {
      cleanup();
      reject(uploadError("ABORTED", "errors:requestCancelled"));
    });
    xhr.send(body);
  });
}
