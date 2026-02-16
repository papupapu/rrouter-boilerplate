/**
 * Header Component - Global Navigation
 *
 * This component demonstrates using the CategoriesContext to display
 * dynamic navigation based on the categories fetched from the API.
 *
 * Features:
 * - Sidebar toggle functionality (existing)
 * - Dynamic category links from Context API (new)
 * - Appears on all pages via layout routes
 *
 * Data flow:
 * 1. Root loader fetches categories
 * 2. CategoriesProvider makes them available globally
 * 3. Header uses useCategoriesState() hook to access categories
 * 4. Categories rendered as navigation links
 *
 * Benefits:
 * - No need to pass categories as props
 * - Automatically updates if categories change
 * - Works across all routes (home, about, etc.)
 */

import { Link } from "react-router";
import { useLayoutActionsToggleSidebar } from "../../../context/layout/layout";
import { useCategoriesState } from "../../../context/categories/categories";

const Header = () => {
  // Get sidebar toggle function from LayoutContext
  const toggleSidebar = useLayoutActionsToggleSidebar();

  // Get categories from CategoriesContext (populated by root loader)
  const categories = useCategoriesState();

  console.log(categories);

  return (
    <div className="header c-bg--fourth">
      {/* Sidebar toggle area */}
      <div
        className="p--200"
        onClick={toggleSidebar}
        style={{ cursor: "pointer" }}
      >
        header (click to toggle sidebar)
      </div>

      {/* Main navigation with dynamic category links */}
      <nav className="p--200 flex gap--200" style={{ flexWrap: "wrap" }}>
        {/* Home link */}
        <Link to="/" className="c-txt--brand">
          Home
        </Link>

        {/* Dynamic category links from API */}
        {categories?.map((category) => (
          <Link
            key={category.slug}
            to={`/${category.slug}`}
            className="c-txt--secondary"
          >
            {category.name}
          </Link>
        ))}

        {/* About link */}
        <Link to="/about" className="c-txt--brand">
          About
        </Link>
      </nav>
    </div>
  );
};

export default Header;
