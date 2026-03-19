import { test, expect } from "vitest";
import DateComparator from "./dateComparator";

const comparator = new DateComparator(new Date("2024-01-01"));

test("isFuture", () => {
  expect(comparator.isFuture("2024-01-02")).toBe(true);
  expect(comparator.isFuture("2023-12-31")).toBe(false);
  expect(comparator.isFuture(new Date("2024-01-02"))).toBe(true);
  expect(comparator.isFuture(new Date("2023-12-31"))).toBe(false);
  expect(comparator.isFuture(new Date("2024-01-01T02:02:02"))).toBe(true);
});

test("isPast", () => {
  expect(comparator.isPast("2024-01-02")).toBe(false);
  expect(comparator.isPast("2024-01-01")).toBe(false);
});

test("isPresentOrFuture", () => {
  expect(comparator.isPresentOrFuture("2024-01-02")).toBe(true);
  expect(comparator.isPresentOrFuture("2024-01-01")).toBe(true);
});
