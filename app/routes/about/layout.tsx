import { Outlet } from "react-router";

function AboutLayout() {
  return (
    <div className="flex gap--200 p--200">
      <div className="flex-item-stretch">
        <Outlet />
      </div>
      <div className="p--200 c-bg--fourth">sidebar</div>
    </div>
  );
}

export default AboutLayout;
