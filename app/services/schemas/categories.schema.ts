import { z } from "zod";

/**
 * Schema for product categories response
 * API returns an array of category names (strings)
 *
 * Example valid response:
 * [{ slug: "electronics", name: "Electronics", url: "https://dummyjson.com/products/category/electronics" }, { slug: "clothing", name: "Clothing", url: "https://dummyjson.com/products/category/clothing" }, { slug: "books", name: "Books", url: "https://dummyjson.com/products/category/books" }, { slug: "home", name: "Home", url: "https://dummyjson.com/products/category/home" }, { slug: "sports", name: "Sports", url: "https://dummyjson.com/products/category/sports" }]
 */
export const CategoriesSchema = z.array(
  z.object({
    slug: z.string().min(1, "Category slug cannot be empty"),
    name: z.string().min(1, "Category name cannot be empty"),
    url: z.url(),
  })
);

/**
 * Type-safe representation of categories
 */
export type Categories = z.infer<typeof CategoriesSchema>;

/**
 * Parse and validate categories response
 * Throws ZodError if validation fails
 */
export function parseCategories(data: unknown): Categories {
  return CategoriesSchema.parse(data);
}

/**
 * Safely parse categories without throwing
 * Returns { success, data, error }
 */
export function safeParseCategories(data: unknown) {
  return CategoriesSchema.safeParse(data);
}
