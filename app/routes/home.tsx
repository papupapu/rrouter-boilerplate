/**
 * Home Route - Main Landing Page
 *
 * This route displays product categories with their respective products.
 * It demonstrates the optimized data fetching pattern:
 * 1. Server startup: Categories initialized once and cached indefinitely
 * 2. Root loader: Returns cached categories (always cache hit, ~1ms)
 * 3. Home loader: Returns cached categories (always cache hit, ~1ms)
 * 4. Home loader: Fetches products for all categories in parallel (~400ms)
 * 5. View component: Displays categories and products
 *
 * Performance:
 * - No categories API calls after server startup
 * - Only product fetching happens at runtime
 * - Total loader time: ~400ms (products only)
 */

import type { Route } from "./+types/home";

import { getCategories } from "~/services/categories";
import { getAllCategoryProducts } from "~/services/home";

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
 * 1. Categories - Returns from startup-initialized cache (infinite TTL)
 * 2. Category Products - Fetches products for all categories in parallel
 *
 * Performance:
 * - Categories: ~1ms (always cache hit, initialized at server startup)
 * - Products: ~200-500ms (parallel API requests for N categories)
 * - Total: ~200-500ms (only products are fetched at runtime)
 *
 * Note: getCategories() never makes HTTP requests after server startup.
 * Categories are fetched once during initialization (app/entry.server.tsx).
 */
export async function loader() {
  // Get categories (uses cache from root loader, no HTTP request)
  const categories = await getCategories();

  // Fetch products for all categories in parallel
  const categoryProducts = await getAllCategoryProducts(categories);

  return { categories, categoryProducts };
}

/**
 * Home Route Component
 * Passes loader data to the view component for rendering
 */
export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home data={loaderData} />;
}
