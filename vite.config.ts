import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import { beasties } from "vite-plugin-beasties";
import { criticalCssScanner } from "./vite-plugins/critical-css-scanner";
import { cssCompiledSeparatelyPlugin } from "./vite-plugins/css-compiled-separately";

const beastiesConfig = beasties({
  preload: "swap",
  compress: true,
  external: true,
  fonts: true,
});

export default defineConfig({
  plugins: [
    criticalCssScanner(), // Run early for critical CSS marking
    reactRouter(),
    tsconfigPaths(),
    {
      ...beastiesConfig,
      apply: "build",
    },
    cssCompiledSeparatelyPlugin(), // Compile non-critical CSS separately after build
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: "dist/stats.html",
    }),
  ],
});
