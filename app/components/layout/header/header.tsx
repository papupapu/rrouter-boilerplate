import { useLayoutActionsToggleSidebar } from "../../../context/layout/layout";

import "./header.scss";

const Header = () => {
  const toggleSidebar = useLayoutActionsToggleSidebar();
  return (
    <div className="header p--200 c-bg--fourth" onClick={toggleSidebar}>
      header
    </div>
  );
};

export default Header;
