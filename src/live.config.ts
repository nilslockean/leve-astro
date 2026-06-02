import { defineLiveCollection } from "astro:content";
import { ProductSchema } from "@lib/schemas/Product";
import { sanityClient } from "sanity:client";
import groq from "groq";

const PRODUCT_FIELDS = `{
  'id': slug.current,
  maxQuantityPerOrder,
  title,
  content,
  images,
  variants[]{
    "id": id.current,
    price,
    description
  },
  pickupDates,
  pickupDateRangeStart,
  pickupDateRangeEnd,
}`;

const products = defineLiveCollection({
  loader: {
    name: "sanity-products",
    loadCollection: async () => {
      const items = await sanityClient.fetch<Record<string, unknown>[]>(
        groq`*[_type == "product"] ${PRODUCT_FIELDS}`,
      );
      return {
        entries: items.map((item) => ({ id: String(item.id), data: item })),
      };
    },
    loadEntry: async ({ filter }) => {
      const item = await sanityClient.fetch<Record<string, unknown> | null>(
        groq`*[_type == "product" && slug.current == $id][0] ${PRODUCT_FIELDS}`,
        { id: filter.id },
      );
      if (!item) return undefined;
      return { id: String(item.id), data: item };
    },
  },
  schema: ProductSchema,
});

export const collections = { products };
