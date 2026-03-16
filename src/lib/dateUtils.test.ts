import { describe, test } from "vitest";
import {
  addDays,
  getAvailablePickupDates,
  getDatesInRange,
  getDateString,
  isDateInFuture,
  type PickupDateEntry,
} from "./dateUtils";
import { expect } from "@playwright/test";

describe("getDateString", () => {
  test("should format date correctly", () => {
    const date = new Date("Thu Oct 23 2025 15:30:39 GMT+0200");
    const dateStr = getDateString(date);
    expect(dateStr).toStrictEqual("2025-10-23");
  });
});

describe("getDatesInRange", () => {
  test("should throw if start date is after end date", () => {
    expect(() => {
      getDatesInRange("2025-01-02", "2025-01-01");
    }).toThrow();
  });

  test("should throw on invalid date input", () => {
    expect(() => {
      getDatesInRange("1st january 2012", "2012-01-05");
    }).toThrow();

    expect(() => {
      getDatesInRange("2012-01-05", "not a date");
    }).toThrow();
  });

  test("should return single date if start and end date match", () => {
    const dates = getDatesInRange("2025-01-01", "2025-01-01");
    expect(dates).toStrictEqual(["2025-01-01"]);
  });

  test("should return all dates between start and end date", () => {
    const dates = getDatesInRange("2024-12-27", "2025-01-03");
    expect(dates).toStrictEqual([
      "2024-12-27",
      "2024-12-28",
      "2024-12-29",
      "2024-12-30",
      "2024-12-31",
      "2025-01-01",
      "2025-01-02",
      "2025-01-03",
    ]);
  });
});

describe("addDays", () => {
  test("returns a new Date object (does not mutate the original)", () => {
    const base = new Date("2025-10-23");
    const result = addDays(1, base);
    expect(result).not.toBe(base);
    expect(base.toISOString()).toBe("2025-10-23T00:00:00.000Z");
  });

  test("adds positive days correctly within the same month", () => {
    const result = addDays(5, new Date("2025-10-10"));
    expect(result.toISOString().startsWith("2025-10-15")).toBe(true);
  });

  test("adds negative days correctly (goes backwards)", () => {
    const result = addDays(-3, new Date("2025-10-10"));
    expect(result.toISOString().startsWith("2025-10-07")).toBe(true);
  });

  test("handles month rollover correctly", () => {
    const result = addDays(5, new Date("2025-10-29"));
    expect(result.toISOString().startsWith("2025-11-03")).toBe(true);
  });

  test("handles year rollover correctly", () => {
    const result = addDays(2, new Date("2025-12-31"));
    expect(result.toISOString().startsWith("2026-01-02")).toBe(true);
  });

  test("handles leap years correctly (29 Feb)", () => {
    const result = addDays(1, new Date("2024-02-29"));
    expect(result.toISOString().startsWith("2024-03-01")).toBe(true);
  });

  test("defaults to current date when no baseDate is given", () => {
    const before = Date.now();
    const result = addDays(0);
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after + 10);
  });
});

describe("isDateInFuture", () => {
  const base = new Date("2024-05-10T12:00:00Z");

  test("returns true when the input date is after the base date (Date input)", () => {
    expect(isDateInFuture(new Date("2024-05-11T00:00:00Z"), base)).toBe(true);
  });

  test("returns false when the input date is the same as the base date (Date input)", () => {
    expect(isDateInFuture(new Date("2024-05-10T12:00:00Z"), base)).toBe(false);
  });

  test("returns false when the input date is before the base date (Date input)", () => {
    expect(isDateInFuture(new Date("2024-05-09T23:59:59Z"), base)).toBe(false);
  });

  test("returns true for a future ISO date string", () => {
    expect(isDateInFuture("2024-05-12", base)).toBe(true);
  });

  test("returns false for a past ISO date string", () => {
    expect(isDateInFuture("2024-05-01", base)).toBe(false);
  });

  test("handles YYYY-MM-DD strings by treating them as midnight UTC", () => {
    // 2024-05-10 at midnight is still before the base date at noon
    expect(isDateInFuture("2024-05-10", base)).toBe(false);
  });

  test("returns true when using the real current date and the input is tomorrow", () => {
    const today = new Date("2024-05-10T00:00:00Z");
    const tomorrow = "2024-05-11";
    expect(isDateInFuture(tomorrow, today)).toBe(true);
  });

  test("throws or returns false for invalid date strings (choose desired behaviour)", () => {
    expect(() => isDateInFuture("not-a-date", base)).toThrow();
    // or, if you prefer:
    // expect(isDateInFuture("not-a-date", base)).toBe(false);
  });
});

describe("getAvailablePickupDates", () => {
  // The tests will worry about the date range 2-7 days
  // after 2024-03-01, meaning dates from 2024-03-03 to 2024-03-08.
  const BASE_DATE = new Date("2024-03-01");
  const MIN_OFFSET = 2;
  const MAX_OFFSET = 7;

  // We will simulate closed days on the 5th of March.
  const CLOSED_DAYS = ["2024-03-05"];

  // Mock implementation of the Sanity API's getOpenDaysInRage
  const _getDaysInRange = async (min: string, max: string) => {
    return getDatesInRange(min, max).filter(
      (date) => !CLOSED_DAYS.includes(date),
    );
  };

  // Curry the getAvailablePickupDates function with the mock _getDaysInRange implementation and
  // local constants
  const curry = (entries: PickupDateEntry[]) =>
    getAvailablePickupDates(
      MIN_OFFSET,
      MAX_OFFSET,
      _getDaysInRange,
      entries,
      BASE_DATE,
    );

  test("filters out closed days from available pickup dates when no special pickup dates are provided", async () => {
    const entries = [{ pickupDates: null }];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual([
      "2024-03-03",
      "2024-03-04",
      "2024-03-06",
      "2024-03-07",
      "2024-03-08",
    ]);
  });

  test("returns special pickup dates when provided", async () => {
    const entries = [{ pickupDates: ["2024-03-03", "2024-03-04"] }];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual(["2024-03-03", "2024-03-04"]);
  });

  test("filters out dates in the past", async () => {
    const entries = [{ pickupDates: ["2024-02-22", "2024-03-04"] }];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual(["2024-03-04"]);
  });

  test("provided pickup dates override closed days", async () => {
    const entries = [{ pickupDates: ["2024-03-05"] }];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual(["2024-03-05"]);
  });

  test("multiple entries return overlapping pickup dates", async () => {
    const entries = [
      { pickupDates: ["2024-03-03", "2024-03-04"] },
      { pickupDates: ["2024-03-04", "2024-03-05"] },
    ];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual(["2024-03-04"]);
  });
});
