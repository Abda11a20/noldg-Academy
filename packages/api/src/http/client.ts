import { z, type ZodType } from "zod";
import {
  AUTH_LOGOUT_EVENT,
  HTTP_DEFAULT_TIMEOUT_MS,
  HTTP_REFRESH_PATH,
  HTTP_REFRESH_TIMEOUT_MS,
  HTTP_STATUS,
} from "../constants/http";
import { tokenStore, setRefreshHandler } from "../auth/token-store";
import { createAuthHeaders } from "../auth/header-strategy";
import { AppError, normalizeAppError } from "../errors/app-error";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
const refreshResponseSchema = z.object({ accessToken: z.string().min(1) });
let refreshFlight: Promise<string | null> | undefined;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
}

function combineSignals(signal: AbortSignal | null | undefined, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

function createRequestUrl(path: string): string {
  return new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`).toString();
}

function signalLogout(): void {
  tokenStore.clear();
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshFlight) {
    refreshFlight = tokenStore.refresh().finally(() => {
      refreshFlight = undefined;
    });
  }
  return refreshFlight;
}

async function retryAfterUnauthorized(status: number, retried: boolean): Promise<boolean> {
  if (status !== HTTP_STATUS.unauthorized || retried) return false;
  const refreshedToken = await refreshAccessToken();
  if (refreshedToken) return true;
  signalLogout();
  return false;
}

function validateResponse<T>(response: Response, schema: ZodType<T>, body: unknown): T {
  if (!response.ok) throw normalizeAppError(body, response.status);
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  throw new AppError({
    code: "RESPONSE_VALIDATION_FAILED",
    status: HTTP_STATUS.badGateway,
    message_key: "errors:invalidResponse",
    details: parsed.error.issues,
  });
}

setRefreshHandler(async () => {
  try {
    const response = await fetch(createRequestUrl(HTTP_REFRESH_PATH), {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json", "content-type": "application/json" },
      signal: AbortSignal.timeout(HTTP_REFRESH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const parsed = refreshResponseSchema.safeParse(await readJson(response));
    if (!parsed.success) return null;
    tokenStore.setSession({ accessToken: parsed.data.accessToken });
    return parsed.data.accessToken;
  } catch {
    return null;
  }
});

async function executeRequest<T>(
  path: string,
  schema: ZodType<T>,
  options: RequestOptions,
  retried: boolean,
): Promise<T> {
  const { timeoutMs, body: requestBody, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  const accessToken = tokenStore.getAccessToken();
  if (accessToken) {
    for (const [key, value] of Object.entries(createAuthHeaders(accessToken)))
      headers.set(key, value);
  }

  try {
    const response = await fetch(createRequestUrl(path), {
      ...requestOptions,
      ...(requestBody === undefined ? {} : { body: JSON.stringify(requestBody) }),
      headers,
      signal: combineSignals(options.signal, timeoutMs ?? HTTP_DEFAULT_TIMEOUT_MS),
    });
    const body = await readJson(response);
    if (await retryAfterUnauthorized(response.status, retried))
      return executeRequest(path, schema, options, true);
    return validateResponse(response, schema, body);
  } catch (error) {
    throw normalizeAppError(error);
  }
}

/** Sends a JSON request, validates its response, and normalizes transport and server errors. */
export function request<T>(
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  return executeRequest(path, schema, options, false);
}
