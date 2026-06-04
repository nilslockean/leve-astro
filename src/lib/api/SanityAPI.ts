import type { ISanityClient } from "@lib/types/ISanityClient";
import {
  OrderTermsSchema,
  type OrderTerms,
} from "@lib/schemas/OrderTermsSchema";
import {
  FaqItemSchema,
  FaqSchema,
  type Faq,
  type FaqItem,
} from "@lib/schemas/FAQSchema";
import {
  OpeningHoursSchema,
  type OpeningHours,
} from "@lib/schemas/OpeningHoursSchema";
import { ProductSchema, type Product } from "@lib/schemas/Product";
import { capitalize } from "@lib/stringUtils";
import { getDatesInRange } from "@lib/dateUtils";
import type { OrderSnapshot, SanityOrder } from "@lib/schemas/OrderSnapshot";

export class SanityAPI {
  private client: ISanityClient;
  private assetBaseUrl = "https://cdn.sanity.io/files";
  private projectId = "mz20cm4o";
  private dataset = "production";
  private _now?: Date;
  private PRODUCT_FIELDS = `{
    'id': slug.current,
    maxQuantityPerOrder,
    title,
    content,
    images,
    variants[]{
      "id": id.current,
      price,
      description
    },
    pickupDates,
    pickupDateRangeStart,
    pickupDateRangeEnd,
  }`;

  constructor(client: ISanityClient, projectId?: string, dataset?: string) {
    this.client = client;

    if (projectId) {
      this.projectId = projectId;
    }

    if (dataset) {
      this.dataset = dataset;
    }
  }

  public get now(): Date {
    return this._now ?? new Date();
  }

  public set now(value: Date | undefined) {
    this._now = value;
  }

  private get today(): Date {
    const now = new Date(this.now);
    now.setHours(0, 0, 0, 0);

    return now;
  }

  public getAsset(filename: string): string {
    return `${this.assetBaseUrl}/${this.projectId}/${this.dataset}/${filename}`;
  }

  public async getOrderTerms(): Promise<OrderTerms> {
    const groqJson = await this.client.fetch(
      `*[_type == "orderTerms"]{title, content, sortOrder} | order(sortOrder asc) `,
    );
    const orderTerms = OrderTermsSchema.parse(groqJson);
    return orderTerms;
  }

  public async getFaq(): Promise<Faq> {
    const groqJson = await this.client.fetch(
      `*[_type == "faq"] {"id": _id, question, answer}`,
    );
    return FaqSchema.parse(groqJson);
  }

  public async getFaqItem(id: string): Promise<FaqItem | null> {
    const groqJson = await this.client.fetch(
      `*[_type == "faq" && _id == $id][0] {"id": _id, question, answer}`,
      { id },
    );
    if (!groqJson) return null;
    return FaqItemSchema.parse(groqJson);
  }

  public async query(
    query: string,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    const groqJson = await this.client.fetch(query, params);
    return groqJson;
  }

  public async getProducts(): Promise<Product[]> {
    const json = await this.client.fetch(
      `*[_type == "product"] ` + this.PRODUCT_FIELDS,
    );
    return ProductSchema.array().parse(json);
  }

  public async getProduct(id: string): Promise<Product | null> {
    const json = await this.client.fetch(
      `*[_type == "product" && slug.current == $id][0] ` + this.PRODUCT_FIELDS,
      { id },
    );
    if (!json) return null;
    return ProductSchema.parse(json);
  }

  private readonly OPENING_HOURS_FIELDS = `{"id": setId.current, title, irregular, days}`;

