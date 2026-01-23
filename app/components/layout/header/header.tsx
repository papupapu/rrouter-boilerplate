import { useLayoutActionsToggleSidebar } from "../../../context/layout/layout";

const Header = () => {
  const toggleSidebar = useLayoutActionsToggleSidebar();
  return (
    <div className="p--200 c-bg--fourth" onClick={toggleSidebar}>
      header
    </div>
  );
};

export default Header;
