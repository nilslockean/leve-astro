import type { Product } from "@lib/schemas/Product";

/**
 * Returns the variant description for a line item price.
 * Used when rendering cart/checkout line items so each row shows the correct variant label.
 */
export function getVariantDescription(
  price: number,
  product: Product,
): string | undefined {
  const variant = product.variants.find((variant) => variant.price === price);

  if (!variant) {
    throw new Error(`No variant found with price: ${price}`);
  }

  if (product.variants.length === 1 && variant.id === "standard") {
    return undefined;
  }

  return variant?.description;
}

export function getProductName(product: Product, price?: number): string {
  const { variants, title } = product;
  if (!price) {
    return title;
  }

  const variant = variants.find((variant) => variant.price === price);
  if (!variant || (variants.length === 1 && variant.id === "standard")) {
    return title;
  }

  const description = getVariantDescription(price, product);
  return `${title} - ${description}`;
}
