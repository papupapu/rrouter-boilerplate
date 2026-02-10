/**
 * Error Handling System for Services Layer
 *
 * Categorizes and standardizes all errors from:
 * - Network failures (connectivity, timeouts, DNS)
 * - HTTP errors (4xx, 5xx responses)
 * - JSON parsing failures
 * - Data validation failures (Zod schema mismatches)
 */

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = "network",
  HTTP = "http",
  PARSE = "parse",
  VALIDATION = "validation",
}

/**
 * Specific error codes for detailed debugging
 */
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  DNS_FAILED = "DNS_FAILED",
  CONNECTION_REFUSED = "CONNECTION_REFUSED",

  // HTTP errors
  HTTP_ERROR = "HTTP_ERROR",
  NOT_FOUND = "NOT_FOUND",
  SERVER_ERROR = "SERVER_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Parse errors
  PARSE_ERROR = "PARSE_ERROR",

  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SCHEMA_MISMATCH = "SCHEMA_MISMATCH",
}

/**
 * AppError class - standardized error representation
 * Used throughout the services layer for consistent error handling
 */
export class AppError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  statusCode?: number;
  details?: Record<string, unknown>;
  retryable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    category: ErrorCategory,
    options?: {
      statusCode?: number;
      details?: Record<string, unknown>;
      retryable?: boolean;
    }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.category = category;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    this.retryable = options?.retryable ?? false;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Serialize error to JSON with all relevant fields
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      statusCode: this.statusCode,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

/**
 * Factory for creating standardized AppError instances
 * Ensures consistent error creation across all utilities
 */
export const ErrorFactory = {
  /**
   * Create network error for connectivity issues
   * Includes: timeouts, DNS failures, connection refused, no internet
   */
  networkError: (
    originalError: unknown,
    context?: string,
    statusCode?: number
  ): AppError => {
    const errorMessage =
      originalError instanceof Error
        ? originalError.message
        : String(originalError);

    return new AppError(
      ErrorCode.NETWORK_ERROR,
      `${context ? `${context}: ` : ""}Network request failed - ${errorMessage}`,
      ErrorCategory.NETWORK,
      {
        statusCode,
        retryable: true,
        details: {
          originalError: errorMessage,
        },
      }
    );
  },

  /**
   * Create HTTP error for non-2xx responses
   * Automatically sets retryable based on status code (5xx = retryable, 4xx = not)
   */
  httpError: (statusCode: number, url: string, context?: string): AppError => {
    let code = ErrorCode.HTTP_ERROR;
    let retryable = false;

    // Classify specific HTTP status codes
    if (statusCode === 404) {
      code = ErrorCode.NOT_FOUND;
      retryable = false;
    } else if (statusCode === 401 || statusCode === 403) {
      code = ErrorCode.UNAUTHORIZED;
      retryable = false;
    } else if (statusCode === 429) {
      code = ErrorCode.RATE_LIMITED;
      retryable = true; // Can retry with backoff
    } else if (statusCode >= 500) {
      code = ErrorCode.SERVER_ERROR;
      retryable = true; // Server errors are transient
    } else if (statusCode >= 400) {
      retryable = false; // Client errors are not retryable
    }

    return new AppError(
      code,
      `${context ? `${context}: ` : ""}HTTP ${statusCode} from ${url}`,
      ErrorCategory.HTTP,
      {
        statusCode,
        retryable,
        details: {
          statusCode,
          url,
        },
      }
    );
  },

  /**
   * Create parse error for invalid JSON responses
   * Indicates the response body is not valid JSON
   */
  parseError: (originalError: unknown, context?: string): AppError => {
    const errorMessage =
      originalError instanceof Error
        ? originalError.message
        : String(originalError);

    return new AppError(
      ErrorCode.PARSE_ERROR,
      `${context ? `${context}: ` : ""}Failed to parse response as JSON - ${errorMessage}`,
      ErrorCategory.PARSE,
      {
        retryable: false,
        details: {
          originalError: errorMessage,
        },
      }
    );
  },

  /**
   * Create validation error for Zod schema mismatches
   * Includes details about what didn't match the schema
   */
  validationError: (details: unknown, context?: string): AppError => {
    const detailsObj: Record<string, unknown> =
      typeof details === "object" && details !== null
        ? (details as Record<string, unknown>)
        : { error: String(details) };

    return new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${context ? `${context}: ` : ""}Response data does not match expected schema`,
      ErrorCategory.VALIDATION,
      {
        details: detailsObj,
        retryable: false,
      }
    );
  },
};

/**
 * Type guard to check if error is an AppError
 * Use this to differentiate between AppError and generic Error
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper to convert any error to AppError
 * If already AppError, returns as-is; otherwise wraps as NetworkError
 */
export function toAppError(error: unknown, context?: string): AppError {
  if (isAppError(error)) {
    return error;
  }
  return ErrorFactory.networkError(error, context);
}
