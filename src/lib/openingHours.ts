import { getLiveEntry } from "astro:content";
import type { OpeningHours } from "./schemas/OpeningHoursSchema";

export async function getOpeningHoursEntry(
  id: string,
): Promise<OpeningHours | undefined> {
  const result = await getLiveEntry("openingHours", id);
  return result?.entry?.data;
}

export async function getDefaultOpeningHours(): Promise<OpeningHours> {
  const entry = await getOpeningHoursEntry("default");
  if (!entry) {
    throw new Error(
      'No opening hours entry with ID "default" found in content collection',
    );
  }
  return entry;
}
