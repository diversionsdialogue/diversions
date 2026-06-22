// Named export: de default export is deprecated (waarschuwing in elke build).
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "./client";

// Initialize image URL builder
const builder = createImageUrlBuilder(client);

/**
 * Generate optimized image URL from Sanity image asset
 * @param source - Sanity image asset reference
 * @returns Image URL builder instance
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Get optimized image URL with specific dimensions
 * @param source - Sanity image asset reference
 * @param width - Desired width
 * @param height - Optional height (maintains aspect ratio if omitted)
 * @returns Optimized image URL
 */
export function getImageUrl(
  source: SanityImageSource,
  width: number,
  height?: number
): string {
  const url = urlFor(source).auto("format").quality(75).width(width);
  if (height) {
    return url.height(height).url();
  }
  return url.url();
}

/**
 * Get image metadata including URL and alt text
 * @param image - Sanity image object with asset and alt
 * @returns Object with url and alt text
 */
export function getImageMeta(image: any): { url: string; alt: string } {
  return {
    url: urlFor(image).auto("format").quality(75).width(1600).fit("max").url(),
    alt: image.alt || "",
  };
}
