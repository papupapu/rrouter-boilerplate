/**
 * Categories Context Provider
 *
 * This context makes the categories list available globally throughout the app.
 * It's populated from the root loader (app/root.tsx) which fetches categories
 * on initial page load.
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
 * - Categories available in Header, navigation, and any component
 */

import { useMemo } from "react";
import { createContext, useContextSelector } from "use-context-selector";

import type { Category } from "../../services/home";

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
