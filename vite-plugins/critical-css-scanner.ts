import { Plugin } from "vite";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
 * Only runs during production builds to avoid dev server overhead.
 */

interface ScannedFiles {
  critical: string[];
  nonCritical: string[];
}

// Regex patterns for marker detection
const CRITICAL_FILE_MARKER = /^[\s/]*\/\*\s*@critical\s*\*\//m;
const NON_CRITICAL_FILE_MARKER = /^[\s/]*\/\*\s*@non-critical\s*\*\//m;

export function criticalCssScanner(): Plugin {
  let scannedFiles: ScannedFiles = { critical: [], nonCritical: [] };
  let appRoot = "";
  let stylesDir = "";

  return {
    name: "critical-css-scanner",
    apply: "build", // Only run during production builds

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

      // Scan for SCSS files with markers
      scannedFiles = await scanDirectory(appRoot);

      // Read templates
      const criticalTemplate = await readTemplate("_critical", stylesDir);
      const nonCriticalTemplate = await readTemplate(
        "_non-critical",
        stylesDir
      );

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
      await fs.writeFile(
        path.join(stylesDir, "_critical.scss"),
        criticalContent
      );
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
    },
  };
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
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            // Compute relative path from app/ directory
            const relativePath = path.relative(appRootPath, fullPath);

            if (CRITICAL_FILE_MARKER.test(content)) {
              result.critical.push(relativePath);
            } else if (NON_CRITICAL_FILE_MARKER.test(content)) {
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
