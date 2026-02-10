import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Dynamic reporter selection based on VITEST_REPORTER_MODE env var
 * - 'minimal' (default): dot reporter (one dot per test) for CI/pre-commit
 * - 'verbose': detailed output with HTML report
 * - 'coverage': default reporter for coverage analysis
 */
function getReporter(): string | string[] {
  const mode = process.env.VITEST_REPORTER_MODE || "minimal";

  switch (mode) {
    case "verbose":
      return ["verbose", "html"];
    case "coverage":
      return ["default"];
    case "minimal":
    default:
      return ["dot"];
  }
}

/**
 * Output file configuration - only for verbose mode
 */
function getOutputFile() {
  const mode = process.env.VITEST_REPORTER_MODE || "minimal";

  if (mode === "verbose") {
    return {
      html: "./test-results/index.html",
    };
  }

  return undefined;
}

/**
 * Check if running in minimal mode to silence stdout
 */
function isMinimalMode() {
  const mode = process.env.VITEST_REPORTER_MODE || "minimal";
  return mode === "minimal";
}

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "build"],
    // Dynamic reporter based on VITEST_REPORTER_MODE env var
    reporters: getReporter(),
    outputFile: getOutputFile(),
    // Silence stdout in minimal mode (don't show console.log output)
    silent: isMinimalMode(),
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["app/services/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/node_modules/**",
        "**/dist/**",
      ],
    },
  },
  resolve: {
    alias: {
      "~": "/app",
    },
  },
});
