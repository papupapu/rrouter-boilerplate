import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getProductsByCategory } from "./getProductsByCategory";

describe("getProductsByCategory(slug) - Fetch products by category with validation", () => {
  const slug = "electronics";
  const mockProducts = [
    {
      id: 1,
      title: "iPhone 9",
      description: "An apple mobile",
      price: 549,
      discountPercentage: 12.96,
      rating: 4.69,
      stock: 94,
      category: "smartphones",
    },
    {
      id: 2,
      title: "Samsung Galaxy",
      price: 999,
      stock: 45,
      category: "smartphones",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    console.log(`\n🧪 Test initialized for category: ${slug}`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("✅ Success Cases - Valid responses with products", () => {
    it("should return products on successful fetch with complete response structure", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            products: mockProducts,
            total: 2,
            skip: 0,
            limit: 30,
          }),
        } as Response)
      );

      console.log("📋 Mock: Valid products response with metadata");
      const result = await getProductsByCategory(slug);
      console.log(
        `📊 Retrieved ${result.products.length} products for category`
      );

      expect(result.error).toBe(false);
      expect(result.errorMessage).toBe(null);
      expect(result.errorCode).toBe(null);
      expect(result.errorStatusCode).toBe(null);
      expect(result.products).toEqual(mockProducts);
      console.log("✨ Valid products response parsed successfully");
    });

    it("should handle empty products array gracefully", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            products: [],
            total: 0,
            skip: 0,
            limit: 30,
          }),
        } as Response)
      );

      console.log("📋 Mock: Empty products array");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(false);
      expect(result.products).toEqual([]);
      console.log("✨ Empty array handled without errors");
    });

    it("should handle minimal valid response (only products field required)", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ products: mockProducts }),
        } as Response)
      );

      console.log("📋 Mock: Minimal response (products field only)");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(false);
      expect(result.products).toEqual(mockProducts);
      console.log("✨ Minimal response accepted - only products required");
    });
  });

  describe("❌ HTTP Error Cases - Non-2xx responses by status code", () => {
    it("should handle HTTP 404 NOT FOUND for non-existent category", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          url: `https://dummyjson.com/products/category/${slug}`,
        } as Response)
      );

      console.log("⚠️  Mock: HTTP 404 (category not found)");
      const result = await getProductsByCategory(slug);
      console.log(`📊 Error code: ${result.errorCode}`);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("NOT_FOUND");
      expect(result.errorStatusCode).toBe(404);
      expect(result.products).toEqual([]);
      console.log("✨ 404 correctly classified as NOT_FOUND");
    });

    it("should handle HTTP 500 SERVER ERROR with retryable classification", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          url: `https://dummyjson.com/products/category/${slug}`,
        } as Response)
      );

      console.log("⚠️  Mock: HTTP 500 (server error)");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("SERVER_ERROR");
      expect(result.errorStatusCode).toBe(500);
      console.log("✨ 500 classified as SERVER_ERROR (retryable)");
    });

    it("should handle HTTP 401 UNAUTHORIZED access denied", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          url: `https://dummyjson.com/products/category/${slug}`,
        } as Response)
      );

      console.log("⚠️  Mock: HTTP 401 (unauthorized)");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("UNAUTHORIZED");
      expect(result.errorStatusCode).toBe(401);
      console.log("✨ 401 classified as UNAUTHORIZED (not retryable)");
    });
  });

  describe("🌐 Network Error Cases - Connection failures", () => {
    it("should handle network failure when fetch throws", async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error("Failed to fetch")));

      console.log("⚠️  Mock: Network failure");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("NETWORK_ERROR");
      expect(result.products).toEqual([]);
      console.log("✨ Network failure caught and categorized");
    });

    it("should handle DNS resolution failure", async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error("getaddrinfo ENOTFOUND dummyjson.com"))
      );

      console.log("⚠️  Mock: DNS resolution failure");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("NETWORK_ERROR");
      console.log("✨ DNS failure correctly identified as network error");
    });
  });

  describe("📄 JSON Parse Error Cases - Response body parsing failures", () => {
    it("should handle invalid JSON from HTTP 200 OK", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => {
            throw new SyntaxError("Unexpected token < in JSON");
          },
        } as unknown as Response)
      );

      console.log("⚠️  Mock: Invalid JSON (HTML response?)");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("PARSE_ERROR");
      expect(result.products).toEqual([]);
      console.log("✨ Parse error detected and categorized");
    });

    it("should handle malformed/truncated JSON", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => {
            throw new SyntaxError("JSON.parse: unexpected end of data");
          },
        } as unknown as Response)
      );

      console.log("⚠️  Mock: Truncated/malformed JSON");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("PARSE_ERROR");
      console.log("✨ Malformed JSON error caught");
    });
  });

  describe("✔️ Validation Error Cases - Schema mismatch by Zod", () => {
    it("should reject response missing required products field", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            data: mockProducts,
            total: 2,
          }),
        } as Response)
      );

      console.log("⚠️  Mock: Missing 'products' field (has 'data' instead)");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      expect(result.products).toEqual([]);
      console.log("✨ Missing required field detected by Zod schema");
    });

    it("should reject response with null products field", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            products: null,
          }),
        } as Response)
      );

      console.log("⚠️  Mock: products field is null");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      console.log("✨ Null products field rejected");
    });

    it("should reject response with non-array products", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            products: { 0: mockProducts[0] },
          }),
        } as Response)
      );

      console.log("⚠️  Mock: products is object instead of array");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      console.log("✨ Type mismatch (object vs array) detected");
    });

    it("should reject completely null response", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => null,
        } as Response)
      );

      console.log("⚠️  Mock: Entire response is null");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      console.log("✨ Null response rejected");
    });

    it("should reject product with missing required ID field", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            products: [
              {
                title: "Product without ID",
                price: 100,
              },
            ],
          }),
        } as Response)
      );

      console.log("⚠️  Mock: Product missing required 'id' field");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      console.log("✨ Missing product field detected by Zod");
    });

    it("should reject product with invalid negative price", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            products: [
              {
                id: 1,
                title: "Invalid Product",
                price: -100,
              },
            ],
          }),
        } as Response)
      );

      console.log("⚠️  Mock: Product with negative price");
      const result = await getProductsByCategory(slug);

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      console.log("✨ Negative price constraint violation caught");
    });
  });
});
