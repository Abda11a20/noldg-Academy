import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

function stripMockWorkerPlugin(): PluginOption {
  let outDir = "dist";
  return {
    name: "strip-mock-service-worker",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      if (process.env.VITE_E2E_MOCKS === "true") return;
      await rm(resolve(process.cwd(), outDir, "mockServiceWorker.js"), { force: true });
    },
  };
}

const analysisPlugin =
  process.env.ANALYZE === "true"
    ? [
        visualizer({
          filename: resolve(process.cwd(), "../../.turbo/cache/f6-bundle-analysis.html"),
          gzipSize: true,
          open: false,
          template: "treemap",
        }) as PluginOption,
      ]
    : [];

export default defineConfig({
  plugins: [react(), tailwindcss(), stripMockWorkerPlugin(), ...analysisPlugin],
  build: { manifest: true },
  server: { port: 5173 },
});
