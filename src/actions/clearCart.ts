import { EMPTY_CART, setCart } from "@lib/cart";
import { defineAction } from "astro:actions";
import type { ActionSuccess } from "./types";

export const clearCart = defineAction({
  accept: "form",
  handler: async (_input, context): Promise<ActionSuccess> => {
    // Set cart cookie to empty cart
    setCart(context.cookies, EMPTY_CART);

    return {
      success: true,
    };
  },
});
