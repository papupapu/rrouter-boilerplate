import { Link } from "react-router";

import type { HomeData } from "~/services/home";

interface HomeProps {
  categories: HomeData["categories"];
  categoriesProducts: HomeData["categoriesProducts"];
  topCategoriesProducts: HomeData["topCategoriesProducts"];
}

export function Home({
  categories,
  categoriesProducts,
  topCategoriesProducts,
}: HomeProps) {
  console.log(categories, categoriesProducts, topCategoriesProducts);
  return (
    <main className="p--200">
      <div className="tp-w--s">home</div>
      <Link to="/about">Go to about page</Link>
    </main>
  );
}
