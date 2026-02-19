// @ts-check
import { defineConfig } from "astro/config";

import sanity from "@sanity/astro";

const { SANITY_DATASET = "production", SANITY_TOKEN } = process.env;


// https://astro.build/config
export default defineConfig({
  integrations: [sanity({
    projectId: "mz20cm4o",
    dataset: SANITY_DATASET,
    apiVersion: "2024-01-21",
    useCdn: false,
    token: SANITY_TOKEN,
  })]
});