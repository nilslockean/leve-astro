import { EMPTY_CART, setCart } from "@lib/cart";
import { defineAction } from "astro:actions";

export const clearCart = defineAction({
  accept: "form",
  handler: async (_input, context) => {
    // Set cart cookie to empty cart
    setCart(context.cookies, EMPTY_CART);

    return {
      success: true,
    };
  },
});
