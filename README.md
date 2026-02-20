# Bageri Leve

Website for artisan bakery [Leve](https://bagerileve.se) in Malmö, Sweden. Built with Astro, deployed on Netlify. Content is managed in a separate Sanity project.

## Getting access

Before you can run the site locally or deploy, you need access to the following. Ask the project maintainer (see [Contact](#contact)) if you don’t have access yet.

| Service | What it’s for | What you need |
| -------- | -------------- | -------------- |
| **GitHub** | Repo (this site) | Clone access; push access if you’ll deploy. |
| **Netlify** | Hosting, deploys, env vars | Team/site access. Easiest way to get production env vars for your local `.env`. |
| **Sanity** | CMS (content, media) | Access to the project; create a read token for `SANITY_TOKEN`. Sanity project lives in [a separate repo](https://github.com/your-org/leve-sanity). |
| **MailerSend** | Order/contact emails | API key for `MAILERSEND_API_KEY` if you work on forms or checkout. |
| **PostHog** | Analytics | Optional; defaults exist for dev. For production keys, use PostHog project access. |
| **Fienta** | Event/order forms (if used) | API key for `FIENTA_API_KEY` if you work on Fienta integrations. |

**Getting env vars for local dev:** Copy them from **Netlify** (Site settings → Environment variables) or ask for a shared `.env.example` / secure list. Never commit `.env` or real secrets to the repo.

## Tech stack

- **[Astro](https://astro.build)** – Site framework
- **[Netlify](https://www.netlify.com)** – Hosting & deployment
- **[Sanity](https://www.sanity.io)** – CMS (lives in [a separate repo](https://github.com/your-org/leve-sanity))
- **[Tailwind CSS](https://tailwindcss.com)** – Styling
- **[PostHog](https://posthog.com)** – Analytics (optional)

## Prerequisites

- Node.js 24+
- npm

## Setup

After you have [access](#getting-access) to the repo and at least Netlify or Sanity (for env vars):

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd leve-astro
   npm install
   ```

2. **Environment variables**

   Create a `.env` file in the project root (copy from Netlify or get values from the team). The following are **required** for the site to build and run:

   | Variable         | Description                                 |
   | ---------------- | ------------------------------------------- |
   | `SANITY_TOKEN`   | Sanity API token (read access)              |
   | `SANITY_DATASET` | Sanity dataset name (default: `production`) |

   Additional variables are defined in `astro.config.mjs` under `env.schema`. They include optional feature flags and secrets for Fienta, MailerSend, PostHog, Weglot, and order/checkout. Set only what you need for local development or the environment you’re deploying to.

3. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:4321](http://localhost:4321).

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start dev server         |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |
| `npm run format`  | Format with Prettier     |
| `npm run test`    | Run unit + E2E tests     |

## Preview branch (client access)

A **preview** branch is kept in sync with `main` so Netlify can serve a stable preview URL (e.g. `preview.bagerileve.se`) for temporary client access.

**How it works**

- A GitHub Action **“Sync main to preview”** runs on every push to `main`.
- It merges `main` into `preview` and pushes, which triggers a Netlify deploy of the preview branch.
- Configure Netlify so the `preview` branch deploys to your preview subdomain (e.g. a branch deploy or a second site linked to this branch).

**Manual sync**

- You can also run the workflow from the GitHub Actions tab: **Sync main to preview** → “Run workflow”.

## Deployment

The site is built and deployed on **Netlify** using the Astro Netlify adapter. Configure in Netlify:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Environment variables:** Set `SANITY_TOKEN` and `SANITY_DATASET` (and any other env vars from the schema) in the Netlify dashboard for both production and preview deploys.

## Contact

Nils Lockean – [nils@lockean.se](mailto:nils@lockean.se)
