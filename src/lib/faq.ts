import { getLiveCollection } from "astro:content";
import type { Faq } from "./schemas/FAQSchema";

export async function getFaq(): Promise<Faq> {
  const { entries = [] } = await getLiveCollection("faq");
  return entries.map((e) => e.data) as Faq;
}
