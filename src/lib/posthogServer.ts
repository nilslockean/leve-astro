/**
 * Server-side PostHog capture for ecommerce events.
 * distinct_id must be passed from the client (e.g. checkout form field).
 */
import { PostHog } from "posthog-node";
import { ENABLE_POSTHOG } from "astro:env/server";
import { POSTHOG_PROJECT_API_KEY } from "astro:env/client";

const POSTHOG_HOST = "https://eu.i.posthog.com";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!ENABLE_POSTHOG || !POSTHOG_PROJECT_API_KEY) return null;
  if (!client) {
    client = new PostHog(POSTHOG_PROJECT_API_KEY, { host: POSTHOG_HOST });
  }
  return client;
}

/**
 * Capture an event server-side. No-op if PostHog is disabled or distinctId is missing.
 */
export async function capture(
  distinctId: string | undefined,
  event: string,
  properties: Record<string, unknown>,
): Promise<void> {
  if (!distinctId) return;
  const c = getClient();
  if (!c) return;

  c.capture({
    distinctId,
    event,
    properties,
  });
  await c.flush();
}
