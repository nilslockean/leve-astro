import { getThankYouUrl } from "@config/site";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Create an HMAC-SHA256 token for orderId. Used to build the thank-you page URL
 * and the link in the order confirmation email. Server-only (requires secret).
 */
export function createOrderConfirmationToken(
  orderId: string,
  secret: string,
): string {
  return createHmac("sha256", secret).update(orderId).digest("hex");
}

/**
 * Verify that the token matches the expected HMAC for the given orderId.
 * Uses timing-safe comparison to avoid timing attacks.
 */
export function verifyOrderConfirmationToken(
  orderId: string,
  token: string,
  secret: string,
): boolean {
  const expected = createOrderConfirmationToken(orderId, secret);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

/** Compose the thank-you page URL from orderId and token. */
export function composeThankYouUrl(orderId: string, token: string): string {
  return `${getThankYouUrl()}?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`;
}
