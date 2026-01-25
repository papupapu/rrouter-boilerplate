import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Extract and inline critical CSS from the build output
 * This prevents double-loading of CSS when it's inlined in <style> tags
 */
export async function processCriticalCSS(html: string): Promise<string> {
  // Only process in production
  if (!import.meta.env.PROD) {
    return html;
  }

  try {
    // Find the critical CSS file in the build output (root-*.css from main bundle)
    const cssPath = resolve(process.cwd(), "build/client/assets");
    const fs = await import("fs/promises");
    const files = await fs.readdir(cssPath);

    const criticalCssFile = files.find(
      (f) => f.endsWith(".css") && f.startsWith("root-")
    );

    if (!criticalCssFile) {
      console.warn(
        "[Critical CSS] ⚠️ No critical CSS file found in build output"
      );
      return html;
    }

    const criticalCssPath = resolve(cssPath, criticalCssFile);
    const criticalCssContent = readFileSync(criticalCssPath, "utf-8");
    const criticalSizeKB = (criticalCssContent.length / 1024).toFixed(2);

    console.log(
      `[Critical CSS] 📄 Found CSS file: ${criticalCssFile} (${criticalSizeKB} KB)`
    );

    // Find head section
    const headStartIndex = html.indexOf("<head>");
    const headEndIndex = html.indexOf("</head>");

    if (headStartIndex === -1 || headEndIndex === -1) {
      console.warn("[Critical CSS] ⚠️ No </head> tag found");
      return html;
    }

    // Step 1: Extract head section and remove the external <link> tag for this CSS file
    // This prevents double-loading when the CSS is inlined
    const headSection = html.substring(headStartIndex, headEndIndex);
    const cssLinkRegex = new RegExp(
      `<link[^>]*href="[^"]*${criticalCssFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*/?>`,
      "g"
    );

    const cleanedHead = headSection.replace(cssLinkRegex, "");
    const wasLinkRemoved = cleanedHead !== headSection;
    const afterHeadSection = html.substring(headEndIndex);

    // Step 2: Create style tag for critical CSS (inlined)
    const styleTag = `<style id="critical-css" type="text/css">${criticalCssContent}</style>`;

    // Step 3: Reconstruct HTML with cleaned head + inline style + rest of document
    let processed =
      html.substring(0, headStartIndex) +
      cleanedHead +
      styleTag +
      afterHeadSection;

    const removedMsg = wasLinkRemoved
      ? " (removed external link to prevent double-loading)"
      : " (external link already removed or not found)";
    console.log(
      `[Critical CSS] ✅ Inlined ${criticalSizeKB} KB of CSS${removedMsg}`
    );

    return processed;
  } catch (error) {
    console.error("[Critical CSS] ❌ Processing failed:", error);
    // Fallback: return original HTML if processing fails
    return html;
  }
}
