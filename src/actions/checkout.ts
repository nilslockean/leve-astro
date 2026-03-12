import { MailerSendAPI } from "@lib/api/MailerSendAPI";
import { getCart, getCartTotal, setCart, EMPTY_CART } from "@lib/cart";
import { getAvailablePickupDates } from "@lib/dateUtils";
import { createOrderConfirmationToken } from "@lib/orderConfirmation";
import { captureEvent } from "@lib/posthogServer";
import { sanityAPI } from "@lib/sanityAPI";
import { orderSnapshotSchema } from "@lib/schemas/OrderSnapshot";
import { defineAction, ActionError } from "astro:actions";
import { getCollection } from "astro:content";
import {
  MAILERSEND_API_KEY,
  ORDER_ADMIN_EMAIL,
  ORDER_ADMIN_PRINTER_EMAIL,
  ORDER_CONFIRMATION_SECRET,
  PICKUP_DATE_MAX_OFFSET,
  PICKUP_DATE_MIN_OFFSET,
} from "astro:env/server";
import { z } from "astro/zod";

export const checkout = defineAction({
  accept: "form",
  input: z.object({
    pickupDate: z.string().date(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    message: z.string().optional(),
    acceptTerms: z.literal("1"),
  }),
  handler: async (input, context) => {
    const { pickupDate, name, email, phone, message } = input;

    const products = await getCollection("products");
    const productIds = products.map((product) => product.id);
    const cart = getCart(context.cookies, productIds);

    if (cart.items.length === 0) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Kundvagnen är tom",
      });
    }

    const cartItems = cart.items.map((item) => {
      const collectionEntry = products.find(({ id }) => id === item.productId);
      if (!collectionEntry) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: `Hittade ingen produkt med ID ${item.productId}`,
        });
      }

      const product = collectionEntry.data;
      const variant = product.variants.find(
        ({ price }) => item.price === price,
      );
      if (!variant) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: `Hittade ingen variant med pris ${item.price}`,
        });
      }

      return {
        ...item,
        product,
        variant,
      };
    });

    const availablePickupDates = await getAvailablePickupDates(
      PICKUP_DATE_MIN_OFFSET,
      PICKUP_DATE_MAX_OFFSET,
      sanityAPI.getOpenDaysInRange.bind(sanityAPI),
      cartItems.map((item) => item.product),
    );
    if (!availablePickupDates.includes(pickupDate)) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: `${pickupDate} är inte ett giltigt upphämtningsdatum`,
      });
    }

    const totals = getCartTotal(cart);
    const orderSnapshot = orderSnapshotSchema.parse({
      customer: {
        name,
        email,
        phone,
        message,
      },
      pickupDate,
      items: cartItems.map(({ product, variant, price, qty }) => ({
        productTitle: product.title,
        variantId: variant.id,
        variantDescription: variant.description,
        unitPrice: price,
        quantity: qty,
        lineTotal: price * qty,
      })),
      totals,
    });
    const order = await sanityAPI.createOrder(orderSnapshot);

    const secret = ORDER_CONFIRMATION_SECRET;
    if (!secret) {
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: "ORDER_CONFIRMATION_SECRET is not configured",
      });
    }
    const token = createOrderConfirmationToken(order.orderNumber, secret);

    const mailerSend = new MailerSendAPI({
      snapshot: orderSnapshot,
      createdAt: order._createdAt,
      orderNr: order.orderNumber,
      adminEmail: ORDER_ADMIN_EMAIL,
      apiKey: MAILERSEND_API_KEY,
      hostname: context.url.hostname,
    });

    try {
      await mailerSend.sendOrderConfirmation();
      await mailerSend.sendAdminNotification();
      if (ORDER_ADMIN_PRINTER_EMAIL) {
        await mailerSend.sendAdminNotification(ORDER_ADMIN_PRINTER_EMAIL);
      }
    } catch (error) {
      throw new ActionError({
        code: "SERVICE_UNAVAILABLE",
        message: "Kunde inte skicka bekräftelsemail.",
      });
    }

    await captureEvent("Order Completed", context.cookies, {
      order_id: order.orderNumber,
      total: totals.total,
      revenue: totals.total - totals.tax,
      tax: totals.tax,
      currency: "SEK",
      products: orderSnapshot.items.map((item) => ({
        product_id: item.variantId,
        name: item.productTitle,
        variant: item.variantDescription,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
    });

    setCart(context.cookies, EMPTY_CART);

    return {
      success: true,
      payload: { orderId: order.orderNumber, token },
    };
  },
});
