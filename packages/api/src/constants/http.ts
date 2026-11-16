export const HTTP_DEFAULT_TIMEOUT_MS = 15_000;
export const HTTP_REFRESH_TIMEOUT_MS = 10_000;
export const HTTP_REFRESH_PATH = "/auth/refresh";
export const AUTH_LOGOUT_EVENT = "noldg:auth-logout";
export const HTTP_STATUS = {
  noResponse: 0,
  badRequest: 400,
  unauthorized: 401,
  requestTimeout: 408,
  badGateway: 502,
} as const;
