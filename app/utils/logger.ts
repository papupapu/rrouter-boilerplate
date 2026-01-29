/**
 * Centralized Error Logging
 * Provides structured error logging with environment-aware output.
 * Foundation for external error tracking integration (Sentry, DataDog, etc.)
 */

import type {
  ErrorCode,
  ErrorContext,
  ErrorSeverity,
  ErrorType,
} from "./errorTypes";

/**
 * Log an error with structured metadata
 * @param code Operation-level error identifier
 * @param type Error nature (network/parse/unknown)
 * @param severity Impact on data (critical/warning)
 * @param message User-friendly error description
 * @param retriable Whether the operation can be retried
 * @param context Optional metadata for debugging
 * @returns Object containing timestamp for use in FetchError
 */
export function logError(
  code: ErrorCode,
  type: ErrorType,
  severity: ErrorSeverity,
  message: string,
  retriable: boolean,
  context?: ErrorContext
): { timestamp: number } {
  const timestamp = Date.now();

  const logData = {
    code,
    type,
    severity,
    message,
    retriable,
    context,
    timestamp,
  };

  if (import.meta.env.DEV) {
    // Development: Log full error object for debugging
    console.error(
      `%c[${severity}] ${code}`,
      "color: #ff6b6b; font-weight: bold;",
      logData
    );
  } else {
    // Production: Log concisely, prepare for external tracking
    // TODO: Integrate with error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(new Error(message), { extra: logData })
    console.error(`[${severity}] ${code}: ${message}`);
  }

  return { timestamp };
}
