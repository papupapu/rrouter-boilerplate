import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import { beasties } from "vite-plugin-beasties";

const beastiesConfig = beasties({
  preload: "swap",
  compress: true,
  external: true,
  fonts: true,
} as any);

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    {
      ...beastiesConfig,
      apply: "build",
    } as any,
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: "dist/stats.html",
    }),
  ],
});
