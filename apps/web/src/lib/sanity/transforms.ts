/**
 * Transform Sanity data to Content Collections shape
 * CRITICAL: This preserves the exact data shape expected by components
 * No fields are added, removed, or renamed
 */

import { urlFor } from "./image";
import type {
  SanityTeamMember,
  SanityWorkItem,
  SanityService,
  SanityPost,
  SanityLegalPage,
  SanityPage,
  SanitySeo,
} from "./types";

/**
 * De migratie schrijft `_id` als `${type}-${slug}` maar zet (nog) geen los
 * slug-veld. Daardoor is `slug.current` leeg. We leiden de schone slug af door
 * het type-prefix van het `_id` te strippen, zodat de Sanity-URL's identiek
 * blijven aan de markdown-/Content-Collection-URL's (URL-pariteit).
 */
function deriveSlug(id: string, prefix: string, explicit?: string): string {
  if (explicit) return explicit;
  return id.startsWith(`${prefix}-`) ? id.slice(prefix.length + 1) : id;
}

/**
 * Veilige image-URL: sommige documenten hebben (nog) geen geüpload asset
 * (bv. lokale placeholder-paden of externe avatar-URL's die de migratie niet
 * kon uploaden). urlFor() gooit dan een fout, wat de build breekt. Geef in dat
 * geval een lege string terug; de quality-fase vult echte beelden in.
 */
function safeImageUrl(source: any): string {
  if (!source || !source.asset) return "";
  try {
    // auto("format") laat de Sanity-CDN per bezoeker AVIF/WebP serveren; max-
    // breedte + quality als plafond. Geldt automatisch voor elke (toekomstige)
    // upload — geen werk per beeld.
    return urlFor(source).auto("format").quality(75).width(1600).fit("max").url();
  } catch {
    return "";
  }
}

/**
 * Optioneel `seo`-object naar de Content-Collection-achtige vorm. Volledig
 * additief: ontbreekt `seo`, dan geven we `undefined` terug en verandert er
 * niets aan het bestaande gedrag. De ogImage wordt — net als image/thumbnail —
 * tot een vlakke `{ url, alt }` gereduceerd via safeImageUrl(). De daadwerkelijke
 * <head>/sitemap-koppeling doet de seo-astro-fase.
 */
function transformSeo(seo?: SanitySeo) {
  if (!seo) return undefined;
  return {
    metaDescription: seo.metaDescription,
    noindex: seo.noindex ?? false,
    canonicalUrl: seo.canonicalUrl,
    ogImage: seo.ogImage
      ? {
          url: safeImageUrl(seo.ogImage),
          alt: seo.ogImage.alt || "",
        }
      : undefined,
  };
}

/**
 * Transform Sanity Team Member to Content Collection shape
 */
export function transformTeamMember(sanityDoc: SanityTeamMember) {
  return {
    id: sanityDoc._id,
    slug: deriveSlug(sanityDoc._id, "teamMember", sanityDoc.slug),
    body: sanityDoc.body,
    collection: "team" as const,
    data: {
      name: sanityDoc.name,
      role: sanityDoc.role,
      intro: sanityDoc.intro,
      education: sanityDoc.education,
      experience: sanityDoc.experience,
      avatar: {
        url: safeImageUrl(sanityDoc.avatar),
        alt: sanityDoc.avatar?.alt || "",
      },
    },
  };
}

/**
 * Transform Sanity Work Item to Content Collection shape
 */
export function transformWorkItem(sanityDoc: SanityWorkItem) {
  return {
    id: sanityDoc._id,
    slug: deriveSlug(sanityDoc._id, "workItem", sanityDoc.slug),
    // Portable Text array; rendered by the Portable Text renderer, not raw markdown.
    body: sanityDoc.body || [],
    collection: "work" as const,
    data: {
      link: sanityDoc.link,
      company: sanityDoc.company,
      year: sanityDoc.year,
      client: sanityDoc.client,
      work: sanityDoc.work,
      bijschrift: sanityDoc.bijschrift,
      statement: sanityDoc.statement,
      credits: sanityDoc.credits,
      thumbnail: {
        url: safeImageUrl(sanityDoc.thumbnail),
        alt: sanityDoc.thumbnail?.alt || "",
      },
      seo: transformSeo(sanityDoc.seo),
    },
  };
}

/**
 * Transform Sanity Service to Content Collection shape
 */
export function transformService(sanityDoc: SanityService) {
  return {
    id: sanityDoc._id,
    slug: deriveSlug(sanityDoc._id, "service", sanityDoc.slug),
    // Portable Text array; rendered by the Portable Text renderer, not raw markdown.
    body: sanityDoc.body || [],
    collection: "services" as const,
    data: {
      service: sanityDoc.service,
      description: sanityDoc.description,
      overviewTitle: sanityDoc.overviewTitle ?? undefined,
      overviewIntro: sanityDoc.overviewIntro ?? undefined,
      thumbnail: sanityDoc.thumbnail
        ? {
            url: safeImageUrl(sanityDoc.thumbnail),
            alt: sanityDoc.thumbnail.alt || "",
          }
        : undefined,
      categories: sanityDoc.categories ?? [],
      seo: transformSeo(sanityDoc.seo),
    },
  };
}

/**
 * Transform Sanity Post to Content Collection shape
 */
export function transformPost(sanityDoc: SanityPost) {
  return {
    id: sanityDoc._id,
    slug: deriveSlug(sanityDoc._id, "post", sanityDoc.slug),
    // Portable Text array; rendered by the Portable Text renderer, not raw markdown.
    body: sanityDoc.body || [],
    collection: "posts" as const,
    data: {
      title: sanityDoc.title,
      pubDate: new Date(sanityDoc.pubDate),
      description: sanityDoc.description,
      author: sanityDoc.author,
      image: {
        url: safeImageUrl(sanityDoc.image),
        alt: sanityDoc.image?.alt || "",
      },
      tags: sanityDoc.tags,
      seo: transformSeo(sanityDoc.seo),
    },
  };
}

/**
 * Transform Sanity Legal Page to Content Collection shape
 */
export function transformLegalPage(sanityDoc: SanityLegalPage) {
  return {
    id: sanityDoc._id,
    slug: deriveSlug(sanityDoc._id, "legalPage"),
    // Portable Text array; rendered by the Portable Text renderer, not raw markdown.
    body: sanityDoc.body || [],
    collection: "legal" as const,
    data: {
      page: sanityDoc.page,
      pubDate: new Date(sanityDoc.pubDate),
      seo: transformSeo(sanityDoc.seo),
    },
  };
}

export function transformPage(sanityDoc: SanityPage) {
  return {
    id: sanityDoc._id,
    slug: sanityDoc.slug ?? deriveSlug(sanityDoc._id, "page"),
    // Portable Text array; gerenderd via <PortableText>.
    body: sanityDoc.body || [],
    collection: "pages" as const,
    data: {
      title: sanityDoc.title,
      eyebrow: sanityDoc.eyebrow,
      seo: transformSeo(sanityDoc.seo),
    },
  };
}
