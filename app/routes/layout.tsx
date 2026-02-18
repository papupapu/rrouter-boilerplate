import { Outlet } from "react-router";

import Header from "~/components/layout/header/header";
import Navigation from "~/components/layout/navigation/navigation";
import Footer from "~/components/layout/footer/footer";

import { useLayoutStateIsSidebarOpen } from "../context/layout/layout";

function Layout() {
  const isOpen = useLayoutStateIsSidebarOpen();
  return (
    <div className="flex flex-column minH--full">
      <Header />
      <div
        className={`flex-item-stretch flex${isOpen ? " navigation-open" : ""}`}
      >
        <Navigation />
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
