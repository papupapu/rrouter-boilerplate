import type { Plugin, ResolvedConfig } from "vite";
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Phase 3: Advanced CSS Splitting via Separate Compilation
 *
 * This plugin compiles non-critical CSS SEPARATELY after the main build.
 *
 * Process:
 * 1. Main build compiles app/styles/index.scss → root-*.css (critical only)
 * 2. After build, compile app/styles/non-critical-entry.scss separately
 * 3. Place it in build/client/assets as non-critical-*.css
 * 4. beasties-processor handles both files correctly
 */

export function cssCompiledSeparatelyPlugin(): Plugin {
  let config: ResolvedConfig | null = null;

  return {
    name: "css-compiled-separately",

    apply: "build",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async writeBundle() {
      try {
        if (!config) return;

        const projectRoot = process.cwd();
        const buildAssetsPath = path.join(projectRoot, "build/client/assets");
        const nonCriticalScssPath = path.join(
          projectRoot,
          "app/styles/non-critical-entry.scss"
        );

        // Check if non-critical entry exists
        try {
          await fs.access(nonCriticalScssPath);
        } catch {
          console.log(
            "[CSS Compiled Separately] ℹ️  Non-critical entry not found, skipping"
          );
          return;
        }

        // Use Sass CLI to compile non-critical CSS separately
        // Note: This requires sass to be installed globally or via node_modules
        const sassPath = path.join(projectRoot, "node_modules/.bin/sass");
        const appPath = path.join(projectRoot, "app");

        try {
          // Run sass compiler for non-critical styles
          // Include --load-path to resolve imports relative to app/ directory
          const output = execSync(
            `${sassPath} "${nonCriticalScssPath}" --no-source-map --style=compressed --load-path="${appPath}"`,
            { encoding: "utf-8" }
          );

          if (!output || output.length === 0) {
            console.log(
              "[CSS Compiled Separately] ⚠️  No output from non-critical SCSS compilation"
            );
            return;
          }

          // Generate hash-based filename
          const hash = Buffer.from(output).toString("base64").substring(0, 8);
          const nonCriticalFileName = `non-critical-${hash}.css`;
          const outputPath = path.join(buildAssetsPath, nonCriticalFileName);

          // Write non-critical CSS
          await fs.writeFile(outputPath, output, "utf-8");

          const sizKB = (output.length / 1024).toFixed(2);
          console.log(`[CSS Compiled Separately] ✅ Compiled non-critical CSS`);
          console.log(
            `[CSS Compiled Separately]    File: ${nonCriticalFileName}`
          );
          console.log(`[CSS Compiled Separately]    Size: ${sizKB} KB`);
        } catch {
          console.warn(
            "[CSS Compiled Separately] ⚠️  Failed to compile non-critical CSS"
          );
          console.warn(
            `[CSS Compiled Separately] This usually means the content is empty or sass failed`
          );
        }
      } catch {
        console.error(
          "[CSS Compiled Separately] ❌ Unexpected error in plugin"
        );
      }
    },
  };
}
