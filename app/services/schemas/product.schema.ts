import { z } from "zod";

/**
 * Schema for a single product
 * Validates essential fields while being flexible with optional ones
 *
 * Example valid product:
 * {
 *   id: 1,
 *   title: "iPhone 9",
 *   description: "An apple mobile which is very stylish and compact",
 *   price: 549,
 *   discountPercentage: 12.96,
 *   rating: 4.69,
 *   stock: 94,
 *   category: "smartphones",
 *   thumbnail: "https://...",
 *   images: ["https://..."],
 * }
 */
export const ProductSchema = z.object({
  id: z.number().int().positive("Product ID must be a positive integer"),
  title: z.string().min(1, "Product title cannot be empty"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  discountPercentage: z.number().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  stock: z.number().nonnegative().optional(),
  category: z.string().optional(),
  thumbnail: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
});

/**
 * Type-safe representation of a product
 */
export type Product = z.infer<typeof ProductSchema>;

/**
 * Parse and validate a single product
 * Throws ZodError if validation fails
 */
export function parseProduct(data: unknown): Product {
  return ProductSchema.parse(data);
}

/**
 * Safely parse a product without throwing
 */
export function safeParseProduct(data: unknown) {
  return ProductSchema.safeParse(data);
}
