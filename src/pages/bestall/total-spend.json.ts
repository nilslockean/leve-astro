import type { APIRoute } from "astro";
import { sanityAPI } from "@lib/sanityAPI";

export const prerender = false;

export const GET: APIRoute = async () => {
  const orders = await sanityAPI.getOrders();
  const totalSpend = orders
    .filter((order) => order.totals !== null)
    .map((order) => order.totals.total - order.totals.tax)
    .reduce((sum, orderTotal) => sum + orderTotal);

  return new Response(
    JSON.stringify({
      total: totalSpend,
      tax: "excluded",
    }),
  );
};
