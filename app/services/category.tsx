/**
 * Category Service - Category API
 *
 * Fetches category data from API.
 * API endpoint is configured in app/config/api.config.json
 */

import { getCategoryProducts } from "./common";

export async function getProductsByCategorySlug(slug: string) {
  const products = await getCategoryProducts(slug);
  return products;
}
