import { addToCart as addToCartInStore, getCart, setCart } from "@lib/cart";
import { defineAction, ActionError } from "astro:actions";
import { getEntry } from "astro:content";
import { z } from "astro/zod";
import type { ActionSuccess } from "./types";
import { captureEvent } from "@lib/posthogServer";
import { getVariantDescription } from "@lib/variantDescription";

export const addToCart = defineAction({
  accept: "form",
  input: z.object({
    productId: z.string(),
    price: z.number(),
    qty: z.number(),
  }),
  handler: async (
    input,
    context,
  ): Promise<ActionSuccess<{ productTitle: string }>> => {
    const { productId, price, qty } = input;

    const entry = await getEntry("products", productId);

    if (!entry) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Produkten finns inte.",
      });
    }

    const product = entry.data;
    const maxQty = product.maxQuantityPerOrder;

    if (maxQty === 0) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Produkten är fullbokad.",
      });
    }

    const validPrice = product.variants.some(
      (option) => option.price === price,
    );

    if (!validPrice) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Ogiltigt prisalternativ.",
      });
    }

    if (maxQty !== null && qty > maxQty) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: `Du kan max beställa ${maxQty} st av denna produkt.`,
      });
    }

    const currentCart = getCart(context.cookies);
    const cart = addToCartInStore(
      currentCart,
      {
        productId: product.id,
        price: input.price,
        qty: input.qty,
      },
      product.maxQuantityPerOrder,
    );
    setCart(context.cookies, cart);

    await captureEvent("Product Added", context.cookies, {
      product_id: product.id,
      name: product.title,
      price: input.price,
      qty: input.qty,
      variant: getVariantDescription(input.price, product),
    });

    return {
      success: true,
      payload: { productTitle: product.title },
    };
  },
});
