import { z, type ZodType } from "zod";
import {
  AUTH_LOGOUT_EVENT,
  API_BASE_URL,
  HTTP_DEFAULT_TIMEOUT_MS,
  HTTP_REFRESH_PATH,
  HTTP_REFRESH_TIMEOUT_MS,
  HTTP_STATUS,
} from "../constants/http";
import { tokenStore, setRefreshHandler } from "../auth/token-store";
import { createAuthHeaders } from "../auth/header-strategy";
import { AppError, normalizeAppError } from "../errors/app-error";
import { capabilities } from "../config/capabilities";

const refreshResponseSchema = z.object({ accessToken: z.string().min(1) });
let refreshFlight: Promise<string | null> | undefined;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  preserveSessionOnUnauthorized?: boolean;
}

function combineSignals(signal: AbortSignal | null | undefined, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

function createRequestUrl(path: string): string {
  return new URL(path.replace(/^\//, ""), `${API_BASE_URL.replace(/\/$/, "")}/`).toString();
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

async function retryAfterUnauthorized(
  status: number,
  retried: boolean,
  preserveSessionOnUnauthorized: boolean,
): Promise<boolean> {
  if (status !== HTTP_STATUS.unauthorized || retried || preserveSessionOnUnauthorized) return false;
  if (!tokenStore.getAccessToken()) return false;
  const refreshedToken = await refreshAccessToken();
  if (refreshedToken) return true;
  signalLogout();
  return false;
}

function buildRequestHeaders(requestBody: unknown, initialHeaders?: HeadersInit): Headers {
  const headers = new Headers(initialHeaders);
  headers.set("accept", "application/json");
  const isFormData = typeof FormData !== "undefined" && requestBody instanceof FormData;
  if (!isFormData && requestBody !== undefined) headers.set("content-type", "application/json");
  const accessToken = tokenStore.getAccessToken();
  if (accessToken) {
    for (const [key, value] of Object.entries(createAuthHeaders(accessToken)))
      headers.set(key, value);
  }
  return headers;
}

async function sendRequest(path: string, options: RequestOptions): Promise<Response> {
  const { timeoutMs, body: requestBody, ...requestOptions } = options;
  const isFormData = typeof FormData !== "undefined" && requestBody instanceof FormData;
  const headers = buildRequestHeaders(requestBody, options.headers);
  return fetch(createRequestUrl(path), {
    ...requestOptions,
    ...(requestBody === undefined
      ? {}
      : { body: isFormData ? requestBody : JSON.stringify(requestBody) }),
    credentials: capabilities.refreshCookie ? "include" : "same-origin",
    headers,
    signal: combineSignals(options.signal, timeoutMs ?? HTTP_DEFAULT_TIMEOUT_MS),
  });
}

function validateResponse<T>(response: Response, schema: ZodType<T>, body: unknown): T {
  if (!response.ok) {
    const error = normalizeAppError(body, response.status);
    const retryAfter = Number(response.headers.get("retry-after"));
    if (response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
      throw new AppError({
        ...error,
        details: {
          ...(typeof error.details === "object" && error.details ? error.details : {}),
          retryAfterSeconds: retryAfter,
        },
      });
    }
    throw error;
  }
  if (response.status === 204) return undefined as T;
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
  if (!capabilities.refreshCookie) return null;
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
  try {
    const response = await sendRequest(path, options);
    const body = await readJson(response);
    if (
      await retryAfterUnauthorized(
        response.status,
        retried,
        options.preserveSessionOnUnauthorized === true,
      )
    )
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
