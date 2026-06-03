import { z } from "astro/zod";

export const FaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.array(z.any()),
});

export const FaqSchema = z.array(FaqItemSchema);

export type FaqItem = z.infer<typeof FaqItemSchema>;
export type Faq = z.infer<typeof FaqSchema>;
