import { createClient } from "@sanity/client";

// Sanity client configuration.
// Falls back to a placeholder projectId so the client can be constructed even
// when no Sanity env is set. The site defaults to Content Collections
// (USE_SANITY=false) and must run without Sanity env; fetchSanity is only
// reached when USE_SANITY=true, at which point a real projectId is required.
export const client = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || "placeholder",
  dataset: import.meta.env.SANITY_DATASET || "production",
  apiVersion: import.meta.env.SANITY_API_VERSION || "2024-01-01",
  // Geen CDN: de site is statisch, alle fetches gebeuren tijdens de build.
  // De API-CDN cachet queryresultaten waardoor een build vlak na een
  // contentwijziging deels verouderde data kan krijgen (inconsistente pagina's).
  useCdn: false,
  perspective: "published", // Only fetch published documents
});

// Helper to check if Sanity is properly configured
export function isSanityConfigured(): boolean {
  return !!(
    import.meta.env.SANITY_PROJECT_ID &&
    import.meta.env.SANITY_DATASET
  );
}
