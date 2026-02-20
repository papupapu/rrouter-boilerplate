import { Link } from "react-router";
import { useLayoutActionsToggleSidebar } from "../../../context/layout/layout";
import { useCategoriesState } from "../../../context/categories/categories";

import Hamburger from "../icons/hamburger";
import Icon from "../icons/icons";

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
          <nav className="flex flex-column gap--200 pt--200 pb--400">
            <div className="navigation__logo flex justify-between mr--250 ml--250 bb--md c-br--fourth">
              <p className="tp-w--l c-txt--primary">SITENAME</p>
              <button
                type="button"
                className="p--0 flex-item-fixed flex items-center c-txt--secondary clickable c-bg--transparent b--0"
                onClick={toggleSidebar}
              >
                <Icon name={Hamburger} className="icon--md" />
              </button>
            </div>
            <Link to="/" className="pl--250 tp-s--xs tp-w--m c-txt--secondary">
              Home
            </Link>
            <div className="mr--200 ml--200 pt--150 pb--200 pl--150 c-bg--tertiary b-r--md">
              <h3 className="tp-s--xxs tp-w--l tp--up c-txt--secondary">
                Categories
              </h3>
              <ul className="flex flex-column mt--150">
                {categories?.map((category, index) => (
                  <li
                    key={category.slug}
                    className={`${index > 0 ? "pt--100 " : ""}${index < categories.length - 1 ? "pb--100 " : ""}pl--150 bl--lg c-br--tertiary`}
                  >
                    <Link
                      to={`/${category.slug}`}
                      className="tp-s--xs tp-w--m c-txt--secondary"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/about"
              className="pl--250 tp-s--xs tp-w--m c-txt--secondary"
            >
              About
            </Link>
            <Link
              to="/contacts"
              className="pl--250 tp-s--xs tp-w--m c-txt--secondary"
            >
              Contacts
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
