/**
 * Error Detection & Classification
 * Automatically classifies errors by type, determines severity and retriability,
 * and generates user-friendly error messages.
 */

import type { ErrorContext } from "./errorTypes";
import { ErrorSeverity, ErrorType } from "./errorTypes";

/**
 * Classify an error based on its type
 * @param error The caught error object
 * @returns ErrorType indicating error category
 */
export function detectErrorType(error: unknown): ErrorType {
  // Network errors typically manifest as TypeError
  // Examples: "Failed to fetch", "NetworkError", "Request failed"
  if (error instanceof TypeError) {
    // Check if it's actually a network error by examining the message
    const message = (error as Error)?.message?.toLowerCase() || "";
    if (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("request")
    ) {
      return ErrorType.NETWORK_ERROR;
    }
  }

  // JSON.parse errors manifest as SyntaxError
  if (error instanceof SyntaxError) {
    return ErrorType.PARSE_ERROR;
  }

  // Default to unknown for unclassifiable errors
  return ErrorType.UNKNOWN_ERROR;
}

/**
 * Determine severity level based on operation type
 * @param operation Operation name (e.g., "getCategories", "getProductsByCategory")
 * @returns ErrorSeverity indicating impact on data
 */
export function determineSeverity(operation: string): ErrorSeverity {
  // Categories fetch is critical - entire home page depends on it
  if (operation === "getCategories") {
    return ErrorSeverity.CRITICAL;
  }

  // Product fetches are warnings - partial data is acceptable
  if (operation === "getProductsByCategory") {
    return ErrorSeverity.WARNING;
  }

  // Default to critical for unknown operations
  return ErrorSeverity.CRITICAL;
}

/**
 * Determine if an error is retriable
 * @param type The error type
 * @returns true if the operation should be retried, false if it's permanent
 */
export function isRetriable(type: ErrorType): boolean {
  // Only network errors are transient and should be retried
  return type === ErrorType.NETWORK_ERROR;
}

/**
 * Generate a user-friendly error message
 * @param type The error type
 * @param operation The operation that failed
 * @param context Optional metadata for context-specific messages
 * @returns User-friendly error message
 */
export function generateMessage(
  type: ErrorType,
  operation: string,
  context?: ErrorContext
): string {
  const operationName = context?.operation || operation;

  switch (type) {
    case ErrorType.NETWORK_ERROR:
      return `Failed to fetch ${operationName}. Please check your connection and try again.`;

    case ErrorType.PARSE_ERROR:
      return `Failed to process ${operationName} data. The server response was invalid.`;

    case ErrorType.UNKNOWN_ERROR:
      return `An unexpected error occurred while fetching ${operationName}.`;

    default:
      return `An error occurred while fetching ${operationName}.`;
  }
}
