import type { Plugin, ResolvedConfig } from "vite";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { watch } from "fs";

/**
 * Critical CSS Scanner Plugin - Phase 4 Auto-Detection Approach
 *
 * Automatically detects and imports:
 * 1. ALL design tokens from app/styles/abstracts/
 * 2. Components marked with @critical marker in app/components/
 *
 * Generated files (written to actual .scss files, not virtual):
 * - app/.internal/critical-css/_generated-critical.scss
 * - app/.internal/critical-css/_generated-non-critical.scss
 *
 * No templates needed - pure auto-generation from filesystem scanning.
 * Files are auto-generated at build time and never committed to git.
 *
 * Runs during both dev and build modes:
 * - Production builds: Scans and generates once
 * - Development mode: Scans on startup + watches for file changes (HMR support)
 */

interface GeneratedFiles {
  abstracts: string[];
  critical: string[];
  nonCritical: string[];
}

// Regex patterns for marker detection
const CRITICAL_FILE_MARKER = /^[\s/]*\/\*\s*@critical\s*\*\//m;

export function criticalCssScanner(): Plugin {
  let generatedFiles: GeneratedFiles = {
    abstracts: [],
    critical: [],
    nonCritical: [],
  };
  let appRoot = "";
  let internalCriticalDir = "";
  let config: ResolvedConfig | null = null;
  let fileWatcher: ReturnType<typeof watch> | null = null;
  let regenerateTimer: ReturnType<typeof setTimeout> | null = null;
  let server: any = null;

  // Helper to scan abstracts from app/styles/abstracts/
  async function scanAbstracts(abstractsDir: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(abstractsDir, { withFileTypes: true });
      const abstracts: string[] = [];

      for (const entry of entries) {
        // Include all .scss files except index.scss (which re-exports them)
        if (
          entry.isFile() &&
          entry.name.endsWith(".scss") &&
          entry.name !== "index.scss"
        ) {
          // Remove .scss extension for import paths
          const abstractName = entry.name.replace(/\.scss$/, "");
          abstracts.push(abstractName);
        }
      }

      return abstracts.sort(); // Sort for consistent output
    } catch {
      console.warn(
        `[Critical CSS Scanner] ⚠️  Failed to scan abstracts directory: ${abstractsDir}`
      );
      return [];
    }
  }

  // Helper to generate abstract imports
  function generateAbstractImports(abstracts: string[]): string {
    const lines = [
      "// ===================================",
      "// ABSTRACTS (Auto-detected)",
      "// ===================================",
    ];

    for (const abstract of abstracts) {
      lines.push(`@use "../../styles/abstracts/${abstract}";`);
    }

    return lines.join("\n");
  }

  // Helper to generate component imports
  function generateComponentImports(files: GeneratedFiles): string {
    const lines: string[] = [];

    if (files.critical.length > 0) {
      lines.push(
        "",
        "// ===================================",
        "// CRITICAL COMPONENTS (/* @critical */)",
        "// ==================================="
      );

      for (const component of files.critical) {
        const componentPath = component.replace(/\.scss$/, "");
        lines.push(`@use "../../${componentPath}";`);
      }
    }

    return lines.join("\n");
  }

  // Helper to generate non-critical component imports
  function generateNonCriticalComponentImports(files: GeneratedFiles): string {
    const lines: string[] = [];

    if (files.nonCritical.length > 0) {
      lines.push(
        "// ===================================",
        "// NON-CRITICAL COMPONENTS",
        "// ==================================="
      );

      for (const component of files.nonCritical) {
        const componentPath = component.replace(/\.scss$/, "");
        lines.push(`@use "../../${componentPath}";`);
      }
    } else {
      lines.push("// No non-critical components detected");
    }

    return lines.join("\n");
  }

  // Helper to regenerate files
  async function regenerateImports() {
    // Scan abstracts
    const abstractsDir = path.join(appRoot, "styles", "abstracts");
    generatedFiles.abstracts = await scanAbstracts(abstractsDir);

    // Scan components for markers
    const componentsData = await scanDirectory(appRoot);
    generatedFiles.critical = componentsData.critical;
    generatedFiles.nonCritical = componentsData.nonCritical;

    // Generate critical CSS file (abstracts + critical components)
    const criticalContent =
      "// AUTO-GENERATED - Do not edit manually\n" +
      `// Generated at: ${new Date().toISOString()}\n` +
      "// This file is regenerated on every yarn dev / yarn build\n\n" +
      generateAbstractImports(generatedFiles.abstracts) +
      generateComponentImports(generatedFiles) +
      "\n";

    // Generate non-critical CSS file (non-critical components only)
    const nonCriticalContent =
      "// AUTO-GENERATED - Do not edit manually\n" +
      `// Generated at: ${new Date().toISOString()}\n` +
      "// This file is regenerated on every yarn dev / yarn build\n\n" +
      generateNonCriticalComponentImports(generatedFiles) +
      "\n";

    // Ensure .internal/critical-css directory exists
    await fs.mkdir(internalCriticalDir, { recursive: true });

    // Write generated files
    await fs.writeFile(
      path.join(internalCriticalDir, "_generated-critical.scss"),
      criticalContent
    );
    await fs.writeFile(
      path.join(internalCriticalDir, "_generated-non-critical.scss"),
      nonCriticalContent
    );

    // Log results
    console.log(`[Critical CSS Scanner] ✅ Auto-generated critical CSS`);
    console.log(
      `[Critical CSS Scanner]    Abstracts: ${generatedFiles.abstracts.length} | Critical: ${generatedFiles.critical.length} | Non-critical: ${generatedFiles.nonCritical.length}\n`
    );

    if (generatedFiles.abstracts.length > 0) {
      console.log("[Critical CSS Scanner] 🎨 Design tokens:");
      generatedFiles.abstracts.forEach((token) => {
        console.log(`  ✓ ${token}`);
      });
      console.log("");
    }

    if (generatedFiles.critical.length > 0) {
      console.log("[Critical CSS Scanner] 📌 Critical components:");
      generatedFiles.critical.forEach((file) => {
        console.log(`  ✓ ${file}`);
      });
      console.log("");
    }

    if (generatedFiles.nonCritical.length > 0) {
      console.log("[Critical CSS Scanner] 📦 Non-critical components:");
      generatedFiles.nonCritical.forEach((file) => {
        console.log(`  ✓ ${file}`);
      });
      console.log("");
    }

    // Trigger HMR update to reload SCSS modules
    if (server && server.ws) {
      server.ws.send({
        type: "full",
        event: "full-reload",
        payload: { path: "*" },
      });
      console.log("[Critical CSS Scanner] 🔄 Triggered HMR reload");
    }
  }

  return {
    name: "critical-css-scanner",

    async config() {
      // Determine paths
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      appRoot = path.resolve(__dirname, "..", "app");
      internalCriticalDir = path.resolve(appRoot, ".internal", "critical-css");

      console.log(
        "[Critical CSS Scanner] 🔍 Scanning for abstracts and markers in:",
        appRoot
      );

      // Initial generation
      await regenerateImports();
    },

    // Set up file watcher in dev mode and capture server
    configResolved(resolvedConfig) {
      config = resolvedConfig;

      // Only set up watcher in dev mode
      if (config.command === "serve") {
        // Watch app directory for new SCSS files
        const appPath = path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "..",
          "app"
        );

        // Debounce regeneration to avoid multiple rapid calls
        const scheduleRegenerate = () => {
          if (regenerateTimer) clearTimeout(regenerateTimer);
          regenerateTimer = setTimeout(async () => {
            console.log(
              "[Critical CSS Scanner] 📝 Detected file change, regenerating..."
            );
            await regenerateImports();
          }, 300); // 300ms debounce to ensure file is fully written
        };

        fileWatcher = watch(
          appPath,
          { recursive: true },
          (eventType, filename) => {
            if (
              filename &&
              filename.endsWith(".scss") &&
              !filename.includes("node_modules") &&
              !filename.includes(".git") &&
              !filename.includes(".internal") // Exclude generated files to prevent infinite loop
            ) {
              scheduleRegenerate();
            }
          }
        );

        console.log(
          "[Critical CSS Scanner] 👀 Watching app directory for SCSS changes"
        );
      }
    },

    // Capture server instance for HMR updates
    async handleHotUpdate(ctx) {
      if (!server && ctx.server) {
        server = ctx.server;
        console.log("[Critical CSS Scanner] 📡 Connected to HMR server");
      }
      return;
    },

    // Hook into the write bundle to split CSS files
    async writeBundle(options, bundle) {
      // Only process during build
      if (config?.command !== "build") {
        return;
      }

      try {
        // Find the main CSS file (root-*.css)
        let mainCssFile = null;
        for (const [, file] of Object.entries(bundle)) {
          if (
            file.type === "asset" &&
            file.fileName.startsWith("root-") &&
            file.fileName.endsWith(".css")
          ) {
            mainCssFile = file;
            break;
          }
        }

        if (!mainCssFile || typeof mainCssFile.source !== "string") {
          console.warn(
            "[Critical CSS Scanner] ⚠️ No main CSS file found in bundle"
          );
          return;
        }

        const fullCss = mainCssFile.source;
        const { critical, nonCritical } = splitCSSByComponents(
          fullCss,
          generatedFiles
        );

        // Update the main CSS file to contain only critical CSS
        mainCssFile.source = critical;

        // Create a separate file for non-critical CSS
        const nonCriticalFileName = mainCssFile.fileName.replace(
          "root-",
          "non-critical-"
        );
        bundle[nonCriticalFileName] = {
          type: "asset",
          fileName: nonCriticalFileName,
          source: nonCritical,
          needsCodeReference: false,
        } as any;

        const criticalSize = (critical.length / 1024).toFixed(2);
        const nonCriticalSize = (nonCritical.length / 1024).toFixed(2);

        console.log("[Critical CSS Scanner] 📊 CSS split completed:");
        console.log(
          `  Critical: ${criticalSize} KB | Non-critical: ${nonCriticalSize} KB`
        );
      } catch (error) {
        console.warn(
          "[Critical CSS Scanner] ⚠️ Failed to split CSS:",
          error instanceof Error ? error.message : String(error)
        );
      }
    },

    // Cleanup watcher on close
    closeBundle() {
      if (fileWatcher) {
        fileWatcher.close();
        console.log("[Critical CSS Scanner] 🛑 File watcher closed");
      }
    },
  };
}

