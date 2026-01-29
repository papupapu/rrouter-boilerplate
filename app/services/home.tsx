import type { FetchError, FetchResponse } from "~/utils/errorTypes";
import { ErrorSeverity } from "~/utils/errorTypes";
import type { Category } from "./utils/getCategories";
import { getCategories } from "./utils/getCategories";
import type { Product } from "./utils/getProductsByCategory";
import { getProductsByCategory } from "./utils/getProductsByCategory";

export interface HomeData {
  categories: Category[];
  topCategoriesProducts: Record<string, Product[]>;
  categoriesProducts: Record<string, Product[]>;
}

/**
 * Fetch products for a list of categories
 * Collects errors from failed category fetches but continues processing others
 * (partial success model)
 */
async function fetchProductsForCategories({
  categories,
  count,
}: {
  categories: Category[];
  count: number;
}): Promise<{
  products: Record<string, Product[]>;
  errors: FetchError[];
}> {
  const products: Record<string, Product[]> = {};
  const errors: FetchError[] = [];

  for (const category of categories.filter(Boolean)) {
    const { slug } = category;
    const result = await getProductsByCategory(slug);

    if (result.status === "success") {
      products[slug] = result.data.slice(0, count);
    } else {
      // Collect errors but continue processing other categories (partial success)
      errors.push(...result.errors);
    }
  }

  return { products, errors };
}

/**
 * Sort errors by severity (CRITICAL first, then WARNING)
 * Enables predictable client behavior when handling multiple errors
 */
function sortErrorsBySeverity(errors: FetchError[]): FetchError[] {
  return [...errors].sort((a, b) => {
    // CRITICAL errors come first
    if (
      a.severity === ErrorSeverity.CRITICAL &&
      b.severity !== ErrorSeverity.CRITICAL
    ) {
      return -1;
    }
    if (
      a.severity !== ErrorSeverity.CRITICAL &&
      b.severity === ErrorSeverity.CRITICAL
    ) {
      return 1;
    }
    // Within same severity, maintain original order (timestamp order from logError)
    return 0;
  });
}

export async function fetchHomeData(): Promise<FetchResponse<HomeData>> {
  // Step 1: Fetch categories (foundational data)
  const categoriesResult = await getCategories();

  // If categories fail (CRITICAL), return early with error
  if (categoriesResult.status === "error") {
    return {
      status: "error",
      data: null,
      errors: categoriesResult.errors,
    };
  }

  const categories = categoriesResult.data;
  const allErrors: FetchError[] = [];

  // Step 2: Fetch top 3 category products
  const [first, second, third, ...others] = categories;

  const { products: topCategoriesProducts, errors: topProductsErrors } =
    await fetchProductsForCategories({
      categories: [first, second, third],
      count: 3,
    });
  allErrors.push(...topProductsErrors);

  // Step 3: Fetch regular products from remaining categories
  const [fourth, fifth, sixth, seventh, eighth] = others;
  const { products: categoriesProducts, errors: regularProductsErrors } =
    await fetchProductsForCategories({
      categories: [fourth, fifth, sixth, seventh, eighth],
      count: 1,
    });
  allErrors.push(...regularProductsErrors);

  // Sort all errors by severity for consistent client handling
  const sortedErrors = sortErrorsBySeverity(allErrors);

  const homeData: HomeData = {
    categories,
    topCategoriesProducts,
    categoriesProducts,
  };

  // Return with status based on error presence
  // status: "error" if any errors exist, "success" if none
  if (sortedErrors.length > 0) {
    return {
      status: "error",
      data: homeData,
      errors: sortedErrors,
    };
  }

  return {
    status: "success",
    data: homeData,
    errors: [],
  };
}
