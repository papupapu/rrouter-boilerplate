/**
 * ErrorAlert Component
 *
 * Multi-error list display for WARNING severity errors.
 * Shows when data fetch partially succeeds but some operations fail.
 * Includes inline retry buttons for retriable errors.
 *
 * Example: Some product categories fail to load → shows alert with retry buttons
 *          while rendering successfully loaded categories
 */

import { useState } from "react";
import type { FetchError } from "../../utils/errorTypes";
import "./error-alert.scss";

interface ErrorAlertProps {
  /** Array of FetchError objects to display */
  errors: FetchError[];
  /** Optional callback for retry button - called with the specific error */
  onRetry?: (error: FetchError) => void;
  /** Optional callback when alert is dismissed */
  onDismiss?: () => void;
}

export function ErrorAlert({ errors, onRetry, onDismiss }: ErrorAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || errors.length === 0) {
    return null;
  }

  const handleRetry = (error: FetchError) => {
    if (onRetry) {
      onRetry(error);
    } else if (
      typeof globalThis !== "undefined" &&
      globalThis.window &&
      globalThis.window.location
    ) {
      // Default behavior: reload page (client-side only)
      globalThis.window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="error-alert" role="alert" aria-live="polite">
      <div className="error-alert__header">
        <div className="error-alert__icon">⚠️</div>
        <h2 className="error-alert__title">
          {errors.length === 1
            ? "There was a problem loading some data"
            : `There were ${errors.length} problems loading some data`}
        </h2>
        <button
          className="error-alert__close-button"
          onClick={handleDismiss}
          type="button"
          aria-label="Dismiss error alert"
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="error-alert__content">
        <ul className="error-alert__list">
          {errors.map((error) => (
            <li key={error.code} className="error-alert__item">
              <div className="error-alert__error-message">{error.message}</div>

              <div className="error-alert__error-details">
                <span className="error-alert__code">{error.code}</span>
                <span className="error-alert__type">{error.type}</span>
              </div>

              {error.retriable && (
                <button
                  className="error-alert__retry-button"
                  onClick={() => handleRetry(error)}
                  type="button"
                  aria-label={`Retry ${error.code}`}
                >
                  Retry
                </button>
              )}

              {!error.retriable && (
                <div className="error-alert__non-retriable-badge">
                  Cannot retry
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
