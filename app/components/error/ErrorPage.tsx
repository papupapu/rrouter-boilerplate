/**
 * ErrorPage Component
 * @critical
 *
 * Full-page error display for CRITICAL failures.
 * Shows when data fetch completely fails and no partial data is available.
 *
 * Example: Categories fetch fails → entire home page shows this error
 */

import type { FetchError } from "../../utils/errorTypes";
import "./error-page.scss";

interface ErrorPageProps {
  /** Primary error to display */
  error: FetchError;
  /** Optional callback for retry button */
  onRetry?: () => void;
}

export function ErrorPage({ error, onRetry }: ErrorPageProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (
      typeof globalThis !== "undefined" &&
      globalThis.window &&
      globalThis.window.location
    ) {
      // Default behavior: reload page (client-side only)
      globalThis.window.location.reload();
    }
  };

  return (
    <main className="error-page">
      <div className="error-page__container">
        <div className="error-page__icon">⚠️</div>

        <h1 className="error-page__title">Unable to Load Page</h1>

        <p className="error-page__message">{error.message}</p>

        <div className="error-page__details">
          <dl>
            <dt>Error Code:</dt>
            <dd>{error.code}</dd>

            <dt>Error Type:</dt>
            <dd>{error.type}</dd>

            <dt>Time:</dt>
            <dd>{new Date(error.timestamp).toLocaleTimeString()}</dd>
          </dl>
        </div>

        {error.retriable && (
          <button
            className="error-page__retry-button"
            onClick={handleRetry}
            type="button"
            aria-label="Retry loading page"
          >
            Retry
          </button>
        )}

        {!error.retriable && (
          <p className="error-page__non-retriable">
            This error cannot be automatically retried. Please try again later
            or contact support if the problem persists.
          </p>
        )}
      </div>
    </main>
  );
}
