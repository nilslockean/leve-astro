import { SanityAPI } from "./api/SanityAPI";
import { sanityClient } from "sanity:client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

// Export a new instance of the SanityAPI class with the sanityClient as a parameter.
// Won't work in test environment.
//
export const sanityAPI = new SanityAPI(sanityClient);

// sanityImageUrl.ts

// Create an image URL builder using the client
const builder = createImageUrlBuilder(sanityClient);

// Export a function that can be used to get image URLs
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
