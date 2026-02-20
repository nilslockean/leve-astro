import { getCart, setCart, updateCart } from "@lib/cart";
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const removeFromCart = defineAction({
  accept: "form",
  input: z.object({
    productId: z.string(),
    price: z.number(),
  }),
  handler: async (input, context) => {
    const { productId, price } = input;
    const currentCart = getCart(context.cookies);
    const cart = updateCart(currentCart, {
      productId,
      price,
      qty: 0,
    });

    setCart(context.cookies, cart);

    return cart;
  },
});
