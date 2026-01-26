import type { Plugin, ResolvedConfig } from "vite";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { watch } from "fs";

/**
 * Critical CSS Scanner Plugin - Phase 2.5 Auto-Generated Hybrid Approach
 *
 * Scans all .scss files in the app directory for marker comments
 * and automatically generates centralized imports from templates.
 *
 * Generated files (written to actual .scss files, not virtual):
 * - app/styles/create/_critical.scss (inlined styles)
 * - app/styles/create/_non-critical.scss (async loaded styles)
 *
 * Files are auto-generated at build time and never committed to git.
 * Only template files (_*.template.scss) are tracked in version control.
 *
 * Runs during both dev and build modes:
 * - Production builds: Scans and generates once
 * - Development mode: Scans on startup + watches for file changes (HMR support)
 */

interface ScannedFiles {
  critical: string[];
  nonCritical: string[];
}

// Regex patterns for marker detection
const CRITICAL_FILE_MARKER = /^[\s/]*\/\*\s*@critical\s*\*\//m;

export function criticalCssScanner(): Plugin {
  let scannedFiles: ScannedFiles = { critical: [], nonCritical: [] };
  let appRoot = "";
  let stylesDir = "";
  let config: ResolvedConfig | null = null;
  let fileWatcher: ReturnType<typeof watch> | null = null;
  let regenerateTimer: ReturnType<typeof setTimeout> | null = null;
  let server: any = null;

  // Helper to regenerate files
  async function regenerateImports() {
    // Scan for SCSS files with markers
    scannedFiles = await scanDirectory(appRoot);

    // Read templates
    const criticalTemplate = await readTemplate("_critical", stylesDir);
    const nonCriticalTemplate = await readTemplate("_non-critical", stylesDir);

    // Generate files from templates + detected markers
    const criticalContent = generateFromTemplate(
      criticalTemplate,
      scannedFiles.critical,
      appRoot,
      stylesDir
    );
    const nonCriticalContent = generateFromTemplate(
      nonCriticalTemplate,
      scannedFiles.nonCritical,
      appRoot,
      stylesDir
    );

    // Write generated files
    await fs.writeFile(path.join(stylesDir, "_critical.scss"), criticalContent);
    await fs.writeFile(
      path.join(stylesDir, "_non-critical.scss"),
      nonCriticalContent
    );

    // Log results
    const totalFiles =
      scannedFiles.critical.length + scannedFiles.nonCritical.length;
    console.log(
      `[Critical CSS Scanner] ✅ Auto-generated critical CSS imports`
    );
    console.log(
      `[Critical CSS Scanner]    Found ${scannedFiles.critical.length} critical, ${scannedFiles.nonCritical.length} non-critical, ${totalFiles} total components\n`
    );

    if (scannedFiles.critical.length > 0) {
      console.log("[Critical CSS Scanner] 📌 Critical components:");
      scannedFiles.critical.forEach((file) => {
        console.log(`  ✓ ${file}`);
      });
      console.log("");
    }

    if (scannedFiles.nonCritical.length > 0) {
      console.log("[Critical CSS Scanner] 📦 Non-critical components:");
      scannedFiles.nonCritical.forEach((file) => {
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
    // Run during both dev and build to ensure consistency
    // Scans for markers and generates imports in both modes

    async config() {
      // Determine paths
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      appRoot = path.resolve(__dirname, "..", "app");
      stylesDir = path.resolve(appRoot, "styles", "create");

      // Ensure styles/create directory exists
      await fs.mkdir(stylesDir, { recursive: true });

      console.log(
        "[Critical CSS Scanner] 🔍 Scanning for markers in:",
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
              "[Critical CSS Scanner] 📝 Detected SCSS file change, regenerating imports..."
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
              !filename.includes("styles/create") // Exclude generated files to prevent infinite loop
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
          scannedFiles
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
        };

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
  scannedFiles: ScannedFiles
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

  const nonCriticalComponents = scannedFiles.nonCritical;

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
 * Read template file if it exists, return empty string if not
 */
async function readTemplate(
  filename: string,
  templateDir: string
): Promise<string> {
  const templatePath = path.join(templateDir, `${filename}.template.scss`);
  try {
    return await fs.readFile(templatePath, "utf-8");
  } catch {
    // Template doesn't exist yet (shouldn't happen in normal operation)
    console.warn(
      `[Critical CSS Scanner] ⚠️  Template not found: ${templatePath}`
    );
    return "";
  }
}

/**
 * Recursively scan directory for .scss files and detect markers
 */
async function scanDirectory(dir: string): Promise<ScannedFiles> {
  const result: ScannedFiles = { critical: [], nonCritical: [] };
  const appRootPath = dir; // Capture appRoot in closure

  async function walk(dirPath: string) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip styles directory (contains abstracts and templates, not components)
        if (entry.name === "styles") {
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

/**
 * Generate content from template
 * Preserves everything before "AUTO-GENERATED" marker, appends detected imports
 */
function generateFromTemplate(
  template: string,
  detectedFiles: string[],
  appRoot: string,
  baseDir: string
): string {
  // Find the AUTO-GENERATED marker
  const autoGenMarkerIndex = template.indexOf(
    "// AUTO-GENERATED SECTION BELOW"
  );

  // Extract template header (everything up to the marker)
  const templateHeader =
    autoGenMarkerIndex > -1
      ? template.substring(0, autoGenMarkerIndex)
      : template;

  // Build the generated section with imports
  const generatedLines: string[] = [];

  if (detectedFiles.length > 0) {
    for (const file of detectedFiles) {
      // file is like "components/layout/header/header.scss"
      // baseDir is like "...app/styles/create"
      // appRoot is like "...app"

      // Remove .scss extension to get the module path
      const fileWithoutExtension = file.replace(/\.scss$/, "");

      // Compute relative path from baseDir to the component file
      // file is relative to app/, so we need: app/components/layout/header/header
      const componentFullPath = path.join(appRoot, fileWithoutExtension);
      const relativePath = path.relative(baseDir, componentFullPath);

      // Normalize path separators for Sass (@use always uses /)
      const importPath = relativePath.replace(/\\/g, "/");

      generatedLines.push(`@use "${importPath}";`);
    }
  }

  // Combine template header + generated section
  if (generatedLines.length > 0) {
    return templateHeader + generatedLines.join("\n") + "\n";
  } else {
    // If no components detected, return just the template header
    return templateHeader;
  }
}
