import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fetchHomeData } from "./home";
import * as getCategoriesModule from "./utils/getCategories";
import * as getProductsModule from "./utils/getProductsByCategory";

const makeCategory = (slug: string) => ({
  slug,
  name: slug[0].toUpperCase() + slug.slice(1),
  url: `https://dummyjson.com/products/category/${slug}`,
});

describe("fetchHomeData() - Service orchestration with graceful degradation", () => {
  const mockCategories = [
    makeCategory("electronics"),
    makeCategory("clothing"),
    makeCategory("books"),
  ];
  const mockProductsElectronics = [
    { id: 1, title: "iPhone", price: 999, category: "electronics" },
    { id: 2, title: "Laptop", price: 1999, category: "electronics" },
  ];
  const mockProductsClothing = [
    { id: 3, title: "T-Shirt", price: 29, category: "clothing" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    console.log("\n🧪 Home service test initialized");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("✅ Complete Success - All fetches succeed", () => {
    it("should return full data when all fetches succeed", async () => {
      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        categories: mockCategories,
      });

      vi.spyOn(getProductsModule, "getProductsByCategory")
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsElectronics,
        })
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsClothing,
        })
        .mockResolvedValue({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: [],
        });

      console.log("📋 Mock: Categories + all products resolved successfully");
      const result = await fetchHomeData();
      console.log(
        `📊 Response: success=${result.success}, categories=${result.data?.categories.length}`
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.categories).toEqual(mockCategories);
      expect(result.errors).toBeUndefined();
      expect(result.partialDataInfo).toBeUndefined();
      console.log("✨ Complete success path verified - no errors");
    });
  });

  describe("❌ Complete Failure - Critical path fails", () => {
    it("should return null data when getCategories fails (critical path)", async () => {
      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: true,
        errorMessage: "HTTP 503 Service Unavailable",
        errorCode: "SERVER_ERROR",
        errorStatusCode: 503,
        categories: [],
      });

      console.log("⚠️  Mock: getCategories() fails with SERVER_ERROR");
      const result = await fetchHomeData();
      console.log(
        `📊 Result: success=${result.success}, errors count=${result.errors?.length}`
      );

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(1);
      expect(result.errors?.[0].code).toBe("SERVER_ERROR");
      expect(result.errors?.[0].statusCode).toBe(503);
      expect(result.partialDataInfo).toBeUndefined();
      console.log("✨ Critical path failure correctly stops service");
    });
  });

  describe("🟡 Partial Failure - Graceful degradation active", () => {
    it("should return partial data when some product fetches fail", async () => {
      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        categories: mockCategories,
      });

      // First two categories succeed, third fails
      vi.spyOn(getProductsModule, "getProductsByCategory")
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsElectronics,
        })
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsClothing,
        })
        .mockResolvedValueOnce({
          error: true,
          errorMessage: "HTTP 404 Category not found",
          errorCode: "NOT_FOUND",
          errorStatusCode: 404,
          products: [],
        });

      console.log("⚠️  Mock: 2 categories succeed, 1 fails (books NOT_FOUND)");
      const result = await fetchHomeData();
      console.log(
        `📊 Partial data: ${result.partialDataInfo?.successfulFetches}/${result.partialDataInfo?.totalAttempted} successful, failed=[${result.partialDataInfo?.failedResources.join(", ")}]`
      );

      expect(result.success).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data?.categories).toEqual(mockCategories);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(1);
      expect(result.partialDataInfo).toBeDefined();
      expect(result.partialDataInfo?.failedResources).toContain("books");
      expect(result.partialDataInfo?.totalAttempted).toBe(3);
      expect(result.partialDataInfo?.successfulFetches).toBe(2);
      expect(result.partialDataInfo?.errorCount).toBe(1);
      console.log("✨ Graceful degradation working - returned partial data");
    });

    it("should track which categories failed in affectedResource field", async () => {
      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        categories: mockCategories,
      });

      vi.spyOn(getProductsModule, "getProductsByCategory")
        .mockResolvedValueOnce({
          error: true,
          errorMessage: "Network error",
          errorCode: "NETWORK_ERROR",
          errorStatusCode: null,
          products: [],
        })
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsClothing,
        })
        .mockResolvedValueOnce({
          error: true,
          errorMessage: "HTTP 500",
          errorCode: "SERVER_ERROR",
          errorStatusCode: 500,
          products: [],
        });

      console.log(
        "⚠️  Mock: Multiple failures (electronics NETWORK, books SERVER_ERROR)"
      );
      const result = await fetchHomeData();
      console.log(
        `📊 Errors: electronics=${result.errors?.[0].affectedResource}, books=${result.errors?.[1].affectedResource}`
      );

      expect(result.success).toBe(false);
      expect(result.partialDataInfo?.failedResources).toEqual([
        "electronics",
        "books",
      ]);
      expect(result.partialDataInfo?.errorCount).toBe(2);
      expect(result.partialDataInfo?.successfulFetches).toBe(1);
      console.log("✨ Multiple failures tracked correctly in partialDataInfo");
    });

    it("should include error details in errors array with affectedResource tracking", async () => {
      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        categories: mockCategories,
      });

      vi.spyOn(getProductsModule, "getProductsByCategory")
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsElectronics,
        })
        .mockResolvedValueOnce({
          error: true,
          errorMessage: "Failed to fetch products for category 'clothing'",
          errorCode: "HTTP_ERROR",
          errorStatusCode: 503,
          products: [],
        })
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: [],
        });

      console.log("⚠️  Mock: Partial failure with error details");
      const result = await fetchHomeData();
      console.log(
        `📊 Error tracking: code=${result.errors?.[0].code}, resource=${result.errors?.[0].affectedResource}`
      );

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toMatchObject({
        code: "HTTP_ERROR",
        statusCode: 503,
        affectedResource: "clothing",
      });
      console.log("✨ Error details properly tracked with affectedResource");
    });
  });

  describe("📊 Data Structure - Resource organization and slicing", () => {
    it("should properly organize products by category", async () => {
      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        categories: mockCategories,
      });

      vi.spyOn(getProductsModule, "getProductsByCategory")
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsElectronics,
        })
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsClothing,
        })
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: [],
        });

      console.log("📋 Mock: Normal fetch with multiple categories");
      const result = await fetchHomeData();
      console.log(
        `📊 Structure: topCategoriesProducts=${Object.keys(result.data?.topCategoriesProducts || {}).length}, categoriesProducts=${Object.keys(result.data?.categoriesProducts || {}).length}`
      );

      expect(result.data?.topCategoriesProducts).toBeDefined();
      expect(result.data?.categoriesProducts).toBeDefined();
      expect(result.data?.topCategoriesProducts["electronics"]).toBeDefined();
      expect(result.data?.topCategoriesProducts["clothing"]).toBeDefined();
      console.log("✨ Data properly organized by category");
    });

    it("should limit top products to 3 items per category", async () => {
      const tooManyProducts = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        title: `Product ${i}`,
        price: 100,
      }));

      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        categories: [
          makeCategory("cat1"),
          makeCategory("cat2"),
          makeCategory("cat3"),
        ],
      });

      vi.spyOn(getProductsModule, "getProductsByCategory").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        products: tooManyProducts,
      });

      console.log("📋 Mock: 10 products per category (should slice to 3 top)");
      const result = await fetchHomeData();
      console.log(
        `📊 Top products count: ${result.data?.topCategoriesProducts["cat1"]?.length} (max 3)`
      );

      expect(result.data?.topCategoriesProducts["cat1"]?.length).toBe(
        Math.min(3, tooManyProducts.length)
      );
      console.log("✨ Slicing limit (3) correctly applied");
    });

    it("should limit remaining products to 1 item per remaining category", async () => {
      const tooManyProducts = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        title: `Product ${i}`,
        price: 100,
      }));

      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        categories: [
          makeCategory("cat1"),
          makeCategory("cat2"),
          makeCategory("cat3"),
          makeCategory("cat4"),
          makeCategory("cat5"),
        ],
      });

      vi.spyOn(getProductsModule, "getProductsByCategory").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        products: tooManyProducts,
      });

      console.log("📋 Mock: 5 categories, remaining get 1 product each");
      const result = await fetchHomeData();
      console.log(
        `📊 Remaining products: cat4=${result.data?.categoriesProducts["cat4"]?.length}, cat5=${result.data?.categoriesProducts["cat5"]?.length}`
      );

      expect(result.data?.categoriesProducts["cat4"]?.length).toBe(1);
      expect(result.data?.categoriesProducts["cat5"]?.length).toBe(1);
      console.log("✨ Remaining products correctly limited to 1 per category");
    });
  });

  describe("🎯 Edge Cases - Boundary conditions", () => {
    it("should handle single category without errors", async () => {
      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        categories: [makeCategory("electronics")],
      });

      vi.spyOn(
        getProductsModule,
        "getProductsByCategory"
      ).mockResolvedValueOnce({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        products: mockProductsElectronics,
      });

      console.log("📋 Mock: Single category edge case");
      const result = await fetchHomeData();
      console.log(`📊 Categories count: ${result.data?.categories.length}`);

      expect(result.success).toBe(true);
      expect(result.data?.categories.length).toBe(1);
      console.log("✨ Single category handled correctly");
    });

    it("should handle two categories boundary", async () => {
      vi.spyOn(getCategoriesModule, "getCategories").mockResolvedValue({
        error: false,
        errorMessage: null,
        errorCode: null,
        errorStatusCode: null,
        categories: [makeCategory("electronics"), makeCategory("clothing")],
      });

      vi.spyOn(getProductsModule, "getProductsByCategory")
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsElectronics,
        })
        .mockResolvedValueOnce({
          error: false,
          errorMessage: null,
          errorCode: null,
          errorStatusCode: null,
          products: mockProductsClothing,
        });

      console.log("📋 Mock: Two categories (top category boundary)");

      const result = await fetchHomeData();
      console.log(`📊 Categories: ${result.data?.categories.length}`);

      expect(result.success).toBe(true);
      expect(result.data?.categories.length).toBe(2);
      console.log("✨ Two category boundary handled correctly");
    });
  });
});
