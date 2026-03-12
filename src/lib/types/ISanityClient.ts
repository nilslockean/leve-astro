import type { SanityDocumentStub } from "@sanity/client";
import type { SanityDocument } from "@sanity/client/csm";

export interface ISanityClient {
  fetch: <T extends unknown>(
    query: string,
    params?: Record<string, unknown>,
  ) => Promise<T>;
  create?: <R extends Record<string, any> = Record<string, any>>(
    document: SanityDocumentStub<R>,
  ) => Promise<SanityDocument<R>>;
}
