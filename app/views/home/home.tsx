import { Link } from "react-router";

import { useLayoutStateIsSidebarOpen } from "../../context/layout/layout";

export function Home() {
  console.log("is sidebar open?", useLayoutStateIsSidebarOpen());
  return (
    <main className="p--200">
      <div className="tp-w--s">home</div>
      <Link to="/about">Go to about page</Link>
    </main>
  );
}
