import { z } from "astro/zod";

export const EventScopeSchema = z.enum(["upcoming", "past", "all"]);
export type EventScope = z.infer<typeof EventScopeSchema>;
