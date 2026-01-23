import { Outlet } from "react-router";

import Header from "~/components/layout/header/header";
import Footer from "~/components/layout/footer/footer";

import { useLayoutStateIsSidebarOpen } from "../context/layout/layout";

function Layout() {
  const isOpen = useLayoutStateIsSidebarOpen();
  return (
    <div className="flex flex-column minH--full">
      <Header />
      <div className={`flex-item-stretch flex${isOpen ? " open" : ""}`}>
        <div>
          il contenitore collassa
          <div>il contenuto sparisce</div>
        </div>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
