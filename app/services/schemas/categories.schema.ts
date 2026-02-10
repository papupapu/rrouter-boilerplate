import { z } from "zod";

/**
 * Schema for product categories response
 * API returns an array of category names (strings)
 *
 * Example valid response:
 * ["electronics", "clothing", "books", "home", "sports"]
 */
export const CategoriesSchema = z.array(
  z.string().min(1, "Category name cannot be empty")
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
