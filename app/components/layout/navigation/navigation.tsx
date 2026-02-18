import { Link } from "react-router";
import { useLayoutActionsToggleSidebar } from "../../../context/layout/layout";
import { useCategoriesState } from "../../../context/categories/categories";

import "./navigation.scss";

const Navigation = () => {
  // Get sidebar toggle function from LayoutContext
  const toggleSidebar = useLayoutActionsToggleSidebar();

  // Get categories from CategoriesContext (populated by root loader)
  const categories = useCategoriesState();

  return (
    <>
      <div className="navigation flex">
        <div className="navigation__content w--100 c-bg--primary tp--nwr overflow-y-auto">
          <nav className="flex flex-column gap--200 pt--400 pr--200 pb--400 pl--200">
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
      </div>
      <button
        className="navigation__overlayer absolute w--full h--full b--0 c-bg--overlayer"
        type="button"
        onClick={toggleSidebar}
        aria-label="Toggle navigation"
      />
    </>
  );
};

export default Navigation;
