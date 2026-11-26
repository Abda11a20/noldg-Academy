import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

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
  plugins: [react(), tailwindcss(), ...analysisPlugin],
  build: { manifest: true },
  server: { port: 5173 },
});
