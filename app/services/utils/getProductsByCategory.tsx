const defaultErrorMessage = "Unknown error while fetching products by category";

export async function getProductsByCategory(slug: string) {
  let data = {
    error: true,
    errorMessage: defaultErrorMessage,
    products: [],
  };
  try {
    const response = await fetch(
      `https://dummyjson.com/products/category/${slug}`
    );
    data.products = (await response.json()).products;
    data.error = false;
    data.errorMessage = "";
  } catch (error) {
    data.errorMessage = (error as Error)?.message || defaultErrorMessage;
  }
  return data;
}
