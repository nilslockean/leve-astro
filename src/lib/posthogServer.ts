/**
 * Server-side PostHog capture for ecommerce events.
 * distinct_id must be passed from the client (e.g. checkout form field).
 */
import { PostHog } from "posthog-node";
import { ENABLE_POSTHOG, POSTHOG_PROJECT_API_KEY } from "astro:env/client";
import type { AstroCookies } from "astro";

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
 * Capture an event server-side. No-op if PostHog is disabled or distinctId cookie is missing.
 */
export async function captureEvent(
  event: string,
  cookies: AstroCookies,
  properties?: Record<string, unknown>,
): Promise<void> {
  const distinctId = cookies.get("ph_distinct_id")?.value;
  if (!distinctId) return;

  const client = getClient();
  if (!client) return;

  client.capture({
    distinctId,
    event,
    properties,
  });
  await client.flush();
}
