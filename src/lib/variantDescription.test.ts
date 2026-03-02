import { describe, test, expect } from "vitest";
import { getVariantDescription } from "./variantDescription";
import type { Product } from "@lib/schemas/Product";

const baseProduct: Product = {
  id: "test-product",
  title: "Test product",
  variants: [],
  images: [],
  content: [],
  maxQuantityPerOrder: null,
  pickupDates: null,
};

const productWithTwoVariants = {
  ...baseProduct,
  variants: [
    { id: "8-bitar", price: 330, description: "8 bitar" },
    { id: "10-bitar", price: 550, description: "10 bitar" },
  ],
};

const productWithOneVariant = {
  ...baseProduct,
  variants: [{ id: "8-bitar", price: 330, description: "8 bitar" }],
};

const productWithStandardVariant = {
  ...baseProduct,
  variants: [{ id: "standard", price: 330, description: "Standard" }],
};

describe("getVariantDescription", () => {
  test("correctly labels product with multiple variants", () => {
    expect(getVariantDescription(330, productWithTwoVariants)).toBe("8 bitar");
  });

  test("returns undefined if price variant is 'standard'", () => {
    expect(
      getVariantDescription(330, productWithStandardVariant),
    ).toBeUndefined();
  });

  test("throws if no variant matches the price", () => {
    expect(() => getVariantDescription(999, productWithTwoVariants)).toThrow();
  });

  test("returns different descriptions for different line-item prices of the same product", () => {
    const desc8 = getVariantDescription(330, productWithTwoVariants);
    const desc10 = getVariantDescription(550, productWithTwoVariants);
    expect(desc8).not.toBe(desc10);
    expect(desc8).toBe("8 bitar");
    expect(desc10).toBe("10 bitar");
  });
});
