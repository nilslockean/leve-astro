import { describe, test, expect } from "vitest";
import {
  getCartTotal,
  EMPTY_CART,
  addToCart,
  type Cart,
  updateCart,
  validateCartContents,
} from "./cart";

describe("getCartTotal", () => {
  test("returns 0 when cart is empty", () => {
    const { total, tax } = getCartTotal(EMPTY_CART);
    expect(total).toBe(0);
    expect(tax).toBe(0);
  });

  test("calculates total correctly for single product in cart", () => {
    const { total } = getCartTotal({
      items: [
        {
          productId: "test-1",
          price: 10,
          qty: 1,
        },
      ],
    });
    expect(total).toBe(10);
  });

  test("calculates total correctly for single product with many qty in cart", () => {
    const { total } = getCartTotal({
      items: [
        {
          productId: "test-1",
          price: 10,
          qty: 3,
        },
      ],
    });
    expect(total).toBe(30);
  });

  test("calculates total correctly for multiple products in in cart", () => {
    const { total } = getCartTotal({
      items: [
        {
          productId: "test-1",
          price: 10,
          qty: 3,
        },
        {
          productId: "test-2",
          price: 59,
          qty: 1,
        },
        {
          productId: "test-3",
          price: 99.9,
          qty: 1,
        },
      ],
    });
    expect(total).toBe(188.9);
  });

  test("calucaltes tax on total correctly", () => {
    const { tax } = getCartTotal({
      items: [
        {
          productId: "test-1",
          price: 106,
          qty: 1,
        },
      ],
    });
    expect(tax).toBe(6);
  });
});

describe("addToCart", () => {
  test("adds product to empty cart", () => {
    const cart = addToCart(
      EMPTY_CART,
      {
        productId: "test-1",
        price: 1,
        qty: 1,
      },
      1
    );

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual({
      productId: "test-1",
      price: 1,
      qty: 1,
    });
  });

  test("limits qty for single item to max qty when cart is empty", () => {
    const cart = addToCart(
      EMPTY_CART,
      {
        productId: "test-1",
        price: 1,
        qty: 2,
      },
      1
    );

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual({
      productId: "test-1",
      price: 1,
      qty: 1,
    });
  });

  test("limits qty for single item to max qty when item is already in cart", () => {
    const currentCart: Cart = {
      items: [
        {
          productId: "test-1",
          price: 1,
          qty: 1,
        },
        {
          productId: "other-test-item",
          price: 1,
          qty: 1,
        },
      ],
    };
    const cart = addToCart(
      currentCart,
      {
        productId: "test-1",
        price: 1,
        qty: 3,
      },
      3
    );

    expect(cart.items).toHaveLength(2);
    expect(cart.items[0]).toEqual({
      productId: "test-1",
      price: 1,
      qty: 3,
    });
  });

  test("limits qty for item to max qty when other price option of same item is already in cart", () => {
    const currentCart: Cart = {
      items: [
        {
          productId: "test-1",
          price: 1,
          qty: 1,
        },
      ],
    };
    const cart = addToCart(
      currentCart,
      {
        productId: "test-1",
        price: 2,
        qty: 3,
      },
      3
    );

    expect(cart.items).toHaveLength(2);
    expect(cart.items[0]).toEqual({
      productId: "test-1",
      price: 1,
      qty: 1,
    });
    expect(cart.items[1]).toEqual({
      productId: "test-1",
      price: 2,
      qty: 2,
    });
  });

  test("adds to cart if maxQty is null (unlimited)", () => {
    const cart = addToCart(
      EMPTY_CART,
      {
        productId: "test-1",
        price: 1,
        qty: 100,
      },
      null
    );

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual({
      productId: "test-1",
      price: 1,
      qty: 100,
    });
  });

  test("doesn't add to cart if maxQty is 0 (out of stock)", () => {
    const cart = addToCart(
      EMPTY_CART,
      {
        productId: "test-1",
        price: 1,
        qty: 1,
      },
      0
    );

    expect(cart.items).toHaveLength(0);
    expect(cart).toEqual(EMPTY_CART);
  });
});

