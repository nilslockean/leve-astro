import { z as zod } from "astro/zod";
import DateComparator from "./dateComparator";

// Turns a Date object into a YYYY-MM-DD string
export function getDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

// Returns all dates starting and ending with the provided dates
// in YYYY-MM-DD format
const isoDateString = (z: typeof zod) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)");

export function formatDate(
  dateStr: string,
  capitalize?: (str: string) => string,
) {
  const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "full",
  });

  const formattedDate = dateFormatter.format(new Date(dateStr));
  return capitalize ? capitalize(formattedDate) : formattedDate;
}

export function getDatesInRange(start: string, end: string, z = zod) {
  const schema = z.tuple([isoDateString(z), isoDateString(z)]);
  const [startDateStr, endDateStr] = schema.parse([start, end]);
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (startDate > endDate) {
    return [];
  }

  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = getDateString(
      new Date(current.getTime() - current.getTimezoneOffset() * 60000),
    );
    dates.push(dateStr);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function addDays(offset: number, baseDate = new Date()) {
  const result = new Date(baseDate);
  result.setDate(baseDate.getDate() + offset);
  return result;
}

export function isDateInFuture(
  input: string | Date,
  baseDate = new Date(),
): boolean {
  const comparator = new DateComparator(baseDate);
  return comparator.isFuture(input);
}

export type PickupDateEntry = {
  pickupDates: string[] | null;
  pickupDateRangeStart: string | null;
  pickupDateRangeEnd: string | null;
};

type PickupDateContext = {
  minOffset: number;
  maxOffset: number;
  baseDate: Date;
  pickupDateMin: Date;
  pickupDateMax: Date;
  getOpenDaysInRange: (min: string, max: string) => Promise<string[]>;
};

function hasDateConstraints(entry: PickupDateEntry): boolean {
  return Boolean(
    (entry.pickupDates && entry.pickupDates.length > 0) ||
    entry.pickupDateRangeStart ||
    entry.pickupDateRangeEnd,
  );
}

function getFutureDates(dates: string[], baseDate: Date): string[] {
  return dates.filter((dateStr) => isDateInFuture(dateStr, baseDate));
}

/**
 * Calculates the date range based on provided start/end and fallback dates
 * Returns [startDate, endDate] as ISO date strings
 */
function calculateDateRange(
  rangeStart: string | null,
  rangeEnd: string | null,
  ctx: PickupDateContext,
): [string, string] {
  if (rangeStart && !rangeEnd) {
    const startDate = new Date(rangeStart);
    return [rangeStart, getDateString(addDays(ctx.maxOffset, startDate))];
  }

  if (!rangeStart && rangeEnd) {
    return [getDateString(ctx.pickupDateMin), rangeEnd];
  }

  if (rangeStart && rangeEnd) {
    return [rangeStart, rangeEnd];
  }

  return [getDateString(ctx.pickupDateMin), getDateString(ctx.pickupDateMax)];
}

async function getRangeDates(
  rangeStart: string | null,
  rangeEnd: string | null,
  ctx: PickupDateContext,
): Promise<string[]> {
  const [start, end] = calculateDateRange(rangeStart, rangeEnd, ctx);
  const dates = await ctx.getOpenDaysInRange(start, end);
  const minAllowedDate = addDays(ctx.minOffset, ctx.baseDate);
  const comparator = new DateComparator(minAllowedDate);

  return dates.filter((dateStr) => comparator.isPresentOrFuture(dateStr));
}

async function getAllowedDatesForEntry(
  entry: PickupDateEntry,
  ctx: PickupDateContext,
): Promise<string[]> {
  const specificDates = getFutureDates(entry.pickupDates ?? [], ctx.baseDate);

  const hasRange = Boolean(
    entry.pickupDateRangeStart || entry.pickupDateRangeEnd,
  );

  if (!hasRange) {
    return specificDates;
  }

  const rangeDates = await getRangeDates(
    entry.pickupDateRangeStart,
    entry.pickupDateRangeEnd,
    ctx,
  );

  if (specificDates.length === 0) {
    return rangeDates;
  }

  return specificDates.filter((date) => rangeDates.includes(date));
}

function intersectDateArrays(dateArrays: string[][]): string[] {
  if (dateArrays.length === 0) return [];
  return dateArrays.reduce((acc, curr) =>
    acc.filter((date) => curr.includes(date)),
  );
}

export async function getAvailablePickupDates(
  minOffset: number,
  maxOffset: number,
  getOpenDaysInRange: (min: string, max: string) => Promise<string[]>,
  entries: PickupDateEntry[],
  baseDate = new Date(),
): Promise<string[]> {
  const ctx: PickupDateContext = {
    minOffset,
    maxOffset,
    baseDate,
    pickupDateMin: addDays(minOffset, baseDate),
    pickupDateMax: addDays(maxOffset, baseDate),
    getOpenDaysInRange,
  };

  const defaultDates = await ctx.getOpenDaysInRange(
    getDateString(ctx.pickupDateMin),
    getDateString(ctx.pickupDateMax),
  );

  const constrainedEntries = entries.filter(hasDateConstraints);

  if (constrainedEntries.length === 0) {
    return defaultDates;
  }

  const allowedDatesByEntry = await Promise.all(
    constrainedEntries.map((entry) => getAllowedDatesForEntry(entry, ctx)),
  );

  const result = intersectDateArrays(allowedDatesByEntry);

  // Handle empty results for single entry
  if (result.length === 0 && constrainedEntries.length === 1) {
    const entry = constrainedEntries[0];

    // If end date is explicitly set and in the past, return empty (expired range)
    if (
      entry.pickupDateRangeEnd &&
      !isDateInFuture(entry.pickupDateRangeEnd, ctx.baseDate)
    ) {
      return [];
    }

    // Otherwise fall back to defaults (e.g., start date in past with no end)
    return defaultDates;
  }

  return result;
}
