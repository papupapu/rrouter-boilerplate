const defaultErrorMessage = "Unknown error while fetching categories";

export async function getCategories() {
  let data = {
    error: true,
    errorMessage: defaultErrorMessage,
    categories: [],
  };

  try {
    const response = await fetch("https://dummyjson.com/products/categories");
    data.categories = await response.json();
    data.error = false;
    data.errorMessage = "";
  } catch (error) {
    console.log("getCategories - catch", error);
    data.errorMessage = (error as Error)?.message || defaultErrorMessage;
  }

  return data;
}
