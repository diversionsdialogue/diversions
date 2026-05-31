import { client } from "./client";

/**
 * Fetch wrapper with error handling for Sanity queries
 */
export async function fetchSanity<T>(query: string, params: Record<string, any> = {}): Promise<T> {
  try {
    const result = await client.fetch<T>(query, params);
    return result;
  } catch (error) {
    console.error("Sanity fetch error:", error);
    throw new Error(`Failed to fetch data from Sanity: ${error}`);
  }
}

/**
 * Fetch with optional fallback
 */
export async function fetchSanityWithFallback<T>(
  query: string,
  params: Record<string, any> = {},
  fallback: T
): Promise<T> {
  try {
    return await fetchSanity<T>(query, params);
  } catch (error) {
    console.warn("Using fallback data due to fetch error:", error);
    return fallback;
  }
}
