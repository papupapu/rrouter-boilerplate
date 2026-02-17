/**
 * Categories Service - Server Startup Initialization
 *
 * This service manages the categories lifecycle:
 * 1. Initialized once at server startup (app/entry.server.tsx)
 * 2. Cached indefinitely in memory
 * 3. Accessed by route loaders via getCategories()
 *
 * Performance characteristics:
 * - Initialization: ~200ms (one-time cost at server startup)
 * - Runtime access: ~1ms (always cache hit)
 * - Network calls: 0 after initialization
 */

// ============================================================================
// Types
// ============================================================================

export type Category = {
  slug: string; // URL-friendly identifier (e.g., "smartphones")
  name: string; // Display name (e.g., "Smartphones")
  url: string; // Full API URL for category
};

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * In-memory cache for categories
 * Initialized at server startup via initializeCategories()
 */
let categoriesCache: {
  data: Category[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

// ============================================================================
// API Constants
// ============================================================================

const CATEGORIES_API_URL = "https://dummyjson.com/products/categories";

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize categories at server startup
 *
 * This function should be called once when the server starts (in entry.server.tsx)
 * It fetches categories from the API and caches them indefinitely in memory.
 *
 * @param options - Configuration options
 * @param options.force - Force refresh even if cache exists (default: false)
 *
 * @throws Error if API request fails
 *
 * @example
 * // In app/entry.server.tsx (top-level)
 * await initializeCategories();
 * console.log("[Server] Categories initialized");
 */
export async function initializeCategories(options?: {
  force?: boolean;
}): Promise<void> {
  const { force = false } = options || {};

  // Skip if already initialized (unless forced)
  if (!force && categoriesCache.data) {
    console.log("[Categories] Already initialized, skipping...");
    return;
  }

  console.log("[Categories] Initializing from API...");

  try {
    const response = await fetch(CATEGORIES_API_URL);

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Update cache with indefinite TTL
    categoriesCache.data = data;
    categoriesCache.timestamp = Date.now();

    console.log(`[Categories] ✅ Initialized ${data.length} categories`);
  } catch (error) {
    console.error("[Categories] ❌ Initialization failed:", error);
    throw new Error(
      `Failed to initialize categories: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get categories from cache
 *
 * This function is called by route loaders to access the cached categories.
 * It does NOT make network requests - categories must be initialized first
 * via initializeCategories() at server startup.
 *
 * @returns Promise<Category[]> - Array of product categories
 *
 * @throws Error if categories not initialized
 *
 * @example
 * // In route loader
 * export async function loader() {
 *   const categories = await getCategories();
 *   return { categories };
 * }
 */
export async function getCategories(): Promise<Category[]> {
  // Fail-fast if not initialized
  if (!categoriesCache.data) {
    throw new Error(
      "Categories not initialized. Call initializeCategories() at server startup."
    );
  }

  // Cache is always valid (infinite TTL)
  return categoriesCache.data;
}

/**
 * Clear the categories cache
 *
 * Useful for:
 * - Manual cache invalidation via admin endpoint
 * - Testing scenarios
 * - Forcing a refresh without server restart
 *
 * Note: After clearing, you must call initializeCategories() again
 *
 * @example
 * // Admin endpoint to refresh categories
 * export async function action() {
 *   clearCategoriesCache();
 *   await initializeCategories();
 *   return { message: "Categories refreshed" };
 * }
 */
export function clearCategoriesCache(): void {
  console.log("[Categories] Cache cleared");
  categoriesCache.data = null;
  categoriesCache.timestamp = 0;
}

/**
 * Get cache status metadata
 *
 * Useful for:
 * - Health check endpoints
 * - Debugging and monitoring
 * - Verifying initialization status
 *
 * @returns Cache status information
 *
 * @example
 * // Health check endpoint
 * export async function loader() {
 *   const status = getCategoriesCacheStatus();
 *   return {
 *     healthy: status.initialized,
 *     cacheAge: Date.now() - status.timestamp
 *   };
 * }
 */
export function getCategoriesCacheStatus(): {
  initialized: boolean;
  timestamp: number;
  cacheAge: number;
} {
  return {
    initialized: categoriesCache.data !== null,
    timestamp: categoriesCache.timestamp,
    cacheAge: categoriesCache.timestamp
      ? Date.now() - categoriesCache.timestamp
      : 0,
  };
}
