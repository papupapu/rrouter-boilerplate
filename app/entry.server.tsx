import { Transform } from "node:stream";
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
