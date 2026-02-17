/**
 * Metadata Configuration Context
 *
 * Provides access to site metadata, SEO defaults, and social card
 * configurations throughout the application via React Context.
 *
 * Data source: app/services/config.tsx (getMetadata)
 */

import type { FC, ReactNode } from "react";
import { createContext, useMemo } from "react";
import { useContextSelector } from "use-context-selector";
import type { MetadataConfig } from "~/services/config";

// ============================================================================
// Context Definition
// ============================================================================

const MetadataContext = createContext<{
  config: MetadataConfig;
} | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Metadata Configuration Provider
 *
 * Wraps the application to provide site metadata via context.
 * Must be used inside a route that has metadata config in its loader data.
 *
 * @example
 * // In root.tsx App component
 * <MetadataProvider config={loaderData.metadata}>
 *   <Outlet />
 * </MetadataProvider>
 */
export const MetadataProvider: FC<{
  config: MetadataConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  const value = useMemo(() => ({ config }), [config]);

  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get complete metadata configuration from context
 *
 * Returns site info, SEO defaults, Open Graph, and Twitter card config.
 *
 * @returns MetadataConfig | undefined
 *
 * @example
 * function MyComponent() {
 *   const metadata = useMetadata();
 *   const siteName = metadata?.site.name;
 *   // ...
 * }
 */
export const useMetadata = () =>
  useContextSelector(MetadataContext, (value) => value?.config);

/**
 * Get site information from context
 *
 * Convenience hook to access just the site info object.
 *
 * @returns MetadataConfig['site'] | undefined
 *
 * @example
 * function Footer() {
 *   const site = useSiteInfo();
 *   return <p>&copy; {site?.name}</p>;
 * }
 */
export const useSiteInfo = () =>
  useContextSelector(MetadataContext, (value) => value?.config.site);

/**
 * Get SEO defaults from context
 *
 * Convenience hook to access default SEO values.
 *
 * @returns MetadataConfig['defaults'] | undefined
 *
 * @example
 * function PageHead() {
 *   const defaults = useSeoDefaults();
 *   return <title>{defaults?.title}</title>;
 * }
 */
export const useSeoDefaults = () =>
  useContextSelector(MetadataContext, (value) => value?.config.defaults);

/**
 * Get Open Graph configuration from context
 *
 * Convenience hook to access Open Graph meta tag defaults.
 *
 * @returns MetadataConfig['openGraph'] | undefined
 *
 * @example
 * function OpenGraphTags() {
 *   const og = useOpenGraph();
 *   return <meta property="og:site_name" content={og?.siteName} />;
 * }
 */
export const useOpenGraph = () =>
  useContextSelector(MetadataContext, (value) => value?.config.openGraph);

/**
 * Get Twitter card configuration from context
 *
 * Convenience hook to access Twitter card meta tag defaults.
 *
 * @returns MetadataConfig['twitter'] | undefined
 *
 * @example
 * function TwitterTags() {
 *   const twitter = useTwitterCard();
 *   return <meta name="twitter:card" content={twitter?.card} />;
 * }
 */
export const useTwitterCard = () =>
  useContextSelector(MetadataContext, (value) => value?.config.twitter);
