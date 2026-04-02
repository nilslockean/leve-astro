import { type AstroCookies } from "astro";
import { z } from "astro/zod";
import type { CollectionEntry } from "astro:content";
import type { Product } from "./schemas/Product";

const cartItemSchema = z.object({
  productId: z.string(),
  price: z.number(),
  qty: z.number(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
});

export type Cart = z.infer<typeof cartSchema>;
type CartItem = z.infer<typeof cartItemSchema>;

export type CartTotal = {
  total: number;
  tax: number;
};

const TAX_PERCENTAGE = 0.06;
const CART_COOKIE = "cart";
export const EMPTY_CART = Object.freeze({ items: [] }) satisfies Cart;

export function getCart(cookies: AstroCookies, productIds?: string[]): Cart {
  const cookie = cookies.get(CART_COOKIE);
  if (!cookie) return EMPTY_CART;

  // Validate cookie against schema
  const parsedCookie = cartSchema.safeParse(cookie.json());

  // Clear cookie contents if they are invalid
  if (!parsedCookie.success) {
    cookies.delete(CART_COOKIE);
    return EMPTY_CART;
  }

  // Filter items if product IDs are provided
  if (productIds) {
    parsedCookie.data.items = parsedCookie.data.items.filter((item) =>
      productIds.includes(item.productId),
    );
  }

  return parsedCookie.data;
}

export function addToCart(
  cart: Cart,
  item: CartItem,
  maxQty: number | null = null,
): Cart {
  // const cart = Object.create(currentCart);
  const nextCart = structuredClone(cart);
  const isUnlimited = maxQty === null;

  // Total quantity of this product already in cart (all price options)
  const qtyInCart = nextCart.items
    .filter(({ productId }) => productId === item.productId)
    .reduce((sum, { qty }) => sum + qty, 0);

  const qtyLimit = isUnlimited ? item.qty : Math.max(maxQty - qtyInCart, 0);
  const qtyToAdd = isUnlimited ? item.qty : Math.min(item.qty, qtyLimit);

  // Nothing to add → return cart unchanged
  if (qtyToAdd <= 0) {
    return nextCart;
  }

  // Find items in cart with same id and price option
  const existing = nextCart.items.find(
    (i) => i.productId === item.productId && i.price === item.price,
  );

  if (existing) {
    existing.qty += qtyToAdd;
  } else {
    nextCart.items.push({
      ...item,
      qty: qtyToAdd,
    });
  }

  return nextCart;
}

export function updateCart(
  cart: Cart,
  item: CartItem,
  maxQty: number | null = null,
) {
  const nextCart = structuredClone(cart);
  const nextItemIndex = nextCart.items.findIndex(
    ({ productId, price }) =>
      productId === item.productId && price === item.price,
  );
  const nextItem = nextCart.items[nextItemIndex];

  if (!nextItem) {
    throw new Error("PRODUCT_ID_MISMATCH");
  }

  // Remove item from cart if quanity is 0
  if (item.qty === 0) {
    nextCart.items.splice(nextItemIndex, 1);
    return nextCart;
  }

  // Add if maxQty is unlimited
  if (maxQty === null) {
    nextItem.qty = item.qty;
    return nextCart;
  }

  // Total quantity of this product already in cart (not this price option)
  const qtyInCart = nextCart.items
    .filter(
      ({ productId, price }) =>
        productId === item.productId && price !== item.price,
    )
    .reduce((sum, { qty }) => sum + qty, 0);

  nextItem.qty = Math.min(item.qty, maxQty - qtyInCart);

  return nextCart;
}

export function setCart(cookies: AstroCookies, cart: Cart) {
  cookies.set(CART_COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function getCartTotal(cart: Cart): CartTotal {
  if (cart.items.length === 0) {
    return {
      tax: 0,
      total: 0,
    };
  }

  const total = cart.items.reduce(
    (acc, { qty, price }) => acc + price * qty,
    0,
  );

  const tax = Math.round(total - total / (1 + TAX_PERCENTAGE));

  return {
    total,
    tax,
  };
}

// Returns the cart contents with the product data from the collection and
// filters out items that are not in the collection (ID's might change in the CMS)
// This is useful for pages that need to display the cart contents with the product data
interface DecoratedCartItem extends CartItem {
  product: Product;
}
export function getCartContents(
  cart: Cart,
  products: CollectionEntry<"products">[],
): DecoratedCartItem[] {
  const productIds = products.map((product) => product.id);

  return cart.items
    .filter((item) => productIds.includes(item.productId))
    .map((item) => {
      // Get the product data from the collection
      // We know the product ID is valid, so we can use ! to assert it's not undefined
      const product = products.find(
        (product) => product.id === item.productId,
      )!.data;

      return {
        ...item,
        product,
      };
    });
}
