import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import { beasties } from "vite-plugin-beasties";
import { criticalCssScanner } from "./vite-plugins/critical-css-scanner";
import { cssCompiledSeparatelyPlugin } from "./vite-plugins/css-compiled-separately";
import path from "path";

const beastiesConfig = beasties();

export default defineConfig(() => ({
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
  css: {
    preprocessorOptions: {
      scss: {
        // Configure Sass to resolve imports from app/ directory
        // This allows @use "styles/abstracts/colors" to work from any component
        loadPaths: [path.resolve(__dirname, "app")],
        additionalData: `
          // In dev mode, ensure both entry points are processed
          // Critical is imported in _index.scss
          // Non-critical is imported separately for HMR support
        `,
      },
    },
  },
}));
