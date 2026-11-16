import { ErrorEnvelopeSchema } from "../contracts/common";
import { HTTP_STATUS } from "../constants/http";

export interface AppErrorShape {
  code: string;
  status: number;
  message_key: string;
  details?: unknown;
}

/** Centralized, user-safe API error with a translation key instead of backend text. */
export class AppError extends Error implements AppErrorShape {
  readonly code: string;
  readonly status: number;
  readonly message_key: string;
  readonly details?: unknown;

  constructor(error: AppErrorShape) {
    super(error.message_key);
    this.name = "AppError";
    this.code = error.code;
    this.status = error.status;
    this.message_key = error.message_key;
    if (error.details !== undefined) this.details = error.details;
  }
}

function isErrorNamed(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name;
}

function fromEnvelope(error: unknown, status: number): AppError | null {
  const envelope = ErrorEnvelopeSchema.safeParse(error);
  if (!envelope.success || status < HTTP_STATUS.badRequest) return null;
  return new AppError({
    code: envelope.data.code ?? "HTTP_ERROR",
    status,
    message_key: "errors:requestFailed",
    ...(envelope.data.details === undefined ? {} : { details: envelope.data.details }),
  });
}

/** Converts HTTP and transport failures into the shared AppError shape. */
export function normalizeAppError(
  error: unknown,
  status: number = HTTP_STATUS.noResponse,
): AppError {
  if (error instanceof AppError) return error;
  if (isErrorNamed(error, "TimeoutError")) {
    return new AppError({
      code: "TIMEOUT",
      status: HTTP_STATUS.requestTimeout,
      message_key: "errors:requestTimeout",
    });
  }
  if (isErrorNamed(error, "AbortError")) {
    return new AppError({
      code: "ABORTED",
      status: HTTP_STATUS.noResponse,
      message_key: "errors:requestCancelled",
    });
  }
  const envelopeError = fromEnvelope(error, status);
  if (envelopeError) return envelopeError;
  return new AppError({
    code: status === HTTP_STATUS.noResponse ? "NETWORK_ERROR" : "HTTP_ERROR",
    status,
    message_key: status === HTTP_STATUS.noResponse ? "errors:networkError" : "errors:requestFailed",
  });
}
