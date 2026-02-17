/**
 * Home Services - Products API
 *
 * This service layer handles fetching products for individual or multiple categories.
 * Categories are managed in the unified config system (app/services/config.tsx)
 * API endpoints are configured in app/config/api.config.json
 */

import type { Category } from "./config";
import { getApiConfig } from "./config";

// ============================================================================
// Types
// ============================================================================

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
// Products API
// ============================================================================

/**
 * Fetch products for a specific category
 *
 * API endpoint is configured in app/config/api.config.json
 *
 * @param categorySlug - The category slug (e.g., "smartphones")
 * @returns Promise<Product[]> - Array of products in this category
 */
export async function getCategoryProducts(
  categorySlug: string
): Promise<Product[]> {
  console.log(`[Products] Fetching products for category: ${categorySlug}`);

  // Get API endpoint from config
  const apiConfig = getApiConfig();
  const url = apiConfig.endpoints.productsByCategory.replace(
    "{slug}",
    categorySlug
  );

  const response = await fetch(url);
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
