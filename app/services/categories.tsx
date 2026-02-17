/**
 * Categories Service - Facade over Configuration System
 *
 * ⚠️ DEPRECATION NOTICE:
 * This file now serves as a backward-compatibility facade over the unified
 * configuration system (app/services/config.tsx). New code should import
 * directly from the config service.
 *
 * Migration path:
 * - Old: import { getCategories } from "~/services/categories"
 * - New: import { getCategories } from "~/services/config"
 *
 * This facade will be maintained for backward compatibility but may be
 * removed in a future major version.
 *
 * Categories are now part of the unified application configuration:
 * 1. Initialized at server startup via initializeConfig() (app/entry.server.tsx)
 * 2. Fetched from remote API (configured in app/config/remote.config.json)
 * 3. Cached indefinitely in memory with other configs
 * 4. Accessed by route loaders via getCategories()
 *
 * Performance characteristics:
 * - Initialization: ~200-500ms (one-time cost at server startup, shared with all configs)
 * - Runtime access: ~1ms (always cache hit)
 * - Network calls: 0 after initialization
 */

import {
  initializeConfig,
  getCategories as getConfigCategories,
  clearConfigCache,
  getConfigStatus,
  type Category,
} from "./config";

// ============================================================================
// Type Re-exports
// ============================================================================

/**
 * Category type (re-exported from config service)
 *
 * @deprecated Import from "~/services/config" instead
 */
export type { Category };

// ============================================================================
// Facade Functions
// ============================================================================

/**
 * Initialize categories at server startup
 *
 * This function now calls the unified configuration initialization.
 * Categories are initialized as part of the complete app configuration.
 *
 * @param options - Configuration options
 * @param options.force - Force refresh even if cache exists (default: false)
 *
 * @throws Error if configuration initialization fails
 *
 * @deprecated Use initializeConfig() from "~/services/config" instead
 *
 * @example
 * // In app/entry.server.tsx (top-level)
 * await initializeCategories();
 * console.log("[Server] Categories initialized");
 */
export async function initializeCategories(options?: {
  force?: boolean;
}): Promise<void> {
  // Delegate to unified config initialization
  await initializeConfig(options);
}

/**
 * Get categories from cache
 *
 * This function is called by route loaders to access the cached categories.
 * It does NOT make network requests - categories must be initialized first
 * via initializeCategories() (or initializeConfig()) at server startup.
 *
 * @returns Promise<Category[]> - Array of product categories
 *
 * @throws Error if configuration not initialized
 *
 * @deprecated Use getCategories() from "~/services/config" instead
 *
 * @example
 * // In route loader
 * export async function loader() {
 *   const categories = await getCategories();
 *   return { categories };
 * }
 */
export async function getCategories(): Promise<Category[]> {
  // Delegate to config service (returns synchronously, wrap in Promise for compatibility)
  return Promise.resolve(getConfigCategories());
}

/**
 * Clear the categories cache
 *
 * This function now clears the entire configuration cache, not just categories.
 * After clearing, you must call initializeCategories() or initializeConfig() again.
 *
 * Useful for:
 * - Manual cache invalidation via admin endpoint
 * - Testing scenarios
 * - Forcing a refresh without server restart
 *
 * @deprecated Use clearConfigCache() from "~/services/config" instead
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
  console.log("[Categories] Clearing cache (delegates to config service)...");
  clearConfigCache();
}

/**
 * Get cache status metadata
 *
 * This function now returns the unified configuration cache status.
 *
 * Useful for:
 * - Health check endpoints
 * - Debugging and monitoring
 * - Verifying initialization status
 *
 * @returns Cache status information
 *
 * @deprecated Use getConfigStatus() from "~/services/config" instead
 *
 * @example
 * // Health check endpoint
 * export async function loader() {
 *   const status = getCategoriesCacheStatus();
 *   return {
 *     healthy: status.initialized,
 *     cacheAge: status.cacheAge
 *   };
 * }
 */
export function getCategoriesCacheStatus(): {
  initialized: boolean;
  timestamp: number;
  cacheAge: number;
} {
  // Delegate to config service
  return getConfigStatus();
}
