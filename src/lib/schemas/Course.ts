import { z } from "astro/zod";

export const CourseSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  start: z.date(),
  dates: z.string(), // Lördag 17 juni - söndag 18 juni
  draft: z.boolean(),
  soldOut: z.boolean(),
  salesEnded: z.boolean(),
  slug: z.string(),
  year: z.number(),
  image: z.string().url().optional(),
});

export type Course = z.infer<typeof CourseSchema>;
