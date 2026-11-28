export type ApiMode = "mock" | "live";

function resolveApiMode(): ApiMode {
  if (import.meta.env.VITE_API_MODE === "live") return "live";
  if (import.meta.env.VITE_API_MODE === "mock") return "mock";
  if (import.meta.env.PROD && import.meta.env.VITE_E2E_MOCKS !== "true") return "live";
  return "mock";
}

/** API transport mode selected by public Vite configuration; production builds default to live. */
export const apiMode: ApiMode = resolveApiMode();
