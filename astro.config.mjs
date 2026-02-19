// @ts-check
import { defineConfig, envField } from "astro/config";
import sanity from "@sanity/astro";
import dotenv from "dotenv";
import netlify from "@astrojs/netlify";

// Load environment variables from local .env file into process.env
dotenv.config();

// These variables are needed before Astro is initialized and sets up the runtime 
// environment variables so we need to access them directly from process.env
const { SANITY_DATASET = "production", SANITY_TOKEN } = process.env;

// Throw if no sanity token is found
if (!SANITY_TOKEN) {
  throw new Error("SANITY_TOKEN is not set in the environment variables");
}

console.log("Early env variables:", {
  SANITY_DATASET,
  SANITY_TOKEN,
})

// https://astro.build/config
export default defineConfig({
  integrations: [sanity({
    projectId: "mz20cm4o",
    dataset: SANITY_DATASET,
    apiVersion: "2026-02-19",
    useCdn: false,
    token: SANITY_TOKEN,
  })],
  adapter: netlify(),
  image: {
    domains: ["cdn.sanity.io"],
  },
  env: {
    schema: {
      EXAMPLE_ENV_VARIABLE: envField.string({
        context: "server",
        access: "public",
        default: "default value",
      })
    }
  },
});