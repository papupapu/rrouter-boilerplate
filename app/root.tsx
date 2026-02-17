import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";

import { LayoutProvider } from "./context/layout/layout";
import { CategoriesProvider } from "./context/categories/categories";
import { ApiConfigProvider } from "./context/config/api";
import { MetadataProvider } from "./context/config/metadata";
import { getCategories, getApiConfig, getMetadata } from "./services/config";

import "./app.scss";

// In development mode, import non-critical CSS for HMR support
// In production, non-critical CSS is lazy-loaded via beasties-processor
if (import.meta.env.DEV) {
  import("./styles/non-critical-entry.scss");
}

export const links: Route.LinksFunction = () => [
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
];

/**
 * Root Loader - Global Data Fetching
 *
 * This loader runs on every page load (SSR) and provides data that should be
 * available throughout the entire application.
 *
 * Currently fetches:
 * - Categories: Product categories for navigation
 * - API Config: Endpoints, timeouts, retry policies
 * - Metadata: Site info, SEO defaults, OG/Twitter cards
 *
 * Configuration Architecture:
 * All configurations are initialized once at server startup (see app/entry.server.tsx)
 * and cached indefinitely in memory. The getter functions always return cached data
 * with zero network requests after server startup.
 *
 * Performance:
 * - Server startup: All configs loaded once (~200-500ms one-time cost)
 * - All requests: Read from cache (~1ms per getter, always cache hit)
 * - Cache lifetime: Infinite (refreshes only on server restart)
 *
 * Data Flow:
 * 1. Server starts → initializeConfig() loads and caches all configs
 * 2. Root loader calls getters → Returns cached data (~1ms each)
 * 3. App component receives data via useLoaderData()
 * 4. Context providers make data available to all child routes
 * 5. Components access via domain-specific hooks (useCategoriesState, useApiConfig, etc.)
 */
export async function loader() {
  const categories = await getCategories();
  const apiConfig = getApiConfig();
  const metadata = getMetadata();

  return {
    categories,
    apiConfig,
    metadata,
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <LayoutProvider>{children}</LayoutProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * App Component - Root Application Wrapper
 *
 * This component:
 * 1. Receives all configuration data from the root loader
 * 2. Wraps all routes with context providers to make configs globally available
 * 3. Renders child routes via <Outlet />
 *
 * Context Providers (hybrid approach):
 * - CategoriesProvider: Product categories for navigation
 * - ApiConfigProvider: API endpoints and configuration
 * - MetadataProvider: Site metadata and SEO defaults
 *
 * Important: Providers must be in App (not Layout) because:
 * - App has access to loader data via useLoaderData()
 * - Layout doesn't automatically receive root loader data
 * - This ensures all config is available to all routes
 */
export default function App() {
  // Get all configuration data from root loader
  const loaderData = useLoaderData<typeof loader>();

  return (
    // Provide all configurations to child routes via Context
    <ApiConfigProvider config={loaderData.apiConfig}>
      <MetadataProvider config={loaderData.metadata}>
        <CategoriesProvider categories={loaderData.categories}>
          <Outlet />
        </CategoriesProvider>
      </MetadataProvider>
    </ApiConfigProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