describe("updateCart", () => {
  const ITEM_1_MAX_QTY = 3;
  const ITEM_2_MAX_QTY = 10;
  const CART: Cart = {
    items: [
      {
        productId: "test-1",
        price: 1,
        qty: 1,
      },
      {
        productId: "test-1",
        price: 2,
        qty: 1,
      },
      {
        productId: "test-2",
        price: 1,
        qty: 10,
      },
    ],
  };

  test("throws if product is not in cart", () => {
    expect(() => {
      updateCart(CART, {
        productId: "test-3",
        price: 1,
        qty: 5,
      });
    }).toThrow("PRODUCT_ID_MISMATCH");
  });

  test("reduces qty of single item", () => {
    const cart = updateCart(
      CART,
      {
        productId: "test-2",
        price: 1,
        qty: 5,
      },
      ITEM_2_MAX_QTY
    );

    expect(cart.items).toHaveLength(CART.items.length);
    expect(cart.items[2]).toEqual({
      productId: "test-2",
      price: 1,
      qty: 5,
    });
  });

  test("caps qty at maxQty for single price option", () => {
    const cart = updateCart(
      CART,
      {
        productId: "test-2",
        price: 1,
        qty: 1000000000,
      },
      ITEM_2_MAX_QTY
    );

    expect(cart.items).toHaveLength(CART.items.length);
    expect(cart.items[2]).toEqual({
      productId: "test-2",
      price: 1,
      qty: ITEM_2_MAX_QTY,
    });
  });

  test("caps qty at maxQty for product with multiple price options", () => {
    const cart = updateCart(
      CART,
      {
        productId: "test-1",
        price: 2,
        qty: 3,
      },
      ITEM_1_MAX_QTY
    );

    expect(cart.items).toHaveLength(CART.items.length);
    expect(cart.items[1]).toEqual({
      productId: "test-1",
      price: 2,
      qty: 2,
    });
  });

  test("removes item if qty is 0", () => {
    const cart = updateCart(CART, {
      productId: "test-2",
      price: 1,
      qty: 0,
    });

    expect(cart.items).toHaveLength(CART.items.length - 1);
    expect(cart.items.map((item) => item.productId)).not.toContain("test-2");
  });
});

const makeEntry = (overrides: {
  id?: string;
  price?: number;
  maxQuantityPerOrder?: number | null;
}) => ({
  id: overrides.id ?? "muffin",
  data: {
    id: overrides.id ?? "muffin",
    title: "Muffin",
    variants: [{ id: "v1", price: overrides.price ?? 25, description: "St" }],
    images: null,
    content: [],
    maxQuantityPerOrder: overrides.maxQuantityPerOrder !== undefined ? overrides.maxQuantityPerOrder : 10,
    pickupDates: null,
    pickupDateRangeStart: null,
    pickupDateRangeEnd: null,
  },
});

const MUFFIN = makeEntry({});

describe("validateCartContents", () => {
  describe("removes items when", () => {
    test("product no longer exists in CMS", () => {
      const cart: Cart = { items: [{ productId: "deleted", price: 25, qty: 1 }] };
      expect(validateCartContents(cart, [MUFFIN])).toHaveLength(0);
    });

    test("variant price no longer exists on the product", () => {
      const cart: Cart = { items: [{ productId: "muffin", price: 999, qty: 1 }] };
      expect(validateCartContents(cart, [MUFFIN])).toHaveLength(0);
    });

    test("product is marked out of stock (maxQuantityPerOrder === 0)", () => {
      const cart: Cart = { items: [{ productId: "muffin", price: 25, qty: 1 }] };
      expect(validateCartContents(cart, [makeEntry({ maxQuantityPerOrder: 0 })])).toHaveLength(0);
    });
  });

  describe("adjusts qty when", () => {
    test("cart qty exceeds new maxQuantityPerOrder", () => {
      const cart: Cart = { items: [{ productId: "muffin", price: 25, qty: 8 }] };
      const [item] = validateCartContents(cart, [makeEntry({ maxQuantityPerOrder: 3 })]);
      expect(item.qty).toBe(3);
    });

    test("cart qty is at exactly maxQuantityPerOrder", () => {
      const cart: Cart = { items: [{ productId: "muffin", price: 25, qty: 3 }] };
      const [item] = validateCartContents(cart, [makeEntry({ maxQuantityPerOrder: 3 })]);
      expect(item.qty).toBe(3);
    });

    test("maxQuantityPerOrder is null (unlimited) — qty is never capped", () => {
      const cart: Cart = { items: [{ productId: "muffin", price: 25, qty: 999 }] };
      const [item] = validateCartContents(cart, [makeEntry({ maxQuantityPerOrder: null })]);
      expect(item.qty).toBe(999);
    });
  });

  describe("passthrough", () => {
    test("returns valid item with product data attached", () => {
      const cart: Cart = { items: [{ productId: "muffin", price: 25, qty: 2 }] };
      const [item] = validateCartContents(cart, [MUFFIN]);
      expect(item.product).toEqual(MUFFIN.data);
      expect(item.qty).toBe(2);
      expect(item.price).toBe(25);
    });
  });

  describe("multi-item cart", () => {
    test("returns only valid items from a mixed cart", () => {
      const cart: Cart = {
        items: [
          { productId: "muffin", price: 25, qty: 1 },
          { productId: "muffin", price: 999, qty: 1 }, // invalid price
          { productId: "ghost", price: 25, qty: 1 },   // product gone
        ],
      };
      const result = validateCartContents(cart, [MUFFIN]);
      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe("muffin");
      expect(result[0].price).toBe(25);
    });

    test("returns all valid items when multiple products are valid", () => {
      const croissant = makeEntry({ id: "croissant", price: 35 });
      const cart: Cart = {
        items: [
          { productId: "muffin", price: 25, qty: 2 },
          { productId: "croissant", price: 35, qty: 1 },
        ],
      };
      const result = validateCartContents(cart, [MUFFIN, croissant]);
      expect(result).toHaveLength(2);
    });
  });
});
