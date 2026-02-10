/**
 * Standardized Response Contract for Services
 *
 * All service layer functions return ServiceResponse<T> which provides:
 * - success: boolean flag indicating if all operations completed without errors
 * - data: the actual response data (can be partial if success=false with data present)
 * - errors: array of errors that occurred (only present if success=false)
 * - partialDataInfo: metadata about partial failures (only present if success=false with data present)
 */

/**
 * Standardized error object sent to client
 * Contains enough information for client-side error handling and potential retry logic
 */
export interface ServiceError {
  code: string;
  message: string;
  category?: string; // Category (e.g., "network", "http", "validation")
  statusCode?: number; // HTTP status code if applicable
  retryable?: boolean; // Whether this error can be retried
  affectedResource?: string; // Specific resource that failed (e.g., category name)
  details?: Record<string, unknown>; // Additional debugging information
}

/**
 * Metadata about partial data failure
 * Present only when some requests succeeded and some failed
 */
export interface PartialDataInfo {
  failedResources: string[]; // Which specific resources failed
  totalAttempted: number; // Total number of fetch attempts
  successfulFetches: number; // Number of successful fetches
  errorCount: number; // Total number of errors
}

/**
 * Generic service response wrapper
 *
 * Usage patterns:
 *
 * 1. Complete Success:
 *    { success: true, data: {...} }
 *
 * 2. Complete Failure:
 *    { success: false, data: null, errors: [...] }
 *
 * 3. Partial Failure (some data available):
 *    { success: false, data: {...}, errors: [...], partialDataInfo: {...} }
 */
export interface ServiceResponse<T> {
  /**
   * True if all operations completed without errors
   * False if any operation failed (may still have partial data)
   */
  success: boolean;

  /**
   * Response data
   * - Present and complete if success=true
   * - Partial if success=false but some operations succeeded
   * - Null if success=false and no data available
   */
  data?: T | null;

  /**
   * Array of errors that occurred
   * Only present if success=false
   * Each error includes code, message, category, and optional statusCode
   */
  errors?: ServiceError[];

  /**
   * Metadata about partial data
   * Only present if success=false AND data is not null
   * Indicates which resources failed and how many succeeded
   */
  partialDataInfo?: PartialDataInfo;
}

/**
 * Utility function to create a successful response
 */
export function createSuccessResponse<T>(data: T): ServiceResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Utility function to create a complete failure response
 */
export function createFailureResponse<T>(
  errors: ServiceError[]
): ServiceResponse<T> {
  return {
    success: false,
    data: null,
    errors,
  };
}

/**
 * Utility function to create a partial failure response
 */
export function createPartialFailureResponse<T>(
  data: T,
  errors: ServiceError[],
  partialDataInfo: PartialDataInfo
): ServiceResponse<T> {
  return {
    success: false,
    data,
    errors,
    partialDataInfo,
  };
}
