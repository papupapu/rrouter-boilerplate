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
import { getCategories } from "./services/home";

import "./app.scss";

// In development mode, import non-critical CSS for HMR support
// In production, non-critical CSS is lazy-loaded via beasties-processor
if (import.meta.env.DEV) {
  import("./styles/non-critical-entry.scss");
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;500;700&display=swap",
  },
];

/**
 * Root Loader - Global Data Fetching
 *
 * This loader runs on every page load (SSR) and provides data that should be
 * available throughout the entire application.
 *
 * Currently fetches:
 * - Categories: Used for global navigation in Header component
 *
 * Caching:
 * The getCategories() function uses an in-memory cache, so when the home route
 * also calls getCategories(), it won't make a duplicate HTTP request.
 *
 * Data Flow:
 * 1. Root loader fetches categories
 * 2. App component receives data via useLoaderData()
 * 3. CategoriesProvider makes data available to all child routes
 * 4. Components access via useCategoriesState() hook
 */
export async function loader() {
  const categories = await getCategories();
  return { categories };
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
 * 1. Receives data from the root loader
 * 2. Wraps all routes with CategoriesProvider to make categories globally available
 * 3. Renders child routes via <Outlet />
 *
 * Important: CategoriesProvider must be in App (not Layout) because:
 * - App has access to loader data via useLoaderData()
 * - Layout doesn't automatically receive root loader data
 * - This ensures categories are available to all routes
 */
export default function App() {
  // Get categories from root loader
  const loaderData = useLoaderData<typeof loader>();

  return (
    // Provide categories to all child routes via Context
    <CategoriesProvider categories={loaderData.categories}>
      <Outlet />
    </CategoriesProvider>
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
