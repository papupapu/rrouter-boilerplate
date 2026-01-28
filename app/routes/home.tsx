import type { Route } from "./+types/layout";

import * as homeServices from "../services/home";

import { Home } from "../views/home/home";

export function meta() {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader() {
  const product = await homeServices.fetchHomeData();
  return product;
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  console.log("Loader Data:", loaderData);
  return <Home data={loaderData} />;
}
