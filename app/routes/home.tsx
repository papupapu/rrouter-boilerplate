/**
 * Home Route - Main Landing Page
 *
 * This route displays product categories with their respective products.
 * It demonstrates the cascading data fetching pattern:
 * 1. Root loader fetches categories (cached)
 * 2. Home loader reuses categories (cache hit, no HTTP request)
 * 3. Home loader fetches products for all categories in parallel
 * 4. View component displays categories and products
 */

import type { Route } from "./+types/home";

import * as homeServices from "../services/home";

import { Home } from "../views/home/home";

export function meta() {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

/**
 * Home Loader - Dependent Data Fetching
 *
 * Fetches data needed for the home page:
 * 1. Categories - Uses cached data from root loader (no duplicate HTTP request)
 * 2. Category Products - Fetches products for all categories in parallel
 *
 * Performance:
 * - Categories: ~1ms (cache hit)
 * - Products: ~200-500ms (parallel API requests for N categories)
 * - Total: Max of all parallel product requests
 */
export async function loader() {
  // Get categories (uses cache from root loader, no HTTP request)
  const categories = await homeServices.getCategories();

  // Fetch products for all categories in parallel
  const categoryProducts =
    await homeServices.getAllCategoryProducts(categories);

  return { categories, categoryProducts };
}

/**
 * Home Route Component
 * Passes loader data to the view component for rendering
 */
export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home data={loaderData} />;
}
