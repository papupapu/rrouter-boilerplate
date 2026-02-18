/**
 * Header Component - Global Navigation
 *
 * This component demonstrates using the CategoriesContext to display
 * dynamic navigation based on categories initialized at server startup.
 *
 * Features:
 * - Sidebar toggle functionality (existing)
 * - Dynamic category links from Context API (new)
 * - Appears on all pages via layout routes
 *
 * Data flow:
 * 1. Server startup: Categories fetched from API and cached (app/entry.server.tsx)
 * 2. Root loader: Reads cached categories (~1ms, always cache hit)
 * 3. CategoriesProvider: Makes them available globally via context
 * 4. Header: Uses useCategoriesState() hook to access categories
 * 5. Categories rendered as navigation links
 *
 * Benefits:
 * - No need to pass categories as props
 * - Zero runtime API calls (categories initialized at server startup)
 * - Works across all routes (home, about, etc.)
 * - Always available, no loading states needed
 */

import { useLayoutActionsToggleSidebar } from "../../../context/layout/layout";
import Hamburger from "../icons/hamburger";

import Icon from "../icons/icons";

const Header = () => {
  // Get sidebar toggle function from LayoutContext
  const toggleSidebar = useLayoutActionsToggleSidebar();

  return (
    <div className="header flex p--200 gap--200 items-center c-bg--primary bb--md c-br--fourth">
      <button
        type="button"
        className="p--0 flex-item-fixed flex items-center c-txt--secondary clickable c-bg--transparent b--0"
        onClick={toggleSidebar}
      >
        <Icon name={Hamburger} className="icon--md" />
      </button>
      <div className="flex-item-stretch tp-w--l c-txt--primary">HEADER</div>
    </div>
  );
};

export default Header;
