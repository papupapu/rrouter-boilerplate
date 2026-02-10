import { ErrorFactory, type AppError } from "../types/errors";
import {
  safeParseCategories,
  type Categories,
} from "../schemas/categories.schema";

const API_URL = "https://dummyjson.com/products/categories";

export interface GetCategoriesResult {
  error: boolean;
  errorMessage: string | null;
  errorCode: string | null;
  errorStatusCode: number | null;
  categories: Categories;
}

/**
 * Fetch product categories from API
 *
 * Validates:
 * - HTTP response status (throws on 4xx, 5xx)
 * - JSON parsing
 * - Zod schema validation (array of strings)
 *
 * Returns:
 * - error=false with categories on success
 * - error=true with errorMessage/errorCode/errorStatusCode on failure
 */
export async function getCategories(): Promise<GetCategoriesResult> {
  try {
    // Step 1: Fetch with network error handling
    const response = await fetch(API_URL);

    // Step 2: Validate HTTP status
    if (!response.ok) {
      const appError = ErrorFactory.httpError(
        response.status,
        API_URL,
        "Failed to fetch categories"
      );
      return serializeError(appError);
    }

    // Step 3: Parse JSON
    let data: unknown;
    try {
      data = await response.json();
    } catch (parseErr) {
      const appError = ErrorFactory.parseError(parseErr, "Categories response");
      return serializeError(appError);
    }

    // Step 4: Validate with Zod schema
    const validation = safeParseCategories(data);
    if (!validation.success) {
      const appError = ErrorFactory.validationError(
        validation.error.issues,
        "Categories schema validation"
      );
      return serializeError(appError);
    }

    return {
      error: false,
      errorMessage: null,
      errorCode: null,
      errorStatusCode: null,
      categories: validation.data,
    };
  } catch (err) {
    // Catch any unexpected errors
    const appError = ErrorFactory.networkError(err, "Categories fetch");
    return serializeError(appError);
  }
}

/**
 * Convert AppError to result object for client consumption
 */
function serializeError(appError: AppError): GetCategoriesResult {
  return {
    error: true,
    errorMessage: appError.message,
    errorCode: appError.code,
    errorStatusCode: appError.statusCode ?? null,
    categories: [],
  };
}
