import { Link } from "react-router";
import type { FetchResponse } from "../../utils/errorTypes";
import type { HomeData } from "../../services/home";
// import type { Category } from "../../services/utils/getCategories";
import {
  hasCriticalError,
  getCriticalError,
  getWarningErrors,
} from "../../utils/errorHelpers";
import { ErrorPage } from "../../components/error/ErrorPage";
import { ErrorAlert } from "../../components/error/ErrorAlert";

interface HomeProps {
  data: FetchResponse<HomeData>;
}

export function Home({ data }: HomeProps) {
  // Handle CRITICAL errors - show error page only
  if (hasCriticalError(data.errors)) {
    const criticalError = getCriticalError(data.errors);
    return <ErrorPage error={criticalError!} />;
  }

  // Handle WARNING errors - show alert + partial data
  const warningErrors = getWarningErrors(data.errors);
  const handleRetry = () => {
    if (
      typeof globalThis !== "undefined" &&
      globalThis.window &&
      globalThis.window.location
    ) {
      globalThis.window.location.reload();
    }
  };

  return (
    <main className="p--200">
      {warningErrors.length > 0 && (
        <ErrorAlert errors={warningErrors} onRetry={handleRetry} />
      )}

      <div className="tp-w--s">
        <h1>Home</h1>

        {/* {data.data && (
          <section>
            <h2>Categories ({data.data.categories.length})</h2>
            <ul>
              {data.data.categories.map((category: Category) => (
                <li key={category}>{category}</li>
              ))}
            </ul>
          </section>
        )} */}
      </div>

      <Link to="/about">Go to about page</Link>
    </main>
  );
}
