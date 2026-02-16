/**
 * Home Services - Categories and Products API
 *
 * This service layer handles:
 * 1. Fetching categories from dummyJSON API with caching
 * 2. Fetching products for individual or multiple categories
 * 3. Managing in-memory cache to prevent duplicate API requests
 *
 * The caching strategy ensures that both root loader and home loader
 * can call getCategories() without making redundant HTTP requests.
 */

// ============================================================================
// Types
// ============================================================================

export type Category = {
  slug: string; // URL-friendly identifier (e.g., "smartphones")
  name: string; // Display name (e.g., "Smartphones")
  url: string; // Full API URL for category
};

export type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  images: string[];
  rating: number;
  stock: number;
};

export type ProductsResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Cache TTL (Time To Live) in milliseconds
 * Categories are cached for 60 seconds to avoid redundant API calls
 * within the same request cycle (root + home loaders)
 */
const CACHE_TTL = 60000; // 60 seconds

/**
 * In-memory cache for categories
 * Prevents duplicate HTTP requests when both root and home loaders
 * call getCategories() during the same page load
 */
let categoriesCache: {
  data: Category[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

// ============================================================================
// Categories API
// ============================================================================

/**
 * Fetch all product categories from dummyJSON API with caching
 *
 * This function is called by:
 * 1. Root loader (app/root.tsx) - fetches categories for global navigation
 * 2. Home loader (app/routes/home.tsx) - reuses cached categories for product fetching
 *
 * Cache behavior:
 * - First call: Makes HTTP request, stores in cache
 * - Subsequent calls (within 60s): Returns cached data, no HTTP request
 * - After TTL expires: Fetches fresh data, updates cache
 *
 * @returns Promise<Category[]> - Array of product categories
 */
export async function getCategories(): Promise<Category[]> {
  const now = Date.now();

  // Return cached data if fresh (within TTL)
  if (categoriesCache.data && now - categoriesCache.timestamp < CACHE_TTL) {
    console.log("[Categories] Using cached data");
    return categoriesCache.data;
  }

  // Fetch fresh data from API
  console.log("[Categories] Fetching from API");
  const response = await fetch("https://dummyjson.com/products/categories");
  const data = await response.json();

  // Update cache with fresh data
  categoriesCache.data = data;
  categoriesCache.timestamp = now;

  return data;
}

/**
 * Clear the categories cache
 * Useful for testing or manual cache invalidation
 */
export function clearCategoriesCache(): void {
  console.log("[Categories] Cache cleared");
  categoriesCache.data = null;
  categoriesCache.timestamp = 0;
}

// ============================================================================
// Products API
// ============================================================================

/**
 * Fetch products for a specific category
 *
 * @param categorySlug - The category slug (e.g., "smartphones")
 * @returns Promise<Product[]> - Array of products in this category
 */
export async function getCategoryProducts(
  categorySlug: string
): Promise<Product[]> {
  console.log(`[Products] Fetching products for category: ${categorySlug}`);
  const response = await fetch(
    `https://dummyjson.com/products/category/${categorySlug}`
  );
  const data: ProductsResponse = await response.json();
  return data.products;
}

/**
 * Fetch products for all categories in parallel
 *
 * This function is used by the home route to load products for all categories
 * simultaneously, improving performance vs sequential fetching.
 *
 * @param categories - Array of categories to fetch products for
 * @returns Promise<Record<string, Product[]>> - Object keyed by category slug
 *
 * Example return value:
 * {
 *   "smartphones": [{ id: 1, title: "iPhone" }, ...],
 *   "laptops": [{ id: 20, title: "MacBook" }, ...]
 * }
 */
export async function getAllCategoryProducts(
  categories: Category[]
): Promise<Record<string, Product[]>> {
  console.log(
    `[Products] Fetching products for ${categories.length} categories in parallel`
  );

  // Fetch all category products in parallel using Promise.all
  const productsPromises = categories.map(async (category) => ({
    slug: category.slug,
    products: await getCategoryProducts(category.slug),
  }));

  const productsResults = await Promise.all(productsPromises);

  // Convert array to object keyed by category slug for easy lookup
  const categoryProducts: Record<string, Product[]> = {};
  productsResults.forEach(({ slug, products }) => {
    categoryProducts[slug] = products;
  });

  console.log(`[Products] Successfully fetched products for all categories`);
  return categoryProducts;
}
