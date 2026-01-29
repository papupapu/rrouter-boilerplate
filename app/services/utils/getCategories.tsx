import type { FetchResponse } from "~/utils/errorTypes";
import { ErrorCode, ErrorType } from "~/utils/errorTypes";
import { logError } from "~/utils/logger";
import {
  detectErrorType,
  determineSeverity,
  generateMessage,
  isRetriable,
  isValidCategoryArray,
} from "~/utils/errorDetector";

export interface Category {
  slug: string;
  name: string;
  url: string;
}

export async function getCategories(): Promise<FetchResponse<Category[]>> {
  try {
    const response = await fetch(
      "https://dummyjson.com/products/categoriessss"
    );
    const categories = await response.json();
    console.log(categories);

    // Validate response structure
    if (!isValidCategoryArray(categories)) {
      const operation = "getCategories";
      const errorType = ErrorType.VALIDATION_ERROR;
      const severity = determineSeverity(operation);
      const message = generateMessage(errorType, operation);

      const { timestamp } = logError(
        ErrorCode.INVALID_RESPONSE_STRUCTURE,
        errorType,
        severity,
        message,
        false,
        {
          operation,
          dataSource: "dummyjson",
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
      data: categories,
      errors: [],
    };
  } catch (error) {
    const operation = "getCategories";
    const errorType = detectErrorType(error);
    const severity = determineSeverity(operation);
    const retriable = isRetriable(errorType);
    const message = generateMessage(errorType, operation);

    const { timestamp } = logError(
      ErrorCode.CATEGORIES_FETCH_FAILED,
      errorType,
      severity,
      message,
      retriable,
      {
        operation,
        dataSource: "dummyjson",
      }
    );

    return {
      status: "error",
      data: null,
      errors: [
        {
          code: ErrorCode.CATEGORIES_FETCH_FAILED,
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
