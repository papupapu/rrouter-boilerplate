import { getCategories } from "./utils/getCategories";
import { getProductsByCategory } from "./utils/getProductsByCategory";

const defaultErrorMessage = "Unknown error while fetching home data";

async function fetchProductsForCategories({
  categories,
  count,
}: {
  categories: any[];
  count: number;
}) {
  const products: Record<string, any[]> = {};

  for (const category of categories.filter(Boolean)) {
    const { slug } = category;
    const result = await getProductsByCategory(slug);
    if (!result.error) {
      products[slug] = result.products.slice(0, count);
    }
  }

  return products;
}

export async function fetchHomeData() {
  const data = {
    error: true,
    errorMessage: defaultErrorMessage,
    categories: [],
    topCategoriesProducts: {},
    categoriesProducts: {},
  };
  const categories = await getCategories();

  if (categories.error) {
    data.errorMessage = categories.errorMessage;
    return data;
  }

  data.categories = categories.categories;

  const [first, second, third, ...others] = categories.categories;

  data.topCategoriesProducts = await fetchProductsForCategories({
    categories: [first, second, third],
    count: 3,
  });

  const [fourth, fifth, sixth, seventh, eighth] = others;

  data.categoriesProducts = await fetchProductsForCategories({
    categories: [fourth, fifth, sixth, seventh, eighth],
    count: 1,
  });

  return data;
}
