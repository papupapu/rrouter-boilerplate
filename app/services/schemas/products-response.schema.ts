import { z } from "zod";
import { ProductSchema, type Product } from "./product.schema";

/**
 * Schema for the products API response
 * Validates the structure returned by /products/category/{slug}
 *
 * Example valid response:
 * {
 *   products: [
 *     { id: 1, title: "Product 1", price: 100, ... },
 *     { id: 2, title: "Product 2", price: 200, ... }
 *   ],
 *   total: 2,
 *   skip: 0,
 *   limit: 30
 * }
 */
export const ProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number().nonnegative().optional(),
  skip: z.number().nonnegative().optional(),
  limit: z.number().positive().optional(),
});

/**
 * Type-safe representation of products response
 */
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;

/**
 * Parse and validate products response
 * Throws ZodError if validation fails
 */
export function parseProductsResponse(data: unknown): ProductsResponse {
  return ProductsResponseSchema.parse(data);
}

/**
 * Safely parse products response without throwing
 */
export function safeParseProductsResponse(data: unknown) {
  return ProductsResponseSchema.safeParse(data);
}

/**
 * Extract just the products array from a validated response
 */
export function extractProducts(response: ProductsResponse): Product[] {
  return response.products;
}
