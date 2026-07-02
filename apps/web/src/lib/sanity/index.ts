/**
 * Sanity CMS Integration
 * Barrel export for all Sanity-related functionality
 */

export { client, isSanityConfigured } from "./client";
export { urlFor, getImageUrl, getImageMeta } from "./image";
export { fetchSanity, fetchSanityWithFallback } from "./fetch";
export { portableTextToHtml, portableTextToPlainText } from "./portableText";

// Export all queries
export * from "./queries";

// Export all transforms
export {
  transformTeamMember,
  transformWorkItem,
  transformService,
  transformPost,
  transformLegalPage,
  transformPage,
} from "./transforms";

// Export types
export type * from "./types";
