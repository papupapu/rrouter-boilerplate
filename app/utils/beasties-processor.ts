import Beasties from "beasties";

let processor: InstanceType<typeof Beasties> | null = null;

/**
 * Get or create Beasties processor instance
 * Only instantiate in production builds
 */
function getProcessor(): InstanceType<typeof Beasties> | null {
  if (import.meta.env.PROD) {
    if (!processor) {
      processor = new Beasties({
        preload: "swap",
        compress: true,
        external: true,
        fonts: true,
      });
    }
    return processor;
  }
  return null;
}

/**
 * Process HTML to extract and inline critical CSS
 * @param html - Complete HTML string (typically the shell)
 * @returns Processed HTML with critical CSS inlined
 */
export async function processCriticalCSS(html: string): Promise<string> {
  const processor = getProcessor();

  if (!processor) {
    // In development, return HTML as-is
    console.log("[Beasties] Development mode - skipping CSS processing");
    return html;
  }

  try {
    const originalSize = html.length;
    console.log(`[Beasties] Processing HTML (${originalSize} bytes)...`);
    const processed = await processor.process(html);
    const processedSize = processed.length;
    const sizeDiff = processedSize - originalSize;
    console.log(
      `[Beasties] ✅ Processing complete. Size: ${originalSize} → ${processedSize} bytes (${sizeDiff > 0 ? "+" : ""}${sizeDiff})`
    );
    return processed;
  } catch (error) {
    console.error("[Beasties] ❌ Processing failed:", error);
    // Fallback: return original HTML if processing fails
    return html;
  }
}

/**
 * Reset processor (useful for testing)
 */
export function resetProcessor(): void {
  processor = null;
}
