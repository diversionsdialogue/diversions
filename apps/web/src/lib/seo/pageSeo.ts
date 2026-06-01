/**
 * pageSeo — bouwt de gemergede `seo`-prop voor de layouts/Seo.astro uit:
 *  1) het optionele document-`seo`-object (Sanity / Content-Collection frontmatter), en
 *  2) de bestaande paginafallbacks (titel, description, featured image, type, ...).
 *
 * Volledig additief: ontbreekt `seo` op het document, dan komt exact het oude
 * gedrag terug (fallback-velden). De daadwerkelijke <head>-tags (robots, canonical,
 * og:image) worden door Seo.astro/AstroSeo gerenderd.
 */

/** Vorm van het document-`seo`-object zoals transforms.ts / de Zod-schema het levert. */
export interface DocumentSeo {
  metaDescription?: string;
  noindex?: boolean;
  canonicalUrl?: string;
  ogImage?: { url: string; alt?: string };
}

export interface PageSeoFallbacks {
  /** Pagina-titel (zonder site-suffix; die voegt Seo.astro toe). */
  title?: string;
  /** Beschrijving uit de content (description/intro). */
  description?: string;
  /** Featured image / thumbnail van de pagina, indien aanwezig. */
  image?: { url: string; alt?: string };
  type?: "website" | "article";
  publishedTime?: string;
  /**
   * Eventueel hardgecodeerde noindex op de pagina zelf (bv. funnel-/systeem-
   * pagina's). Wordt ge-OR'd met document-`seo.noindex` — nooit overschreven.
   */
  noindex?: boolean;
}

export interface ResolvedPageSeo {
  title?: string;
  description?: string;
  image?: { url: string; alt?: string };
  type?: "website" | "article";
  publishedTime?: string;
  noindex: boolean;
  canonical?: string;
}

/**
 * Combineer document-`seo` met de paginafallbacks.
 * - description : seo.metaDescription → fallback.description → (site-default in Seo.astro)
 * - noindex     : seo.noindex === true  OF  fallback.noindex === true (OR, niet overschrijven)
 * - canonical   : seo.canonicalUrl → (anders bepaalt Seo.astro de eigen pagina-URL)
 * - og:image    : seo.ogImage (met url) → fallback.image → (site-default in Seo.astro)
 */
export function buildPageSeo(
  seo: DocumentSeo | undefined,
  fallbacks: PageSeoFallbacks,
): ResolvedPageSeo {
  const ogImage =
    seo?.ogImage && seo.ogImage.url ? seo.ogImage : fallbacks.image;

  return {
    title: fallbacks.title,
    description: seo?.metaDescription || fallbacks.description,
    image: ogImage,
    type: fallbacks.type,
    publishedTime: fallbacks.publishedTime,
    noindex: seo?.noindex === true || fallbacks.noindex === true,
    canonical: seo?.canonicalUrl || undefined,
  };
}
