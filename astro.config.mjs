// @ts-check
import { defineConfig } from "astro/config";
import sanity from "@sanity/astro";
import dotenv from "dotenv";
dotenv.config();

const { SANITY_DATASET = "production", SANITY_TOKEN } = process.env;

console.log({
  SANITY_DATASET,
  SANITY_TOKEN,
})

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