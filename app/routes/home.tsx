import * as homeServices from "../services/home";

import { Home } from "../views/home/home";

type LoaderData = Awaited<ReturnType<typeof homeServices.fetchHomeData>>;

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

export default function HomeRoute({ loaderData }: { loaderData: LoaderData }) {
  if (!loaderData.success || !loaderData.data) {
    return <div>Failed to load home data.</div>;
  }

  const { categories, categoriesProducts, topCategoriesProducts } =
    loaderData.data;
  return (
    <Home
      categories={categories}
      categoriesProducts={categoriesProducts}
      topCategoriesProducts={topCategoriesProducts}
    />
  );
}
