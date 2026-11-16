export type ApiMode = "mock" | "live";

/** API transport mode selected by the public Vite configuration. */
export const apiMode: ApiMode = import.meta.env.VITE_API_MODE === "live" ? "live" : "mock";
