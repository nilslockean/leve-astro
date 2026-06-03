import { describe, test, expect, vi } from "vitest";

vi.mock("astro:content", () => ({
  getLiveCollection: vi.fn(),
  getLiveEntry: vi.fn(),
}));
import { getProducts, getProduct } from "./products";
import type { ProductEntry } from "./products";

const MOCK_PRODUCT: ProductEntry = {
  id: "test-product",
  data: {
    id: "test-product",
    title: "Test Product",
    variants: [{ id: "v1", price: 100, description: "Variant 1" }],
    images: [{ asset: { _ref: "image-ref" }, alt: "Test image" }],
    content: [],
    maxQuantityPerOrder: 5,
    pickupDates: null,
    pickupDateRangeStart: null,
    pickupDateRangeEnd: null,
  },
};

describe("getProducts", () => {
  test("returns all products from fetcher", async () => {
    const result = await getProducts(async () => [MOCK_PRODUCT]);
    expect(result).toEqual([MOCK_PRODUCT]);
  });

  test("returns empty array when no products", async () => {
    const result = await getProducts(async () => []);
    expect(result).toEqual([]);
  });

  test("returns multiple products", async () => {
    const second: ProductEntry = { ...MOCK_PRODUCT, id: "second-product" };
    const result = await getProducts(async () => [MOCK_PRODUCT, second]);
    expect(result).toHaveLength(2);
  });
});

describe("getProduct", () => {
  test("returns matching product by id", async () => {
    const fetcher = async (id: string) =>
      id === "test-product" ? MOCK_PRODUCT : undefined;
    const result = await getProduct("test-product", fetcher);
    expect(result).toEqual(MOCK_PRODUCT);
  });

  test("returns undefined when product not found", async () => {
    const result = await getProduct("nonexistent", async () => undefined);
    expect(result).toBeUndefined();
  });

  test("passes the id to the fetcher", async () => {
    let capturedId = "";
    await getProduct("my-slug", async (id) => {
      capturedId = id;
      return undefined;
    });
    expect(capturedId).toBe("my-slug");
  });
});