  private processIrregularHours(set: OpeningHours): OpeningHours {
    if (!set.irregular) return set;
    set.irregular = set.irregular
      .filter((irregular) => {
        const irregularDate = new Date(irregular.date);
        irregularDate.setHours(0, 0, 0, 0);
        return irregularDate >= this.today;
      })
      .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1))
      .map((irregular) => {
        if (irregular.formattedDate) return irregular;
        const formatter = new Intl.DateTimeFormat("sv-SE", {
          dateStyle: "full",
        });
        irregular.formattedDate = capitalize(
          formatter.format(new Date(irregular.date)),
        );
        return irregular;
      });
    return set;
  }

  public async getOpeningHours(): Promise<OpeningHours[]> {
    const json = await this.client.fetch(
      `*[_type == "opening-hours"] ${this.OPENING_HOURS_FIELDS}`,
    );
    return OpeningHoursSchema.array()
      .parse(json)
      .map((set) => this.processIrregularHours(set));
  }

  public async getOpeningHoursEntry(
    setId: string,
  ): Promise<OpeningHours | null> {
    const json = await this.client.fetch(
      `*[_type == "opening-hours" && setId.current == $setId][0] ${this.OPENING_HOURS_FIELDS}`,
      { setId },
    );
    if (!json) return null;
    return this.processIrregularHours(OpeningHoursSchema.parse(json));
  }

  public async getOpenDaysInRange(start: string, end: string) {
    const datesInRange = getDatesInRange(start, end);
    const openingHours = await this.getOpeningHoursEntry("default");
    if (!openingHours) return [];
    const closedWeekdays = Object.values(openingHours.days)
      .filter(({ closed }) => closed)
      .map(({ day }) => day);
    const closedHolidays = (openingHours.irregular || [])
      .filter(({ closed }) => closed)
      .map(({ date }) => date);

    return datesInRange.filter((dateStr) => {
      // Filter out closed irregular opening hours first
      if (closedHolidays.includes(dateStr)) {
        return false;
      }

      // Check if the weekday index of current date is in list of closed weekdays
      const date = new Date(dateStr);
      const weekday = date.getDay();
      return !closedWeekdays.includes(weekday);
    });
  }

  private generateOrderNumber(baseDate = new Date()): string {
    const y = baseDate.getFullYear().toString().slice(-2);
    const m = String(baseDate.getMonth() + 1).padStart(2, "0");
    const d = String(baseDate.getDate()).padStart(2, "0");

    // 4 random digits
    const rand = Math.floor(1000 + Math.random() * 9000);

    return `${y}${m}${d}-${rand}`;
  }

  public createOrder = async (
    orderSnapshot: OrderSnapshot,
    idempotencyKey?: string,
  ): Promise<{ order: SanityOrder; wasDuplicate: boolean }> => {
    const { customer, pickupDate, items, totals } = orderSnapshot;

    if (!this.client.create) {
      throw new Error("Create method not available in Sanity client instance");
    }

    const documentId = idempotencyKey ? `order-${idempotencyKey}` : undefined;

    try {
      const order = await this.client.create({
        _type: "order",
        _id: documentId,
        idempotencyKey,
        orderNumber: this.generateOrderNumber(),
        customer,
        pickupDate,
        totals,
        items: items.map((item) => ({
          _key: crypto.randomUUID(),
          ...item,
        })),
      });

      return { order: order as SanityOrder, wasDuplicate: false };
    } catch (error: unknown) {
      if (
        idempotencyKey &&
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        error.statusCode === 409
      ) {
        const order = await this.getOrderByIdempotencyKey(idempotencyKey);
        return { order, wasDuplicate: true };
      }
      throw error;
    }
  };

  public getOrderByIdempotencyKey = async (
    idempotencyKey: string,
  ): Promise<SanityOrder> => {
    const result = await this.client.fetch<SanityOrder>(
      `*[_type == "order" && idempotencyKey == $idempotencyKey][0]{
        _id,
        _createdAt,
        orderNumber,
        customer,
        pickupDate,
        totals,
        idempotencyKey,
        "items": items[]{
          productTitle,
          variantId,
          variantDescription,
          unitPrice,
          quantity,
          lineTotal
        }
      }`,
      { idempotencyKey },
    );

    if (!result) {
      throw new Error(`Order not found for idempotency key: ${idempotencyKey}`);
    }

    return result;
  };

  /**
   * Fetch all orders.
   */
  public getOrders = async (): Promise<OrderSnapshot[]> => {
    const orders = await this.client.fetch<OrderSnapshot[]>(
      `*[_type == "order"]{
        orderNumber,
        customer,
        pickupDate,
        totals,
        items
      }`,
    );

    return orders;
  };

  /**
   * Fetch order by order number for the thank-you page. Returns null if not found.
   */
  public getOrderByOrderNumber = async (
    orderNumber: string,
  ): Promise<{
    orderNumber: string;
    customer: OrderSnapshot["customer"];
    pickupDate: string;
    items: OrderSnapshot["items"];
    totals: OrderSnapshot["totals"];
  } | null> => {
    const result = await this.client.fetch<{
      orderNumber: string;
      customer: OrderSnapshot["customer"];
      pickupDate: string;
      items: OrderSnapshot["items"];
      totals: OrderSnapshot["totals"];
    } | null>(
      `*[_type == "order" && orderNumber == $orderNumber][0]{
        orderNumber,
        customer,
        pickupDate,
        "items": items[]{
          productTitle,
          variantId,
          variantDescription,
          unitPrice,
          quantity,
          lineTotal
        },
        totals
      }`,
      { orderNumber },
    );
    return result ?? null;
  };
}
