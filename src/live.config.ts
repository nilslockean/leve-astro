import { defineLiveCollection } from "astro:content";
import { ProductSchema } from "@lib/schemas/Product";
import { sanityAPI } from "@lib/sanityAPI";

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

export const collections = { products };
