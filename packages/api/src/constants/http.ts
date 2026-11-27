function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) return configured;
  const origin = import.meta.env.VITE_API_ORIGIN;
  if (origin) return `${origin.replace(/\/$/, "")}/api`;
  return "http://localhost:3000/api";
}

export const HTTP_DEFAULT_TIMEOUT_MS = 15_000;
export const HTTP_REFRESH_TIMEOUT_MS = 10_000;
export const HTTP_REFRESH_PATH = "/auth/refresh";
export const AUTH_LOGOUT_EVENT = "noldg:auth-logout";
export const API_BASE_URL = resolveApiBaseUrl();
export const HTTP_STATUS = {
  noResponse: 0,
  badRequest: 400,
  unauthorized: 401,
  requestTimeout: 408,
  badGateway: 502,
} as const;
