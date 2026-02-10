import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getCategories } from "./getCategories";

describe("getCategories() - Fetch and validate product categories from API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log("\n🧪 Test initialized");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("✅ Success Cases - Valid responses", () => {
    it("should return categories on successful fetch with valid JSON array", async () => {
      const mockCategories = ["electronics", "clothing", "books", "home"];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockCategories,
        } as Response)
      );

      console.log("📋 Mock: Valid categories response");
      const result = await getCategories();
      console.log("📊 Result:", result);

      expect(result.error).toBe(false);
      expect(result.errorMessage).toBe(null);
      expect(result.errorCode).toBe(null);
      expect(result.errorStatusCode).toBe(null);
      expect(result.categories).toEqual(mockCategories);
      console.log("✨ All assertions passed - valid categories returned");
    });

    it("should handle empty categories array without error", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      );

      console.log("📋 Mock: Empty array response");
      const result = await getCategories();

      expect(result.error).toBe(false);
      expect(result.categories).toEqual([]);
      console.log("✨ Empty array handled correctly");
    });
  });

  describe("❌ HTTP Error Cases - Non-2xx status codes", () => {
    it("should handle HTTP 404 NOT FOUND with error code mapping", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          url: "https://dummyjson.com/products/categories",
        } as Response)
      );

      console.log("⚠️  Mock: HTTP 404 Not Found");
      const result = await getCategories();
      console.log("📊 Error details:", {
        code: result.errorCode,
        status: result.errorStatusCode,
      });

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("NOT_FOUND");
      expect(result.errorStatusCode).toBe(404);
      console.log("✨ 404 correctly mapped to NOT_FOUND error code");
    });

    it("should handle HTTP 500 SERVER ERROR with retryable flag", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          url: "https://dummyjson.com/products/categories",
        } as Response)
      );

      console.log("⚠️  Mock: HTTP 500 Server Error");
      const result = await getCategories();

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("SERVER_ERROR");
      expect(result.errorStatusCode).toBe(500);
      console.log("✨ 500 correctly mapped to SERVER_ERROR (retryable error)");
    });

    it("should handle HTTP 429 RATE LIMITED error", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          url: "https://dummyjson.com/products/categories",
        } as Response)
      );

      console.log("⚠️  Mock: HTTP 429 Rate Limited");
      const result = await getCategories();

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("RATE_LIMITED");
      expect(result.errorStatusCode).toBe(429);
      console.log("✨ 429 correctly mapped to RATE_LIMITED error code");
    });
  });

  describe("🌐 Network Error Cases - Connection and transport failures", () => {
    it("should handle network failure when fetch throws", async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error("Network request failed"))
      );

      console.log("⚠️  Mock: Network failure (fetch rejected)");
      const result = await getCategories();

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("NETWORK_ERROR");
      expect(result.errorStatusCode).toBe(null);
      console.log("✨ Network failure correctly categorized as NETWORK_ERROR");
    });

    it("should handle fetch abort signal timeout", async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error("The operation was aborted"))
      );

      console.log("⚠️  Mock: Fetch abort (timeout)");
      const result = await getCategories();

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("NETWORK_ERROR");
      console.log("✨ Abort error correctly treated as network error");
    });
  });

  describe("📄 JSON Parse Error Cases - Invalid response body", () => {
    it("should handle invalid JSON response from HTTP 200", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => {
            throw new SyntaxError("Unexpected token < in JSON at position 0");
          },
        } as unknown as Response)
      );

      console.log("⚠️  Mock: JSON parse error (HTML response?)");
      const result = await getCategories();

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("PARSE_ERROR");
      console.log("✨ Parse error correctly identified and categorized");
    });
  });

  describe("✔️ Validation Error Cases - Data schema mismatches", () => {
    it("should reject non-array response even when HTTP 200", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ categories: ["electronics"] }),
        } as Response)
      );

      console.log("⚠️  Mock: Object instead of array");
      const result = await getCategories();

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      console.log("✨ Non-array response rejected by Zod schema validation");
    });

    it("should reject array with non-string items (type mismatch)", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ["electronics", 123, null],
        } as Response)
      );

      console.log("⚠️  Mock: Array with mixed types (string, number, null)");
      const result = await getCategories();

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      console.log(
        "✨ Type mismatch (number/null in string array) detected by Zod"
      );
    });

    it("should reject array with empty string categories (constraint violation)", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ["electronics", "", "books"],
        } as Response)
      );

      console.log("⚠️  Mock: Array containing empty string");
      const result = await getCategories();

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      console.log("✨ Empty string constraint violation caught by Zod");
    });

    it("should reject null response (complete schema mismatch)", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => null,
        } as Response)
      );

      console.log("⚠️  Mock: Null response");
      const result = await getCategories();

      expect(result.error).toBe(true);
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      console.log("✨ Null response rejected - not an array");
    });
  });
});
