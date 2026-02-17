import type { Route } from "./+types/post";

import { getProductsByCategorySlug } from "~/services/category";

import { Category } from "../views/category/category";

export function meta() {
  return [
    { title: "Category" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const products = await getProductsByCategorySlug(params.category);
  return { name: params.category, products };
}

export default function CategoryRoute({ loaderData }: Route.ComponentProps) {
  const { name, products } = loaderData || { name: "", products: [] };
  return <Category name={name} data={products} />;
}
