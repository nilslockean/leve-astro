import { describe, expect, test } from "vitest";
import {
  consolidateOpeningHours,
  formatConsolidatedDays,
  getOpeningHoursForDate,
} from "./openingHoursUtils";
import type { OpeningHours } from "./schemas/OpeningHoursSchema";

const baseOpeningHours: OpeningHours = {
  id: "default",
  title: "Default",
  days: {
    mon: { day: 1, time: "10:00-18:00" },
    tue: { day: 2, time: "10:00-18:00" },
    wed: { day: 3, time: "10:00-18:00" },
    thu: { day: 4, time: "10:00-18:00" },
    fri: { day: 5, time: "10:00-18:00" },
    sat: { day: 6, time: "10:00-15:00" },
    sun: { day: 0, closed: true },
  },
};

describe("getOpeningHoursForDate", () => {
  test("returns time for a regular open day", () => {
    // 2026-06-08 is a Monday
    expect(getOpeningHoursForDate("2026-06-08", baseOpeningHours)).toEqual({
      irregular: false,
      time: "10:00-18:00",
    });
  });

  test("returns different time for Saturday", () => {
    // 2026-06-06 is a Saturday
    expect(getOpeningHoursForDate("2026-06-06", baseOpeningHours)).toEqual({
      irregular: false,
      time: "10:00-15:00",
    });
  });

  test("returns closed for a regular closed day", () => {
    // 2026-06-07 is a Sunday
    expect(getOpeningHoursForDate("2026-06-07", baseOpeningHours)).toEqual({
      closed: true,
      irregular: false,
    });
  });

  test("irregular open entry overrides regular schedule", () => {
    const openingHours: OpeningHours = {
      ...baseOpeningHours,
      irregular: [{ date: "2026-06-08", time: "12:00-16:00", name: "Kortdag" }],
    };
    expect(getOpeningHoursForDate("2026-06-08", openingHours)).toEqual({
      irregular: true,
      time: "12:00-16:00",
      name: "Kortdag",
    });
  });

  test("irregular closed entry overrides regular schedule", () => {
    const openingHours: OpeningHours = {
      ...baseOpeningHours,
      irregular: [{ date: "2026-06-08", closed: true, name: "Midsommar" }],
    };
    expect(getOpeningHoursForDate("2026-06-08", openingHours)).toEqual({
      closed: true,
      irregular: true,
      name: "Midsommar",
    });
  });

  test("irregular entry without name omits name", () => {
    const openingHours: OpeningHours = {
      ...baseOpeningHours,
      irregular: [{ date: "2026-06-08", time: "09:00-14:00" }],
    };
    const result = getOpeningHoursForDate("2026-06-08", openingHours);
    expect(result.name).toBeUndefined();
  });

  test("unrelated irregular entries do not affect other dates", () => {
    const openingHours: OpeningHours = {
      ...baseOpeningHours,
      irregular: [{ date: "2026-06-09", closed: true }],
    };
    expect(getOpeningHoursForDate("2026-06-08", openingHours)).toEqual({
      irregular: false,
      time: "10:00-18:00",
    });
  });
});

describe("consolidateOpeningHours", () => {
  test("should consolidate opening hours correctly", async () => {
    const consolidatedHours = consolidateOpeningHours({
      sat: {
        closed: false,
        day: 6,
        time: "9-16",
      },
      sun: {
        closed: true,
        day: 0,
      },
      mon: {
        closed: true,
        day: 1,
      },
      tue: {
        closed: true,
        day: 2,
      },
      wed: {
        closed: false,
        day: 3,
        time: "11-18",
      },
      thu: {
        closed: false,
        day: 4,
        time: "11-18",
      },
      fri: {
        closed: false,
        day: 5,
        time: "11-18",
      },
    });

    expect(consolidatedHours).toEqual([
      { from: 1, to: 2, closed: true },
      { from: 3, to: 5, time: "11-18" },
      { from: 6, to: 6, time: "9-16" },
      { from: 0, to: 0, closed: true },
    ]);
  });
});

describe("formatConsolidatedDays", () => {
  test("should format single day", () => {
    const formatted = formatConsolidatedDays({ from: 0, to: 0 });
    expect(formatted).toEqual("söndag");
  });

  test("should format weekday range", () => {
    const formatted = formatConsolidatedDays({ from: 1, to: 4 });
    expect(formatted).toEqual("måndag-torsdag");
  });
});
