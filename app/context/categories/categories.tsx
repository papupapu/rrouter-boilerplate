/**
 * Categories Context Provider
 *
 * This context makes the categories list available globally throughout the app.
 * Categories are initialized once at server startup (app/entry.server.tsx) and
 * cached indefinitely. The root loader (app/root.tsx) reads from this cache and
 * provides the data to all child routes via this context.
 *
 * Architecture:
 * 1. Server starts → Categories fetched from API and cached (app/entry.server.tsx)
 * 2. Root loader → Reads cached categories (app/root.tsx)
 * 3. CategoriesProvider → Makes data available globally via context
 * 4. Components → Access via useCategoriesState() hook
 *
 * Usage in components:
 * ```tsx
 * import { useCategoriesState } from "~/context/categories/categories";
 *
 * function MyComponent() {
 *   const categories = useCategoriesState();
 *   return (
 *     <nav>
 *       {categories?.map(cat => <Link to={cat.slug}>{cat.name}</Link>)}
 *     </nav>
 *   );
 * }
 * ```
 *
 * Benefits:
 * - Single source of truth for categories across all routes
 * - No prop drilling required
 * - Optimized re-renders using use-context-selector
 * - Zero runtime API calls (categories fetched only at server startup)
 * - Categories available in Header, navigation, and any component
 */

import { useMemo } from "react";
import { createContext, useContextSelector } from "use-context-selector";

import type { Category } from "~/services/config";

/**
 * Context for storing categories list
 * Uses use-context-selector for optimized re-renders
 */
const CategoriesContext = createContext<{
  categories: Category[];
} | null>(null);

/**
 * Provider component that wraps the app with categories data
 *
 * @param categories - Array of categories from root loader
 * @param children - Child components that need access to categories
 */
export const CategoriesProvider = ({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) => {
  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(() => ({ categories }), [categories]);

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};

/**
 * Hook to access categories from context
 *
 * Uses useContextSelector for optimized re-renders - components only
 * re-render when categories actually change, not when other context
 * values update.
 *
 * @returns Category[] | undefined - Array of categories or undefined if not yet loaded
 */
export const useCategoriesState = () =>
  useContextSelector(CategoriesContext, (value) => value?.categories);
