import { describe, test, expect } from "vitest";
import { getProductName, getVariantDescription } from "./variantDescription";
import type { Product } from "@lib/schemas/Product";

const baseProduct: Product = {
  id: "test-product",
  title: "Test product",
  variants: [],
  images: [],
  content: [],
  maxQuantityPerOrder: null,
  pickupDates: null,
  pickupDateRangeEnd: null,
  pickupDateRangeStart: null,
};

const productWithTwoVariants = {
  ...baseProduct,
  variants: [
    { id: "8-bitar", price: 330, description: "8 bitar" },
    { id: "10-bitar", price: 550, description: "10 bitar" },
  ],
};

const productWithOnlyStandardVariant = {
  ...baseProduct,
  variants: [{ id: "standard", price: 330, description: "Standard" }],
};

const productWithTwoVariantsAndStandardVariant = {
  ...baseProduct,
  variants: [
    { id: "standard", price: 330, description: "6 bitar" },
    { id: "10-bitar", price: 550, description: "10 bitar" },
  ],
};

describe("getVariantDescription", () => {
  test("correctly labels product with multiple variants", () => {
    expect(getVariantDescription(330, productWithTwoVariants)).toBe("8 bitar");
  });

  test("returns undefined if price variant is 'standard' and there is only one variant", () => {
    expect(
      getVariantDescription(330, productWithOnlyStandardVariant),
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

  test("returns different descriptions for different line-item prices of the same product even if there is a standard variant", () => {
    const desc6 = getVariantDescription(
      330,
      productWithTwoVariantsAndStandardVariant,
    );
    const desc10 = getVariantDescription(
      550,
      productWithTwoVariantsAndStandardVariant,
    );
    expect(desc6).not.toBe(desc10);
    expect(desc6).toBe("6 bitar");
    expect(desc10).toBe("10 bitar");
  });
});

describe("getProductName", () => {
  test("returns the product name for a product with a single variant", () => {
    expect(getProductName(productWithOnlyStandardVariant, 330)).toBe(
      "Test product",
    );
  });

  test("returns product name if price variant isn't found", () => {
    expect(getProductName(productWithOnlyStandardVariant, 440)).toBe(
      "Test product",
    );
  });

  test("returns the product name with appended variant description for a product with multiple variants", () => {
    expect(getProductName(productWithTwoVariants, 330)).toBe(
      "Test product - 8 bitar",
    );
    expect(getProductName(productWithTwoVariants, 550)).toBe(
      "Test product - 10 bitar",
    );
    expect(getProductName(productWithTwoVariantsAndStandardVariant, 330)).toBe(
      "Test product - 6 bitar",
    );
    expect(getProductName(productWithTwoVariantsAndStandardVariant, 550)).toBe(
      "Test product - 10 bitar",
    );
  });
});
