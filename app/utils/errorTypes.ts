/**
 * Error Classification System
 * Provides type-safe error handling with granular error classification,
 * severity levels, and discriminated union response types.
 */

/**
 * Classifies the nature of a failure
 */
export enum ErrorType {
  /** Connection failed, fetch blocked, timeout */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** Invalid JSON, malformed response */
  PARSE_ERROR = "PARSE_ERROR",
  /** Response is valid JSON but doesn't match expected data structure */
  VALIDATION_ERROR = "VALIDATION_ERROR",
  /** Unexpected exception, unclassifiable */
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Determines impact on data availability
 */
export enum ErrorSeverity {
  /** Operation completely prevents data (e.g., categories list unavailable) */
  CRITICAL = "CRITICAL",
  /** Data partially available (e.g., one product category failed but others OK) */
  WARNING = "WARNING",
}

/**
 * Operation-level error identifiers
 */
export enum ErrorCode {
  /** getCategories failed entirely */
  CATEGORIES_FETCH_FAILED = "CATEGORIES_FETCH_FAILED",
  /** Top 3 category products failed */
  TOP_PRODUCTS_FETCH_FAILED = "TOP_PRODUCTS_FETCH_FAILED",
  /** Individual category products failed */
  PRODUCTS_FETCH_FAILED = "PRODUCTS_FETCH_FAILED",
  /** Response structure validation failed (received data doesn't match expected shape) */
  INVALID_RESPONSE_STRUCTURE = "INVALID_RESPONSE_STRUCTURE",
  /** Fallback for unclassified errors */
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Complete error information for a failed operation
 */
export interface FetchError {
  /** Which operation failed */
  code: ErrorCode;
  /** How it failed (network/parse/unknown) */
  type: ErrorType;
  /** Impact on data (critical/warning) */
  severity: ErrorSeverity;
  /** User-friendly description */
  message: string;
  /** When it occurred (client timestamp, milliseconds) */
  timestamp: number;
  /** Should caller retry? (network=yes, parse=no) */
  retriable: boolean;
}

/**
 * Metadata for logging and debugging
 */
export interface ErrorContext {
  /** Operation name: "getCategories", "getProductsByCategory" */
  operation?: string;
  /** Data source: "dummyjson" */
  dataSource?: string;
  /** For product fetches: category slug/name */
  category?: string;
}

/**
 * Type-safe discriminated union for service responses
 * Enables exhaustive type checking and prevents mixing success/error data
 */
export type FetchResponse<T> =
  | {
      status: "success";
      data: T;
      errors: [];
    }
  | {
      status: "error";
      data: T | null;
      errors: FetchError[];
    };
