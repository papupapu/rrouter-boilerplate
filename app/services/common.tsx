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
  const {
    baseUrls: { dummyJson },
    endpoints: { productsByCategory },
  } = apiConfig;

  const url = `${dummyJson}${productsByCategory}`.replace(
    "{slug}",
    categorySlug
  );
  const response = await fetch(url);
  const data: ProductsResponse = await response.json();
  return data.products;
}
