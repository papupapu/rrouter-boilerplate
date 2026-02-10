import { ErrorFactory, type AppError } from "../types/errors";
import { safeParseProductsResponse } from "../schemas/products-response.schema";

const API_BASE = "https://dummyjson.com/products/category";

export interface GetProductsByCategoryResult {
  error: boolean;
  errorMessage: string | null;
  errorCode: string | null;
  errorStatusCode: number | null;
  products: unknown[];
}

/**
 * Fetch products for a specific category from API
 *
 * Validates:
 * - HTTP response status (throws on 4xx, 5xx)
 * - JSON parsing
 * - Zod schema validation (response structure + each product)
 *
 * Returns:
 * - error=false with products array on success
 * - error=true with errorMessage/errorCode/errorStatusCode on failure
 */
export async function getProductsByCategory(
  slug: string
): Promise<GetProductsByCategoryResult> {
  const url = `${API_BASE}/${slug}`;

  try {
    // Step 1: Fetch with network error handling
    const response = await fetch(url);

    // Step 2: Validate HTTP status
    if (!response.ok) {
      const appError = ErrorFactory.httpError(
        response.status,
        url,
        `Failed to fetch products for category '${slug}'`
      );
      return serializeError(appError);
    }

    // Step 3: Parse JSON
    let data: unknown;
    try {
      data = await response.json();
    } catch (parseErr) {
      const appError = ErrorFactory.parseError(
        parseErr,
        `Products response for category '${slug}'`
      );
      return serializeError(appError);
    }

    // Step 4: Validate with Zod schema
    const validation = safeParseProductsResponse(data);
    if (!validation.success) {
      const appError = ErrorFactory.validationError(
        validation.error.issues,
        `Products response for category '${slug}'`
      );
      return serializeError(appError);
    }

    return {
      error: false,
      errorMessage: null,
      errorCode: null,
      errorStatusCode: null,
      products: validation.data.products,
    };
  } catch (err) {
    // Catch any unexpected errors
    const appError = ErrorFactory.networkError(
      err,
      `Products fetch for category '${slug}'`
    );
    return serializeError(appError);
  }
}

/**
 * Convert AppError to result object for client consumption
 */
function serializeError(appError: AppError): GetProductsByCategoryResult {
  return {
    error: true,
    errorMessage: appError.message,
    errorCode: appError.code,
    errorStatusCode: appError.statusCode ?? null,
    products: [],
  };
}
