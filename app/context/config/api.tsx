/**
 * API Configuration Context
 *
 * Provides access to API endpoints, timeouts, and retry policies
 * throughout the application via React Context.
 *
 * Data source: app/services/config.tsx (getApiConfig)
 */

import type { FC, ReactNode } from "react";
import { createContext, useMemo } from "react";
import { useContextSelector } from "use-context-selector";
import type { ApiConfig } from "~/services/config";

// ============================================================================
// Context Definition
// ============================================================================

const ApiConfigContext = createContext<{
  config: ApiConfig;
} | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * API Configuration Provider
 *
 * Wraps the application to provide API configuration via context.
 * Must be used inside a route that has api config in its loader data.
 *
 * @example
 * // In root.tsx App component
 * <ApiConfigProvider config={loaderData.apiConfig}>
 *   <Outlet />
 * </ApiConfigProvider>
 */
export const ApiConfigProvider: FC<{
  config: ApiConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  const value = useMemo(() => ({ config }), [config]);

  return (
    <ApiConfigContext.Provider value={value}>
      {children}
    </ApiConfigContext.Provider>
  );
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get API configuration from context
 *
 * Returns the complete API configuration including endpoints,
 * base URLs, timeouts, and retry policies.
 *
 * @returns ApiConfig | undefined
 *
 * @example
 * function MyComponent() {
 *   const apiConfig = useApiConfig();
 *   const categoriesUrl = apiConfig?.endpoints.categories;
 *   // ...
 * }
 */
export const useApiConfig = () =>
  useContextSelector(ApiConfigContext, (value) => value?.config);

/**
 * Get API endpoints from context
 *
 * Convenience hook to access just the endpoints object.
 *
 * @returns ApiConfig['endpoints'] | undefined
 *
 * @example
 * function MyComponent() {
 *   const endpoints = useApiEndpoints();
 *   const categoriesUrl = endpoints?.categories;
 *   // ...
 * }
 */
export const useApiEndpoints = () =>
  useContextSelector(ApiConfigContext, (value) => value?.config.endpoints);

/**
 * Get API base URLs from context
 *
 * Convenience hook to access just the base URLs object.
 *
 * @returns ApiConfig['baseUrls'] | undefined
 *
 * @example
 * function MyComponent() {
 *   const baseUrls = useApiBaseUrls();
 *   const dummyJsonUrl = baseUrls?.dummyJson;
 *   // ...
 * }
 */
export const useApiBaseUrls = () =>
  useContextSelector(ApiConfigContext, (value) => value?.config.baseUrls);
