import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("routes/about/layout.tsx", [route("about", "routes/about/about.tsx")]),
] satisfies RouteConfig;
