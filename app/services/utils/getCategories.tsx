import type { FetchResponse } from "~/utils/errorTypes";
import { ErrorCode } from "~/utils/errorTypes";
import { logError } from "~/utils/logger";
import {
  detectErrorType,
  determineSeverity,
  generateMessage,
  isRetriable,
} from "~/utils/errorDetector";

export type Category = string;

export async function getCategories(): Promise<FetchResponse<Category[]>> {
  try {
    const response = await fetch("https://dummyjson.com/products/categories");
    const categories = await response.json();

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