/**
 * Split CSS into critical and non-critical based on components
 * This is a simple approach that extracts CSS rules by component class names
 */
function splitCSSByComponents(
  fullCss: string,
  generatedFiles: GeneratedFiles
): { critical: string; nonCritical: string } {
  // For now, we'll use a simple approach:
  // Since we have two separate Sass entry points (_index.scss for critical,
  // _non-critical-entry.scss for non-critical), we can split the CSS
  // by looking for component-specific selectors.
  //
  // However, since Sass compiles everything together initially,
  // we need a different strategy. The best approach is to track
  // which component files contributed to which parts of the CSS.
  //
  // For this MVP, we'll keep everything in the main CSS for now
  // and just create an empty non-critical CSS file as a placeholder.
  // The real split will happen when we can separate the Sass compilation.

  const nonCriticalComponents = generatedFiles.nonCritical;

  // Simple heuristic: extract rules that mention non-critical components
  let nonCritical = "";
  let critical = fullCss;

  // Extract footer-related styles (basic pattern matching)
  if (nonCriticalComponents.some((f) => f.includes("footer"))) {
    const footerRegex = /\.footer\s*\{[^}]*\}|\.footer[^\s]*\s*\{[^}]*\}/g;
    const matches = critical.match(footerRegex) || [];
    if (matches.length > 0) {
      nonCritical += matches.join("\n");
      critical = critical.replace(footerRegex, "");
    }
  }

  // Remove excess whitespace
  critical = critical.replace(/\n\s*\n/g, "\n").trim();
  nonCritical = nonCritical.replace(/\n\s*\n/g, "\n").trim();

  // If no non-critical CSS was extracted, add a comment
  if (!nonCritical) {
    nonCritical = "/* Non-critical CSS (async-loaded) - currently empty */\n";
  }

  return { critical, nonCritical };
}

