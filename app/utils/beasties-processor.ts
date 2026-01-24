import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Extract and inline critical CSS from the build output
 * Instead of relying on Beasties' extraction, we directly read and inject the CSS
 * This is simpler and more reliable for server-side rendering
 */
export async function processCriticalCSS(html: string): Promise<string> {
  // Only process in production
  if (!import.meta.env.PROD) {
    return html;
  }

  try {
    // Find the CSS file in the build output
    const cssPath = resolve(process.cwd(), "build/client/assets");
    const fs = await import("fs/promises");
    const files = await fs.readdir(cssPath);
    const cssFile = files.find(
      (f) => f.endsWith(".css") && f.startsWith("root-")
    );

    if (!cssFile) {
      console.warn("[Critical CSS] ⚠️ No CSS file found in build output");
      return html;
    }

    const cssFilePath = resolve(cssPath, cssFile);
    const cssContent = readFileSync(cssFilePath, "utf-8");
    const cssSizeKB = (cssContent.length / 1024).toFixed(2);

    console.log(
      `[Critical CSS] 📄 Found CSS file: ${cssFile} (${cssSizeKB} KB)`
    );

    // Extract only critical CSS rules (above-fold)
    // For now, we'll inline the full CSS since it's relatively small (16KB)
    // In a more sophisticated setup, we could parse and extract only critical rules
    const criticalCSS = cssContent;

    // Find the </head> tag and inject the critical CSS right before it
    const headEndIndex = html.indexOf("</head>");
    if (headEndIndex === -1) {
      console.warn("[Critical CSS] ⚠️ No </head> tag found");
      return html;
    }

    // Create the style tag with the critical CSS
    const styleTag = `<style id="critical-css" type="text/css">${criticalCSS}</style>`;

    // Inject right before </head>
    const processed =
      html.substring(0, headEndIndex) + styleTag + html.substring(headEndIndex);

    console.log(
      `[Critical CSS] ✅ Inlined ${cssSizeKB} KB of critical CSS (${(processed.length / 1024).toFixed(2)} KB total)`
    );

    return processed;
  } catch (error) {
    console.error("[Critical CSS] ❌ Processing failed:", error);
    // Fallback: return original HTML if processing fails
    return html;
  }
}
