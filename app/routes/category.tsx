import type { Route } from "./+types/post";

import { Category } from "../views/category/category";

export function meta() {
  return [
    { title: "Category" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const name = params.category;
  return name;
}

export default function CategoryRoute({ loaderData }: Route.ComponentProps) {
  return <Category name={loaderData} />;
}
