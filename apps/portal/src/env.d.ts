/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_MODE?: "mock" | "live";
  readonly VITE_AUTH_STORAGE?: "memory" | "session";
  readonly VITE_AUTH_HEADER_STRATEGY?: "target" | "legacy";
}
