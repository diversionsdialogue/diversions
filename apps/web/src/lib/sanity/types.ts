/**
 * TypeScript types for Sanity documents
 * Generated from PROJECT_CONTENT_MODEL
 */

// Base Sanity document type
export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

// Sanity image asset
export interface SanityImageAsset {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
}

// --- Shared reusable objects ------------------------------------------------
// Optional `seo` object on the public-page document types (post / service /
// workItem / legalPage). All fields optional/additive. Rendering (head meta,
// canonical, sitemap exclusion) is handled later by the seo-astro agent; this
// type only describes the DATA shape returned by the `seo` query projection.
export interface SanitySeo {
  metaDescription?: string;
  noindex?: boolean;
  canonicalUrl?: string;
  ogImage?: SanityImageAsset;
}

// --- Portable Text + shared blocks (CLAUDE.md §4) ---------------------------
// `body` on post / service / workItem is a Portable Text array: standard blocks
// plus the shared custom block object-types. Each member carries a `_type`.

export interface SanityPortableTextSpan {
  _type: "span";
  _key: string;
  text: string;
  marks?: string[];
}

export interface SanityPortableTextBlock {
  _type: "block";
  _key: string;
  style?: string;
  listItem?: string;
  level?: number;
  children: SanityPortableTextSpan[];
  markDefs?: Array<{ _type: string; _key: string; [key: string]: unknown }>;
}

export interface SanityCtaBlock {
  _type: "ctaBlock";
  _key: string;
  heading: string;
  text?: string;
  buttonLabel: string;
  buttonHref: string;
  variant?: "default" | "sage";
  image?: SanityImageAsset;
}

export interface SanityFaqBlock {
  _type: "faqBlock";
  _key: string;
  items: Array<{ question: string; answer: string }>;
}

export interface SanityQuoteBlock {
  _type: "quoteBlock";
  _key: string;
  quote: string;
  author?: string;
  role?: string;
}

export interface SanityNoticeBlock {
  _type: "noticeBlock";
  _key: string;
  label: string;
  text: string;
}

export interface SanityVideoBlock {
  _type: "videoBlock";
  _key: string;
  videoUrl: string;
  poster?: SanityImageAsset;
  label?: string;
}

export interface SanityNumberedList {
  _type: "numberedList";
  _key: string;
  title?: string;
  items: Array<{ number?: string; label: string; text?: string }>;
}

export interface SanityBulletList {
  _type: "bulletList";
  _key: string;
  title?: string;
  items: string[];
  columns?: 1 | 2;
}

export interface SanityInlineImage extends SanityImageAsset {
  _key: string;
}

// Any member of a `body` Portable Text array.
export type SanityBodyBlock =
  | SanityPortableTextBlock
  | SanityInlineImage
  | SanityCtaBlock
  | SanityFaqBlock
  | SanityQuoteBlock
  | SanityNoticeBlock
  | SanityVideoBlock
  | SanityNumberedList
  | SanityBulletList;

export type SanityBody = SanityBodyBlock[];

// ---------------------------------------------------------------------------

// Team Member document
export interface SanityTeamMember extends SanityDocument {
  _type: "teamMember";
  name: string;
  slug?: string;
  role: string;
  intro: string;
  education: string[];
  experience: string[];
  avatar: SanityImageAsset;
  body: string;
}

// Work Item document
export interface SanityWorkItem extends SanityDocument {
  _type: "workItem";
  slug: string;
  link?: string;
  company?: string;
  year?: string;
  client?: string;
  work: string;
  bijschrift?: string;
  statement?: string;
  credits?: Array<{
    name: string;
    role: string;
  }>;
  thumbnail: SanityImageAsset;
  body?: SanityBody;
  seo?: SanitySeo;
}

// Service document
export interface SanityService extends SanityDocument {
  _type: "service";
  service: string;
  slug: string;
  description: string;
  // Korte titel + inleiding voor het diensten-overzicht (optioneel/additief).
  overviewTitle?: string;
  overviewIntro?: string;
  thumbnail?: SanityImageAsset;
  categories?: string[];
  body: SanityBody;
  seo?: SanitySeo;
}

// Post document
export interface SanityPost extends SanityDocument {
  _type: "post";
  title: string;
  slug: string;
  pubDate: string;
  description: string;
  author: string;
  image: SanityImageAsset;
  tags: string[];
  body: SanityBody;
  seo?: SanitySeo;
}

// Legal Page document
export interface SanityLegalPage extends SanityDocument {
  _type: "legalPage";
  page: string;
  pubDate: string;
  body: SanityBody;
  seo?: SanitySeo;
}

// Page document (losse, beheerbare pagina zoals "Wij zijn Diversions")
export interface SanityPage extends SanityDocument {
  _type: "page";
  title: string;
  slug: string;
  eyebrow?: string;
  image?: SanityImageAsset;
  body: SanityBody;
  seo?: SanitySeo;
}

// Union type of all document types
export type SanityDocumentType =
  | SanityTeamMember
  | SanityWorkItem
  | SanityService
  | SanityPost
  | SanityLegalPage
  | SanityPage;
