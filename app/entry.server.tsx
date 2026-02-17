import { Transform } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { jsx } from "react/jsx-runtime";
import { processCriticalCSS } from "./utils/beasties-processor";
import { initializeConfig } from "./services/config";

// ============================================================================
// Server Startup Initialization
// ============================================================================

/**
 * Initialize application configuration at server startup
 *
 * This initializes all application configurations before handling any requests:
 * - API endpoints and URLs (from app/config/api.config.json)
 * - Site metadata and SEO defaults (from app/config/metadata.config.json)
 * - Third-party integration keys (from app/config/integrations.config.json)
 * - Remote configurations like categories (from configured APIs)
 *
 * Both development and production servers benefit from this optimization:
 * - Development: All configs loaded once when dev server starts
 * - Production: All configs loaded once when production server starts
 *
 * Performance impact:
 * - Adds ~200-500ms to server startup time (one-time cost)
 * - Eliminates runtime fetching from all requests (ongoing benefit)
 * - Reduces API calls to zero after initialization
 */
try {
  await initializeConfig();
  console.log("[Server] ✅ Application configuration initialized");
} catch (error) {
  console.error("[Server] ❌ Failed to initialize configuration:", error);
  console.error("[Server] ⚠️  Server starting without cached configuration");
  // Continue server startup - loaders will handle the error
}

// ============================================================================
// Request Handling
// ============================================================================

const streamTimeout = 5000;

interface RouterContext {
  isSpaMode?: boolean;
}

function handleDocumentRequestFunction(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: RouterContext
): Promise<Response> {
  if (request.method.toUpperCase() === "HEAD") {
    return Promise.resolve(
      new Response(null, {
        status: responseStatusCode,
        headers: responseHeaders,
      })
    );
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");
    const readyOption =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    // Buffer for capturing the shell
    const chunks: Buffer[] = [];

    const { pipe } = renderToPipeableStream(
      jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]: async () => {
          shellRendered = true;

          // Create a transform stream to buffer and process the shell
          let shellProcessed = false;
          const transformStream = new Transform({
            transform(
              chunk: Buffer,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              encoding: any,
              callback: (error?: Error | null, data?: Buffer | string) => void
            ): void {
              if (!shellProcessed) {
                chunks.push(chunk);
                const concatenated = Buffer.concat(chunks).toString("utf-8");

                // Check if shell (head section) is complete
                if (concatenated.includes("</head>")) {
                  shellProcessed = true;
                  console.log(
                    "[SSR] Shell buffer complete, triggering Beasties processing..."
                  );

                  // Process asynchronously
                  processCriticalCSS(concatenated)
                    .then((processed) => {
                      console.log(
                        "[SSR] Shell processed, sending to client..."
                      );
                      chunks.length = 0; // Clear the buffer
                      callback(null, processed);
                    })
                    .catch((error) => {
                      console.error("[SSR] Processing error:", error);
                      chunks.length = 0; // Clear the buffer
                      callback(null, concatenated);
                    });
                } else {
                  // Keep buffering - call callback to continue
                  callback();
                }
              } else {
                // Shell already processed, pass through remaining chunks
                callback(null, chunk);
              }
            },
          });

          const stream = createReadableStreamFromReadable(transformStream);
          responseHeaders.set("Content-Type", "text/html");
          pipe(transformStream);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error("Error during rendering:", error);
          }
        },
      }
    );
  });
}

export default handleDocumentRequestFunction;
export { streamTimeout };
