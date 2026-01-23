import { Outlet } from "react-router";

import Header from "~/components/layout/header/header";
import Footer from "~/components/layout/footer/footer";

import { useLayoutStateIsSidebarOpen } from "../context/layout/layout";

function Layout() {
  console.log("is sidebar open?", useLayoutStateIsSidebarOpen());
  return (
    <div className="flex flex-column minH--full">
      <Header />
      <div className="flex-item-stretch">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
