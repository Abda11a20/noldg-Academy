/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_MODE?: "mock" | "live";
  readonly VITE_AUTH_STORAGE?: "memory" | "session";
  readonly VITE_AUTH_HEADER_STRATEGY?: "target" | "legacy";
  readonly VITE_AUTH_CAP_EMAIL_OTP?: "true" | "false";
  readonly VITE_AUTH_CAP_REFRESH_COOKIE?: "true" | "false";
  readonly VITE_AUTH_CAP_STUDENT_PROFILE_FIELDS?: "true" | "false";
  readonly VITE_AUTH_CAP_PUBLIC_CATALOG?: "true" | "false";
  readonly VITE_AUTH_CAP_DEVICE_CHANGE_REQUEST?: "true" | "false";
}
