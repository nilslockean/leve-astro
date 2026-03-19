import { sanityAPI } from "./sanityAPI";
import {
  PICKUP_DATE_MIN_OFFSET,
  PICKUP_DATE_MAX_OFFSET,
} from "astro:env/server";
import { getAvailablePickupDates, type PickupDateEntry } from "./dateUtils";
import { getPickupDateDescription } from "./stringUtils";

/**
 * Server-side helper that wraps getAvailablePickupDates with environment
 * variables and Sanity API configuration. Only requires product entries.
 *
 * @param entries - Single pickup date entry or array of entries (products)
 * @returns Promise<string[]> - Array of available pickup dates
 */
export async function getPickupDatesForProducts(
  entries: PickupDateEntry | PickupDateEntry[],
): Promise<string[]> {
  const entriesArray = Array.isArray(entries) ? entries : [entries];

  return getAvailablePickupDates(
    PICKUP_DATE_MIN_OFFSET,
    PICKUP_DATE_MAX_OFFSET,
    sanityAPI.getOpenDaysInRange.bind(sanityAPI),
    entriesArray,
  );
}

/**
 * Server-side helper that returns a human-readable pickup dates description for a product.
 */
export async function getPickupDatesDescriptionForProduct(
  entry: PickupDateEntry,
): Promise<string> {
  const availablePickupDates = await getPickupDatesForProducts(entry);

  return getPickupDateDescription(
    entry,
    availablePickupDates,
    PICKUP_DATE_MIN_OFFSET,
    PICKUP_DATE_MAX_OFFSET,
  );
}
