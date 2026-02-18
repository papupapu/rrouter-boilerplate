import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route(":category", "routes/category.tsx"),
    route(":category/:slug", "routes/post.tsx"),
  ]),
  layout("routes/about/layout.tsx", [route("about", "routes/about/about.tsx")]),
  route("search", "routes/proxy/search.tsx"),
] satisfies RouteConfig;
