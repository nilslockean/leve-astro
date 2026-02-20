import { getCart, setCart, updateCart as updateCartInStore } from "@lib/cart";
import { defineAction, ActionError } from "astro:actions";
import { getEntry } from "astro:content";
import { z } from "astro:schema";
import type { ActionSuccess } from "./types";

export const updateCart = defineAction({
  accept: "form",
  input: z.object({
    productId: z.string(),
    price: z.number(),
    qty: z.number(),
  }),
  handler: async (input, context): Promise<ActionSuccess> => {
    const { productId, price, qty } = input;
    const entry = await getEntry("products", productId);

    if (!entry) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Produkten finns inte.",
      });
    }

    const product = entry.data;
    const { maxQuantityPerOrder } = product;

    const currentCart = getCart(context.cookies);
    const cart = updateCartInStore(
      currentCart,
      {
        productId,
        price,
        qty,
      },
      maxQuantityPerOrder,
    );
    setCart(context.cookies, cart);

    return {
      success: true,
    };
  },
});
