/**
 * ErrorBanner Component
 *
 * Dismissible warning banner for top-of-page error notifications.
 * Used for non-blocking, non-critical errors that don't prevent rendering.
 *
 * More compact than ErrorAlert, intended for banner display above main content.
 */

import { useState } from "react";
import type { FetchError } from "../../utils/errorTypes";
import "./error-banner.scss";

interface ErrorBannerProps {
  /** Array of FetchError objects to display (typically 1-2 errors) */
  errors: FetchError[];
  /** Optional callback when banner is dismissed */
  onDismiss?: () => void;
}

export function ErrorBanner({ errors, onDismiss }: ErrorBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || errors.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Show first error in banner, rest are in details
  const primaryError = errors[0];
  const additionalErrorCount = errors.length - 1;

  return (
    <div className="error-banner" role="alert" aria-live="polite">
      <div className="error-banner__content">
        <span className="error-banner__icon">⚠️</span>
        <div className="error-banner__text">
          <p className="error-banner__message">
            {primaryError.message}
            {additionalErrorCount > 0 && (
              <span className="error-banner__additional">
                {" "}
                (+{additionalErrorCount} more)
              </span>
            )}
          </p>
        </div>
      </div>

      <button
        className="error-banner__close-button"
        onClick={handleDismiss}
        type="button"
        aria-label="Dismiss error banner"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
