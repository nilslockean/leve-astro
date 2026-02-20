/* eslint-disable no-undef */
import { defineConfig, envField } from "astro/config";
import sanity from "@sanity/astro";
import dotenv from "dotenv";
import netlify from "@astrojs/netlify";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

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
});

// https://astro.build/config
export default defineConfig({
  site: "https://bagerileve.se",

  integrations: [
    sanity({
      projectId: "mz20cm4o",
      dataset: SANITY_DATASET,
      apiVersion: "2026-02-19",
      useCdn: false,
      token: SANITY_TOKEN,
    }),
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/partials/"),
    }),
  ],

  adapter: netlify(),

  image: {
    domains: ["cdn.sanity.io"],
  },

  server: {
    allowedHosts: [
      "leve-astro-staging.netlify.app",
      "devserver-main--leve-astro.netlify.app",
    ],
  },

  env: {
    schema: {
      EXAMPLE_ENV_VARIABLE: envField.string({
        context: "server",
        access: "public",
        default: "default value",
      }),
      BEHOLD_FEED_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      FIENTA_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      ENABLE_WEGLOT: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
        default: false,
      }),
      WEGLOT_API_KEY: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "wg_137e3716c0aa4f3c19e9f429cfbb510b2",
      }),
      ENABLE_VIEW_TRANSITIONS: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
        default: false,
      }),
      ENABLE_POSTHOG: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
        default: true,
      }),
      POSTHOG_PROJECT_API_KEY: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "phc_FpOtrZTQsFj3URscXo70ak6KyVRM1kAe5t8zqmS0r9r",
      }),
      PICKUP_DATE_MIN_OFFSET: envField.number({
        context: "server",
        access: "public",
        optional: false,
        default: 2,
      }),
      PICKUP_DATE_MAX_OFFSET: envField.number({
        context: "server",
        access: "public",
        optional: false,
        default: 30,
      }),
      ENABLE_STOREFRONT: envField.boolean({
        context: "server",
        access: "public",
        optional: false,
        default: false,
      }),
      MAILERSEND_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      ORDER_ADMIN_EMAIL: envField.string({
        context: "server",
        access: "public",
        default: "order@bagerileve.se",
      }),
      ORDER_ADMIN_PRINTER_EMAIL: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "cbty732mccw842@hpeprint.com",
      }),
      ORDER_CONFIRMATION_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "order-confirmation-secret",
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
