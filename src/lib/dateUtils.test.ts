import { describe, test } from "vitest";
import {
  addDays,
  formatDate,
  getAvailablePickupDates,
  getDatesInRange,
  getDateString,
  isDateInFuture,
  type PickupDateEntry,
} from "./dateUtils";
import { expect } from "@playwright/test";
import { capitalize } from "./stringUtils";

describe("getDateString", () => {
  test("should format date correctly", () => {
    const date = new Date("Thu Oct 23 2025 15:30:39 GMT+0200");
    const dateStr = getDateString(date);
    expect(dateStr).toStrictEqual("2025-10-23");
  });
});

describe("formatDate", () => {
  test("should format date correctly", () => {
    const dateStr = "2025-05-01";
    const formattedDate = formatDate(dateStr);
    expect(formattedDate).toStrictEqual("torsdag 1 maj 2025");
  });

  test("should capitalize string if capitalize function is provided", () => {
    const dateStr = "2025-05-01";
    const formattedDate = formatDate(dateStr, capitalize);
    expect(formattedDate).toStrictEqual("Torsdag 1 maj 2025");
  });
});

describe("getDatesInRange", () => {
  test("should return empty array if start date is after end date", () => {
    const dates = getDatesInRange("2025-01-02", "2025-01-01");
    expect(dates).toStrictEqual([]);
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
  const BASE_DATE = new Date("2024-03-01"); // Defaults to today's date at runtime
  const MIN_OFFSET = 2;
  const MAX_OFFSET = 7;

  // We will simulate closed days on the 5th of March.
  const CLOSED_DAYS = ["2024-03-05"];

  // Curry the getAvailablePickupDates function with the mock _getDaysInRange implementation and
  // local constants
  type CurryOptions = {
    baseDate?: Date;
    minOffset?: number;
    maxOffset?: number;
    closedDays?: string[];
  };
  const curry = (entries: PickupDateEntry[], options: CurryOptions = {}) => {
    // Mock implementation of the Sanity API's getOpenDaysInRage
    const closedDays = options.closedDays ?? CLOSED_DAYS;
    const _getOpenDaysInRange = async (min: string, max: string) => {
      return getDatesInRange(min, max).filter(
        (date) => !closedDays.includes(date),
      );
    };

    return getAvailablePickupDates(
      options.minOffset ?? MIN_OFFSET,
      options.maxOffset ?? MAX_OFFSET,
      _getOpenDaysInRange,
      entries,
      options.baseDate ?? BASE_DATE,
    );
  };

  test("filters out closed days from available pickup dates when no special pickup dates are provided", async () => {
    const entries = [
      {
        pickupDates: null,
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
    ];
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
    const entries = [
      {
        pickupDates: ["2024-03-03", "2024-03-04"],
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual(["2024-03-03", "2024-03-04"]);
  });

  test("allows pickup tomorrow if special pickup date is tomorrow", async () => {
    const entries = [
      {
        pickupDates: ["2024-03-03"],
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-03-02"),
    });
    expect(pickupDates).toEqual(["2024-03-03"]);
  });

  test("doeesnt allow pickup today if special pickup date is today", async () => {
    const entries = [
      {
        pickupDates: ["2024-03-03"],
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-03-03"),
    });
    expect(pickupDates).toEqual([]);
  });

  test("filters out dates in the past", async () => {
    const entries = [
      {
        pickupDates: ["2024-02-22", "2024-03-04"],
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual(["2024-03-04"]);
  });

  test("provided pickup dates override closed days", async () => {
    const entries = [
      {
        pickupDates: ["2024-03-05"],
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries, { closedDays: ["2024-03-05"] });
    expect(pickupDates).toEqual(["2024-03-05"]);
  });

  test("multiple entries return overlapping pickup dates", async () => {
    const entries = [
      {
        pickupDates: ["2024-03-03", "2024-03-04"],
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
      {
        pickupDates: ["2024-03-04", "2024-03-05"],
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual(["2024-03-04"]);
  });

  test("returns dates within the range when provided and filters out closed days", async () => {
    const entries = [
      {
        pickupDates: null,
        pickupDateRangeStart: "2024-03-03",
        pickupDateRangeEnd: "2024-03-07",
      },
    ];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual([
      "2024-03-03",
      "2024-03-04",
      "2024-03-06",
      "2024-03-07",
    ]);
  });

  test("returns only dates within the provided date range if both range and specific dates are provided", async () => {
    const entries = [
      {
        pickupDates: ["2024-04-01", "2024-04-05", "2024-04-08"],
        pickupDateRangeStart: "2024-04-03",
        pickupDateRangeEnd: "2024-04-07",
      },
    ];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual(["2024-04-05"]);
  });

  test("returns maxOffset days from start date and filters out closed days if only range start is provided", async () => {
    const entries = [
      {
        pickupDates: null,
        pickupDateRangeStart: "2024-05-01",
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-04-01"),
      minOffset: 2,
      maxOffset: 5,
    });
    expect(pickupDates).toEqual([
      "2024-05-01",
      "2024-05-02",
      "2024-05-03",
      "2024-05-04",
      "2024-05-05",
      "2024-05-06",
    ]);
  });

  test("returns maxOffset days from start date, strips minOffset days from base date, and filters out closed days if only range start is provided", async () => {
    const entries = [
      {
        pickupDates: null,
        pickupDateRangeStart: "2024-04-01",
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-04-01"),
      minOffset: 2,
      maxOffset: 5,
    });
    expect(pickupDates).toEqual([
      "2024-04-03",
      "2024-04-04",
      "2024-04-05",
      "2024-04-06",
    ]);
  });

  test("returns all days up to end date, strips minOffset days from base date, and filters out closed days if only range end is provided", async () => {
    const entries = [
      {
        pickupDates: null,
        pickupDateRangeStart: null,
        pickupDateRangeEnd: "2024-04-10",
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-04-01"),
      minOffset: 2,
      maxOffset: 5,
      closedDays: ["2024-04-05", "2024-04-06"],
    });
    expect(pickupDates).toEqual([
      "2024-04-03",
      "2024-04-04",
      "2024-04-07",
      "2024-04-08",
      "2024-04-09",
      "2024-04-10",
    ]);
  });

  test("returns intersection if multiple entries with date ranges are provided", async () => {
    const entries = [
      {
        pickupDates: null,
        pickupDateRangeStart: "2024-04-01",
        pickupDateRangeEnd: "2024-04-10",
      },
      {
        pickupDates: null,
        pickupDateRangeStart: "2024-04-05",
        pickupDateRangeEnd: "2024-04-15",
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-04-01"),
      minOffset: 2,
      maxOffset: 5,
      closedDays: ["2024-04-06"],
    });
    expect(pickupDates).toEqual([
      "2024-04-05",
      "2024-04-07",
      "2024-04-08",
      "2024-04-09",
      "2024-04-10",
    ]);
  });

  test("returns intersection if one entry has specific date and another has range", async () => {
    const entries = [
      {
        pickupDates: ["2024-04-01", "2024-04-05"],
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
      {
        pickupDates: null,
        pickupDateRangeStart: "2024-04-01",
        pickupDateRangeEnd: "2024-04-10",
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-04-01"),
      minOffset: 2,
      maxOffset: 5,
    });
    expect(pickupDates).toEqual(["2024-04-05"]);
  });

  test("returns empty array if multiple entries have ranges with no intersection", async () => {
    const entries = [
      {
        pickupDates: null,
        pickupDateRangeStart: "2024-04-01",
        pickupDateRangeEnd: "2024-04-10",
      },
      {
        pickupDates: null,
        pickupDateRangeStart: "2024-04-11",
        pickupDateRangeEnd: "2024-04-20",
      },
    ];
    const pickupDates = await curry(entries);
    expect(pickupDates).toEqual([]);
  });

  test("returns default dates if range start is in the past", async () => {
    const entries = [
      {
        pickupDates: null,
        pickupDateRangeStart: "2024-01-30",
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-03-01"),
      minOffset: 2,
      maxOffset: 7,
      closedDays: ["2024-03-05"],
    });

    expect(pickupDates).toEqual([
      "2024-03-03",
      "2024-03-04",
      "2024-03-06",
      "2024-03-07",
      "2024-03-08",
    ]);
  });

  test("returns empty array if end date is in the past", async () => {
    const entries = [
      {
        pickupDates: null,
        pickupDateRangeStart: null,
        pickupDateRangeEnd: "2024-02-28",
      },
      {
        pickupDates: null,
        pickupDateRangeStart: null,
        pickupDateRangeEnd: "2024-01-05",
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-03-01"),
    });

    expect(pickupDates).toEqual([]);
  });

  test("returns empty array if specific date is in the past", async () => {
    const entries = [
      {
        pickupDates: ["2024-02-28"],
        pickupDateRangeStart: null,
        pickupDateRangeEnd: null,
      },
    ];
    const pickupDates = await curry(entries, {
      baseDate: new Date("2024-03-01"),
    });

    expect(pickupDates).toEqual([]);
  });
});
