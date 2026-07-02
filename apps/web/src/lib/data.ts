/**
 * Data Layer Toggle
 * Toggle this to switch between Sanity CMS and Astro Content Collections
 * - true: Use Sanity CMS as the data source
 * - false: Use Astro Content Collections (markdown files)
 */
export const USE_SANITY = true; // Sanity CMS als bron (volledige integratie)

/**
 * Unified data fetching functions
 * These functions work with both Content Collections and Sanity
 * The implementation is selected based on USE_SANITY flag
 */

import { getCollection } from "astro:content";
import {
  fetchSanity,
  getAllTeamMembersQuery,
  getAllWorkItemsQuery,
  getAllServicesQuery,
  getAllPostsQuery,
  getAllLegalPagesQuery,
  getAllPagesQuery,
  getPostsByTagQuery,
  getAllTagsQuery,
  transformTeamMember,
  transformWorkItem,
  transformService,
  transformPost,
  transformLegalPage,
  transformPage,
  type SanityTeamMember,
  type SanityWorkItem,
  type SanityService,
  type SanityPost,
  type SanityLegalPage,
  type SanityPage,
} from "./sanity";

/**
 * Get all team members
 */
export async function getAllTeamMembers() {
  if (USE_SANITY) {
    const sanityData = await fetchSanity<SanityTeamMember[]>(getAllTeamMembersQuery);
    return sanityData.map(transformTeamMember);
  }
  return await getCollection("team");
}

/**
 * Get all work items
 */
export async function getAllWorkItems() {
  if (USE_SANITY) {
    const sanityData = await fetchSanity<SanityWorkItem[]>(getAllWorkItemsQuery);
    return sanityData.map(transformWorkItem);
  }
  return await getCollection("work");
}

/**
 * Get all services
 */
export async function getAllServices() {
  if (USE_SANITY) {
    const sanityData = await fetchSanity<SanityService[]>(getAllServicesQuery);
    return sanityData.map(transformService);
  }
  return await getCollection("services");
}

/**
 * Get all posts
 */
export async function getAllPosts() {
  if (USE_SANITY) {
    const sanityData = await fetchSanity<SanityPost[]>(getAllPostsQuery);
    return sanityData.map(transformPost);
  }
  return await getCollection("posts");
}

/**
 * Get all legal pages
 */
export async function getAllLegalPages() {
  if (USE_SANITY) {
    const sanityData = await fetchSanity<SanityLegalPage[]>(getAllLegalPagesQuery);
    return sanityData.map(transformLegalPage);
  }
  return await getCollection("legal");
}

/**
 * Losse, beheerbare pagina's (type `page`). Sanity-only: er is geen
 * content-collectie voor dit type (USE_SANITY staat op true). Bij content-
 * collectie-modus valt dit terug op een lege lijst.
 */
export async function getAllPages() {
  if (USE_SANITY) {
    const sanityData = await fetchSanity<SanityPage[]>(getAllPagesQuery);
    return sanityData.map(transformPage);
  }
  return [];
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tag: string) {
  if (USE_SANITY) {
    const sanityData = await fetchSanity<SanityPost[]>(getPostsByTagQuery, { tag });
    return sanityData.map(transformPost);
  }
  const allPosts = await getCollection("posts");
  return allPosts.filter((post) => post.data.tags.includes(tag));
}

/**
 * Get all unique tags from posts
 */
export async function getAllTags() {
  if (USE_SANITY) {
    return await fetchSanity<string[]>(getAllTagsQuery);
  }
  const allPosts = await getCollection("posts");
  const tags = new Set<string>();
  allPosts.forEach((post) => {
    post.data.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags);
}
