import { getLiveCollection, getLiveEntry } from "astro:content";
import type { Product } from "./schemas/Product";

export type ProductEntry = { id: string; data: Product };

type CollectionFetcher = () => Promise<ProductEntry[]>;
type EntryFetcher = (id: string) => Promise<ProductEntry | undefined>;

async function defaultFetchCollection(): Promise<ProductEntry[]> {
  const { entries } = await getLiveCollection("products");
  return entries as ProductEntry[];
}

async function defaultFetchEntry(id: string): Promise<ProductEntry | undefined> {
  const result = await getLiveEntry("products", id);
  return result?.entry as ProductEntry | undefined;
}

export async function getProducts(
  fetchCollection: CollectionFetcher = defaultFetchCollection,
): Promise<ProductEntry[]> {
  return fetchCollection();
}

export async function getProduct(
  id: string,
  fetchEntry: EntryFetcher = defaultFetchEntry,
): Promise<ProductEntry | undefined> {
  return fetchEntry(id);
}
