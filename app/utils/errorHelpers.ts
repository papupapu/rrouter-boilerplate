/**
 * Error helper utilities for clean, testable error inspection logic.
 * Used by views and components to analyze FetchError arrays without complex conditionals.
 */

import type { FetchError, ErrorCode } from "./errorTypes";

/**
 * Check if errors array contains any CRITICAL severity errors.
 * Useful for determining if entire page should show error state.
 *
 * @param errors - Array of FetchError objects
 * @returns true if any error has CRITICAL severity
 *
 * @example
 * if (hasCriticalError(data.errors)) {
 *   return <ErrorPage error={getCriticalError(data.errors)!} />;
 * }
 */
export function hasCriticalError(errors: FetchError[]): boolean {
  return errors.some((error) => error.severity === "CRITICAL");
}

/**
 * Get the first CRITICAL error from the array.
 * Useful for displaying in ErrorPage component.
 *
 * @param errors - Array of FetchError objects
 * @returns First CRITICAL error, or undefined if none exist
 *
 * @example
 * const criticalError = getCriticalError(data.errors);
 * if (criticalError) {
 *   return <ErrorPage error={criticalError} />;
 * }
 */
export function getCriticalError(errors: FetchError[]): FetchError | undefined {
  return errors.find((error) => error.severity === "CRITICAL");
}

/**
 * Filter errors to get only those with retriable flag set to true.
 * Useful for determining which errors can be retried.
 *
 * @param errors - Array of FetchError objects
 * @returns Subset of errors where retriable === true
 *
 * @example
 * const retriableErrors = getRetriableErrors(data.errors);
 * if (retriableErrors.length > 0) {
 *   return <ErrorAlert errors={retriableErrors} onRetry={handleRetry} />;
 * }
 */
export function getRetriableErrors(errors: FetchError[]): FetchError[] {
  return errors.filter((error) => error.retriable === true);
}

/**
 * Find all errors with a specific error code.
 * Useful for handling specific operation failures (e.g., all PRODUCTS_FETCH_FAILED).
 *
 * @param errors - Array of FetchError objects
 * @param code - ErrorCode to match
 * @returns All errors matching the given code
 *
 * @example
 * const productErrors = extractErrorsByCode(data.errors, "PRODUCTS_FETCH_FAILED");
 * if (productErrors.length > 0) {
 *   // Handle product-specific errors
 * }
 */
export function extractErrorsByCode(
  errors: FetchError[],
  code: ErrorCode
): FetchError[] {
  return errors.filter((error) => error.code === code);
}

/**
 * Check if errors array is empty.
 * Useful for determining if data fetch was successful.
 *
 * @param errors - Array of FetchError objects
 * @returns true if no errors exist
 *
 * @example
 * if (hasNoErrors(data.errors)) {
 *   return <Content data={data.data} />;
 * }
 */
export function hasNoErrors(errors: FetchError[]): boolean {
  return errors.length === 0;
}

/**
 * Get all WARNING severity errors.
 * Useful for showing warnings while still rendering partial data.
 *
 * @param errors - Array of FetchError objects
 * @returns All errors with WARNING severity
 *
 * @example
 * const warningErrors = getWarningErrors(data.errors);
 * if (warningErrors.length > 0) {
 *   return <ErrorAlert errors={warningErrors} />;
 * }
 */
export function getWarningErrors(errors: FetchError[]): FetchError[] {
  return errors.filter((error) => error.severity === "WARNING");
}