/**
 * Recursively scan directory for .scss files and detect markers
 */
async function scanDirectory(
  dir: string
): Promise<{ critical: string[]; nonCritical: string[] }> {
  const result = { critical: [], nonCritical: [] };
  const appRootPath = dir; // Capture appRoot in closure

  async function walk(dirPath: string) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip styles and .internal directories (contain abstracts, not components)
        if (entry.name === "styles" || entry.name === ".internal") {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".scss")) {
          // Skip app.scss itself (it's the root stylesheet)
          if (entry.name === "app.scss") {
            continue;
          }

          try {
            const content = await fs.readFile(fullPath, "utf-8");
            // Compute relative path from app/ directory
            const relativePath = path.relative(appRootPath, fullPath);

            if (CRITICAL_FILE_MARKER.test(content)) {
              // Explicitly marked as critical
              result.critical.push(relativePath);
            } else {
              // Default: treat all unmarked files as non-critical
              // This includes both explicitly marked @non-critical and unmarked files
              result.nonCritical.push(relativePath);
            }
          } catch (err) {
            console.warn(
              `[Critical CSS Scanner] ⚠️  Failed to read ${fullPath}:`,
              err instanceof Error ? err.message : String(err)
            );
          }
        }
      }
    } catch (err) {
      console.warn(
        `[Critical CSS Scanner] ⚠️  Failed to scan ${dirPath}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  await walk(dir);
  return result;
}
