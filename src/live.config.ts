import { defineLiveCollection } from "astro:content";
import { ProductSchema } from "@lib/schemas/Product";
import { sanityAPI } from "@lib/sanityAPI";
import { FaqItemSchema } from "@lib/schemas/FAQSchema";
import { OpeningHoursSchema } from "@lib/schemas/OpeningHoursSchema";

const products = defineLiveCollection({
  loader: {
    name: "sanity-products",
    loadCollection: async () => {
      const items = await sanityAPI.getProducts();
      return {
        entries: items.map((product) => ({ id: product.id, data: product })),
      };
    },
    loadEntry: async ({ filter }: { filter: { id: string } }) => {
      const product = await sanityAPI.getProduct(filter.id);
      if (!product) return undefined;
      return { id: product.id, data: product };
    },
  },
  schema: ProductSchema,
});

const faq = defineLiveCollection({
  loader: {
    name: "sanity-faq",
    loadCollection: async () => {
      const items = await sanityAPI.getFaq();
      return {
        entries: items.map((item) => ({ id: item.id, data: item })),
      };
    },
    loadEntry: async ({ filter }: { filter: { id: string } }) => {
      const item = await sanityAPI.getFaqItem(filter.id);
      if (!item) return undefined;
      return { id: item.id, data: item };
    },
  },
  schema: FaqItemSchema,
});

const openingHours = defineLiveCollection({
  loader: {
    name: "sanity-opening-hours",
    loadCollection: async () => {
      const items = await sanityAPI.getOpeningHours();
      return {
        entries: items.map((item) => ({ id: item.id, data: item })),
      };
    },
    loadEntry: async ({ filter }: { filter: { id: string } }) => {
      const item = await sanityAPI.getOpeningHoursEntry(filter.id);
      if (!item) return undefined;
      return { id: item.id, data: item };
    },
  },
  schema: OpeningHoursSchema,
});

export const collections = { products, faq, openingHours };
