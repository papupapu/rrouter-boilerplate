import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { jsx } from "react/jsx-runtime";
import { processCriticalCSS } from "./utils/beasties-processor";

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

    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000
    );

    // Buffer for capturing the shell
    const chunks: Buffer[] = [];
    let shellProcessed = false;

    const { pipe, abort } = renderToPipeableStream(
      jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]: async () => {
          shellRendered = true;

          // Create a custom writable stream to buffer and process HTML
          const passThrough = new PassThrough({
            write(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              this: any,
              chunk: Buffer,
              encoding: string,
              callback: (error?: Error | null) => void
            ): void {
              if (!shellProcessed) {
                // Still buffering the shell
                chunks.push(chunk);
              }
              callback();
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            final(this: any, callback: (error?: Error | null) => void): void {
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });

          // Monkey-patch the write method to intercept chunks
          const originalWrite = passThrough.write.bind(passThrough);
          let shellSent = false;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (passThrough.write as any) = function (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this: any,
            chunk: Buffer | string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            encodingOrCallback?: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callback?: any
          ): boolean {
            if (!shellSent) {
              if (Buffer.isBuffer(chunk)) {
                chunks.push(chunk);
              } else {
                chunks.push(Buffer.from(chunk));
              }

              // Heuristic: when we see closing body tag is coming, process shell
              // For now, we'll process after small delay to accumulate chunks
              if (chunks.length > 0) {
                // Check if we have the closing html tag or a reasonable amount of data
                const concatenated = Buffer.concat(chunks).toString("utf-8");

                // Simple heuristic: if we have the head section complete (contains </head>)
                // then process
                if (concatenated.includes("</head>") && !shellSent) {
                  shellSent = true;

                  // Process the buffered HTML
                  processCriticalCSS(concatenated)
                    .then((processed) => {
                      originalWrite(processed, encodingOrCallback, callback);
                    })
                    .catch((error: unknown) => {
                      console.error("Critical CSS processing error:", error);
                      // Fallback: send original HTML
                      originalWrite(concatenated, encodingOrCallback, callback);
                    });
                  return true;
                }
              }

              return true;
            }
            // Shell already sent, stream normally
            return originalWrite(chunk, encodingOrCallback, callback);
          };

          const stream = createReadableStreamFromReadable(passThrough);
          responseHeaders.set("Content-Type", "text/html");
          pipe(passThrough);

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
