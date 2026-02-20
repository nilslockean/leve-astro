import { z } from "astro/zod";
import { FientaEventDetailsSchema } from "./FientaEventDetails";
import { composeResponseSchema } from "./FientaResponseSchema";

export const FientaSingleEventResponseSchema = composeResponseSchema(
  FientaEventDetailsSchema
);

export type FientaSingleEventResponse = z.infer<
  typeof FientaSingleEventResponseSchema
>;
