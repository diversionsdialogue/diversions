/**
 * Convert Portable Text to HTML.
 *
 * post / service / workItem store `body` as a Portable Text array (standard
 * blocks + shared block object-types from CLAUDE.md §4). teamMember / legalPage
 * still store `body` as a plain markdown string. This helper accepts both.
 *
 * NOTE: the shared blocks (CTA, FAQ, video, ...) are rendered by dedicated Astro
 * components in apps/web/src/components/blocks/ (Fase 1, theme-agent). The HTML
 * fallbacks below are minimal placeholders so rendering never crashes before the
 * components exist. In particular the FAQ accessibility (aria-expanded, keyboard)
 * and the FAQPage Schema.org structured data are the Astro component's job.
 */

import { toHTML, type PortableTextComponents } from "@portabletext/to-html";
import { urlFor } from "./image";
import type { SanityBody } from "./types";

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const url = value?.asset ? urlFor(value).url() : "";
      const alt = value?.alt || "";
      return url ? `<img src="${url}" alt="${alt}" loading="lazy" />` : "";
    },
    ctaBlock: ({ value }) =>
      `<div class="block block--cta" data-variant="${value?.variant || "default"}"></div>`,
    faqBlock: ({ value }) =>
      `<div class="block block--faq" data-items="${value?.items?.length ?? 0}"></div>`,
    quoteBlock: ({ value }) =>
      `<blockquote class="block block--quote">${value?.quote || ""}</blockquote>`,
    noticeBlock: ({ value }) =>
      `<div class="block block--notice">${value?.text || ""}</div>`,
    videoBlock: ({ value }) =>
      `<div class="block block--video" data-url="${value?.videoUrl || ""}"></div>`,
    numberedList: () => `<div class="block block--numbered-list"></div>`,
    bulletList: () => `<div class="block block--bullet-list"></div>`,
  },
};

/**
 * Portable Text array (or legacy markdown string) to HTML.
 */
export function portableTextToHtml(body: SanityBody | string): string {
  if (typeof body === "string") {
    // Legacy markdown/text bodies (teamMember, legalPage) — pass through as-is.
    return body;
  }
  if (!Array.isArray(body)) return "";
  return toHTML(body, { components });
}

/**
 * Portable Text array (or string) to plain text.
 */
export function portableTextToPlainText(body: SanityBody | string): string {
  if (typeof body === "string") return body;
  if (!Array.isArray(body)) return "";
  return body
    .filter((block: any) => block._type === "block" && Array.isArray(block.children))
    .map((block: any) => block.children.map((child: any) => child.text).join(""))
    .join("\n\n");
}
