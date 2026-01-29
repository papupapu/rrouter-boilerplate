import type { FetchResponse } from "~/utils/errorTypes";
import { ErrorCode, ErrorType } from "~/utils/errorTypes";
import { logError } from "~/utils/logger";
import {
  detectErrorType,
  determineSeverity,
  generateMessage,
  isRetriable,
  isValidProductArray,
} from "~/utils/errorDetector";

export interface Product {
  id: number;
  title: string;
  description?: string;
  price?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export async function getProductsByCategory(
  slug: string
): Promise<FetchResponse<Product[]>> {
  try {
    const response = await fetch(
      `https://dummyjson.com/products/category/${slug}`
    );
    const data = await response.json();
    const products = data.products || [];

    // Validate response structure
    if (!isValidProductArray(products)) {
      const operation = "getProductsByCategory";
      const errorType = ErrorType.VALIDATION_ERROR;
      const severity = determineSeverity(operation);
      const message = generateMessage(errorType, operation, { category: slug });

      const { timestamp } = logError(
        ErrorCode.INVALID_RESPONSE_STRUCTURE,
        errorType,
        severity,
        message,
        false,
        {
          operation,
          dataSource: "dummyjson",
          category: slug,
        }
      );

      return {
        status: "error",
        data: null,
        errors: [
          {
            code: ErrorCode.INVALID_RESPONSE_STRUCTURE,
            type: errorType,
            severity,
            message,
            timestamp,
            retriable: false,
          },
        ],
      };
    }

    return {
      status: "success",
      data: products,
      errors: [],
    };
  } catch (error) {
    const operation = "getProductsByCategory";
    const errorType = detectErrorType(error);
    const severity = determineSeverity(operation);
    const retriable = isRetriable(errorType);
    const message = generateMessage(errorType, operation, { category: slug });

    const { timestamp } = logError(
      ErrorCode.PRODUCTS_FETCH_FAILED,
      errorType,
      severity,
      message,
      retriable,
      {
        operation,
        dataSource: "dummyjson",
        category: slug,
      }
    );

    return {
      status: "error",
      data: null,
      errors: [
        {
          code: ErrorCode.PRODUCTS_FETCH_FAILED,
          type: errorType,
          severity,
          message,
          timestamp,
          retriable,
        },
      ],
    };
  }
}
