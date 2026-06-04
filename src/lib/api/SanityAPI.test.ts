import { test, describe, beforeEach } from "vitest";
import { expect } from "vitest";
import type { ISanityClient } from "@lib/types/ISanityClient";
import { SanityAPI } from "./SanityAPI";

class MockSanityClient implements ISanityClient {
  public returnData: unknown = {};

  public async fetch<T>(): Promise<T> {
    return this.returnData as T;
  }
}
const sanityClient = new MockSanityClient();
const api = new SanityAPI(sanityClient, "12345", "test");
const DEFAULT_WEEKDAYS = {
  fri: {
    closed: false,
    day: 5,
    time: "11-18",
  },
  mon: {
    closed: true,
    day: 1,
  },
  sat: {
    closed: false,
    day: 6,
    time: "9-16",
  },
  sun: {
    closed: false,
    day: 0,
    time: "9-16",
  },
  thu: {
    closed: false,
    day: 4,
    time: "11-18",
  },
  tue: {
    closed: false,
    day: 2,
    time: "11-18",
  },
  wed: {
    closed: false,
    day: 3,
    time: "11-18",
  },
};

beforeEach(() => {
  sanityClient.returnData = {};
  api.now = undefined;
});

describe("SanityAPI", () => {
  test("should return asset URL", async () => {
    const result = api.getAsset("test.jpg");
    expect(result).toEqual("https://cdn.sanity.io/files/12345/test/test.jpg");
  });

  test("should return order terms as is", async () => {
    sanityClient.returnData = [
      {
        title: "Term 1",
        content: [],
        sortOrder: 0,
      },
      { title: "Term 2", content: [], sortOrder: 10 },
    ];

    const result = await api.getOrderTerms();
    expect(result).toStrictEqual(sanityClient.returnData);
  });

  test("should return faq as is", async () => {
    sanityClient.returnData = [
      { id: "faq-1", question: "Q1", answer: [] },
      { id: "faq-2", question: "Q2", answer: [] },
    ];

    const result = await api.getFaq();
    expect(result).toStrictEqual(sanityClient.returnData);
  });

  test("should filter out irregular opening hours in the past", async () => {
    const title = "Test";
    const irregular = [
      { date: "2022-02-01", time: "10-15" },
      { date: "2022-12-31", time: "10-15" },
      { date: "2023-12-24", closed: true },
      { date: "2023-12-25", time: "10-15" },
    ];
    const days = DEFAULT_WEEKDAYS;

    // Should include today's date
    api.now = new Date("2023-12-24 14:45:26");
    sanityClient.returnData = [
      {
        id: "default",
        title,
        irregular,
        days,
      },
    ];

    const result = await api.getOpeningHours();
    expect(result[0].title).toEqual(title);
    expect(result[0].days).toStrictEqual(DEFAULT_WEEKDAYS);
    expect(result[0].irregular?.length).toBe(2);
    expect(result[0].irregular![0].date).toEqual("2023-12-24");
    expect(result[0].irregular![1].date).toEqual("2023-12-25");
  });

  test("should format format irregular dates correctly", async () => {
    const title = "Test";
    const irregular = [{ date: "2022-02-01", time: "10-15" }];
    const days = DEFAULT_WEEKDAYS;

    api.now = new Date("2021-01-01");
    sanityClient.returnData = [
      {
        id: "default",
        title,
        irregular,
        days,
      },
    ];

    const result = await api.getOpeningHours();
    expect(result[0].irregular![0].date).toEqual("2022-02-01");
    expect(result[0].irregular![0].formattedDate).toEqual(
      "Tisdag 1 februari 2022"
    );
  });
});

const MOCK_PRODUCT = {
  id: "test-product",
  title: "Test Product",
  variants: [{ id: "v1", price: 100, description: "Variant 1" }],
  images: [{ asset: { _ref: "image-ref" }, alt: "Test image" }],
  content: [],
  maxQuantityPerOrder: 5,
  pickupDates: null,
  pickupDateRangeStart: null,
  pickupDateRangeEnd: null,
};

describe("getProducts", () => {
  test("returns parsed products", async () => {
    sanityClient.returnData = [MOCK_PRODUCT];
    const result = await api.getProducts();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "test-product", title: "Test Product" });
  });

  test("returns empty array when no products", async () => {
    sanityClient.returnData = [];
    const result = await api.getProducts();
    expect(result).toEqual([]);
  });
});

describe("getProduct", () => {
  test("returns parsed product when found", async () => {
    sanityClient.returnData = MOCK_PRODUCT;
    const result = await api.getProduct("test-product");
    expect(result).toMatchObject({ id: "test-product", title: "Test Product" });
  });

  test("returns null when product not found", async () => {
    sanityClient.returnData = null;
    const result = await api.getProduct("nonexistent");
    expect(result).toBeNull();
  });
});
