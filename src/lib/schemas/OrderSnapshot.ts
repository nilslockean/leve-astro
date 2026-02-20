import { z } from "astro/zod";

export const orderSnapshotSchema = z.object({
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    message: z.string().optional(),
  }),
  pickupDate: z.string().date(),
  items: z.array(
    z.object({
      productTitle: z.string(),
      variantId: z.string(),
      variantDescription: z.string(),
      unitPrice: z.number(),
      quantity: z.number(),
      lineTotal: z.number(),
    }),
  ),
  totals: z.object({
    tax: z.number(),
    total: z.number(),
  }),
});

export type OrderSnapshot = z.infer<typeof orderSnapshotSchema>;
