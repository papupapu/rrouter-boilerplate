import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import { beasties } from "vite-plugin-beasties";

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    beasties({
      apply: "build",
      preload: "swap",
      compress: true,
      external: true,
      fonts: true,
    }),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: "dist/stats.html",
    }),
  ],
});
