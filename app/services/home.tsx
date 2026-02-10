import { getCategories } from "./utils/getCategories";
import { getProductsByCategory } from "./utils/getProductsByCategory";
import {
  type ServiceResponse,
  type ServiceError,
  type PartialDataInfo,
} from "./types/response";

export interface HomeData {
  categories: string[];
  topCategoriesProducts: Record<string, unknown[]>;
  categoriesProducts: Record<string, unknown[]>;
}

/**
 * Fetch products for multiple categories with graceful degradation
 * Collects errors but continues fetching other categories
 */
async function fetchProductsForCategories({
  categories,
  count,
}: {
  categories: string[];
  count: number;
}): Promise<{
  products: Record<string, unknown[]>;
  errors: ServiceError[];
  failedCategories: string[];
}> {
  const products: Record<string, unknown[]> = {};
  const errors: ServiceError[] = [];
  const failedCategories: string[] = [];

  for (const category of categories.filter(Boolean)) {
    const result = await getProductsByCategory(category);

    if (!result.error) {
      products[category] = result.products.slice(0, count);
    } else {
      // Graceful degradation: collect error, continue with next category
      errors.push({
        code: result.errorCode || "UNKNOWN_ERROR",
        message: result.errorMessage || "Unknown error",
        statusCode: result.errorStatusCode ?? undefined,
        affectedResource: category,
      });
      failedCategories.push(category);
    }
  }

  return { products, errors, failedCategories };
}

/**
 * Fetch home page data including categories and products
 *
 * Returns:
 * - success=true: all data fetched without errors
 * - success=false with data: partial data available, some categories failed
 * - success=false without data: critical failure, no data available
 */
export async function fetchHomeData(): Promise<ServiceResponse<HomeData>> {
  // Step 1: Fetch categories (critical - if this fails, entire home fails)
  const categoriesResult = await getCategories();

  if (categoriesResult.error) {
    return {
      success: false,
      data: null,
      errors: [
        {
          code: categoriesResult.errorCode || "UNKNOWN_ERROR",
          message:
            categoriesResult.errorMessage || "Failed to fetch categories",
          statusCode: categoriesResult.errorStatusCode ?? undefined,
        },
      ],
    };
  }

  // Step 2: Split categories for top and remaining
  const allCategories = categoriesResult.categories;
  const [first, second, third, ...others] = allCategories;
  const topCategories = [first, second, third].filter(Boolean);
  const remainingCategories = others.filter(Boolean);

  // Step 3: Fetch products for top categories (with graceful degradation)
  const topResult = await fetchProductsForCategories({
    categories: topCategories,
    count: 3,
  });

  // Step 4: Fetch products for remaining categories (with graceful degradation)
  const remainingResult = await fetchProductsForCategories({
    categories: remainingCategories,
    count: 1,
  });

  // Step 5: Combine all errors
  const allErrors = [...topResult.errors, ...remainingResult.errors];
  const allFailedCategories = [
    ...topResult.failedCategories,
    ...remainingResult.failedCategories,
  ];

  // Step 6: Construct response
  const data: HomeData = {
    categories: allCategories,
    topCategoriesProducts: topResult.products,
    categoriesProducts: remainingResult.products,
  };

  const success = allErrors.length === 0;

  if (success) {
    return {
      success: true,
      data,
    };
  }

  // Partial failure: return data with errors info
  const partialDataInfo: PartialDataInfo = {
    failedResources: allFailedCategories,
    totalAttempted: topCategories.length + remainingCategories.length,
    successfulFetches:
      topCategories.length +
      remainingCategories.length -
      allFailedCategories.length,
    errorCount: allErrors.length,
  };

  return {
    success: false,
    data,
    errors: allErrors,
    partialDataInfo,
  };
}
