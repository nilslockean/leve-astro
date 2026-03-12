/**
 * Client-side PostHog capture for ecommerce events.
 */
import PostHog from "posthog-js";
import { ENABLE_POSTHOG } from "astro:env/client";
import { POSTHOG_PROJECT_API_KEY } from "astro:env/client";

/**
 * Capture an event client-side. No-op if PostHog is disabled.
 */
export async function capture(
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  if (!ENABLE_POSTHOG || !POSTHOG_PROJECT_API_KEY) return;

  PostHog.capture(event, {
    properties,
  });
}
