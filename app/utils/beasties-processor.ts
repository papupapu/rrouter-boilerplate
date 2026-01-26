import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Extract and inline critical CSS from the build output
 *
 * Phase 3 Implementation: Proper CSS Code Splitting
 *
 * This processor now handles two separate CSS files:
 * 1. root-*.css: Critical CSS (inlined in <style> tag for fast FCP)
 * 2. non-critical-*.css: Non-critical CSS (lazy-loaded asynchronously)
 *
 * Process:
 * 1. Find both CSS files in build output
 * 2. Inline critical CSS as <style id="critical-css"> tag in <head>
 * 3. Add non-critical CSS as <link> tag with lazy-loading technique
 * 4. Remove external <link> tags for both to prevent duplication
 */

interface CSSFiles {
  critical: string | null;
  nonCritical: string | null;
}

async function findCSSFiles(cssPath: string): Promise<CSSFiles> {
  const fs = await import("fs/promises");
  const files = await fs.readdir(cssPath);

  // Find critical CSS file (root-*.css from main app bundle)
  const criticalFile = files.find(
    (f) => f.endsWith(".css") && f.startsWith("root-")
  );

  // Find non-critical CSS file (non-critical-*.css from separate entry)
  const nonCriticalFile = files.find(
    (f) => f.startsWith("non-critical-") && f.endsWith(".css")
  );

  return {
    critical: criticalFile || null,
    nonCritical: nonCriticalFile || null,
  };
}

function removeExternalCSSLinks(html: string, filenames: string[]): string {
  let result = html;
  for (const filename of filenames) {
    const cssLinkRegex = new RegExp(
      `<link[^>]*href="[^"]*${filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*/?>`,
      "g"
    );
    result = result.replace(cssLinkRegex, "");
  }
  return result;
}

export async function processCriticalCSS(html: string): Promise<string> {
  // Only process in production
  if (!import.meta.env.PROD) {
    return html;
  }

  try {
    const cssPath = resolve(process.cwd(), "build/client/assets");
    const cssFiles = await findCSSFiles(cssPath);

    // Check if we have at least critical CSS
    if (!cssFiles.critical) {
      console.warn(
        "[Critical CSS] ⚠️ No critical CSS file found in build output"
      );
      return html;
    }

    // Find head section
    const headStartIndex = html.indexOf("<head>");
    const headEndIndex = html.indexOf("</head>");

    if (headStartIndex === -1 || headEndIndex === -1) {
      console.warn("[Critical CSS] ⚠️ No </head> tag found");
      return html;
    }

    // Read critical CSS
    const criticalCssPath = resolve(cssPath, cssFiles.critical);
    const criticalCssContent = readFileSync(criticalCssPath, "utf-8");
    const criticalSizeKB = (criticalCssContent.length / 1024).toFixed(2);

    console.log(
      `[Critical CSS] 📄 Critical CSS: ${cssFiles.critical} (${criticalSizeKB} KB)`
    );

    // Extract head section
    const headSection = html.substring(headStartIndex, headEndIndex);
    const afterHeadSection = html.substring(headEndIndex);

    // Remove external CSS links for both critical and non-critical to prevent duplication
    const filesToRemove = [
      cssFiles.critical,
      ...(cssFiles.nonCritical ? [cssFiles.nonCritical] : []),
    ];
    const cleanedHead = removeExternalCSSLinks(headSection, filesToRemove);

    // Create critical CSS style tag
    const criticalStyleTag = `<style id="critical-css" type="text/css">${criticalCssContent}</style>`;

    // Create non-critical CSS link tag if it exists
    let nonCriticalLinkTag = "";
    if (cssFiles.nonCritical) {
      const nonCriticalPath = resolve(cssPath, cssFiles.nonCritical);
      const nonCriticalContentLength = (
        await (await import("fs/promises")).readFile(nonCriticalPath, "utf-8")
      ).length;
      const nonCriticalSizeKB = (nonCriticalContentLength / 1024).toFixed(2);

      console.log(
        `[Critical CSS] 📄 Non-critical CSS: ${cssFiles.nonCritical} (${nonCriticalSizeKB} KB)`
      );

      // Note: The href is relative; it will work because of how the server serves assets
      nonCriticalLinkTag = `<link rel="stylesheet" href="/assets/${cssFiles.nonCritical}" media="print" onload="this.media='all'" />`;
    }

    // Reconstruct HTML: head (cleaned) + critical style + non-critical link + rest
    let processed =
      html.substring(0, headStartIndex) +
      cleanedHead +
      criticalStyleTag +
      nonCriticalLinkTag +
      afterHeadSection;

    const removedCount = filesToRemove.length;
    console.log(
      `[Critical CSS] ✅ Inlined ${criticalSizeKB} KB critical CSS${cssFiles.nonCritical ? ` + async-loaded ${cssFiles.nonCritical}` : ""} (removed ${removedCount} external link(s))`
    );

    return processed;
  } catch (error) {
    console.error("[Critical CSS] ❌ Processing failed:", error);
    // Fallback: return original HTML if processing fails
    return html;
  }
}
