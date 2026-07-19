import { defineType, defineField } from "sanity";

// Shared, reusable SEO object. Added as one optional `seo` field on the
// document types that render public pages (post / service / workItem /
// legalPage). All fields are optional and additive — leaving them empty keeps
// the existing default behaviour.
//
// The rendering side (head <meta>, canonical, sitemap exclusion) is wired up
// later by the seo-astro agent via apps/web/src/components/fundations/head/.
// This object only provides the DATA.
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      description:
        "Overschrijft de standaard meta-description; leeg = gebruik de gewone description/intro.",
    }),
    defineField({
      name: "noindex",
      title: "Noindex",
      type: "boolean",
      initialValue: false,
      description:
        "Sluit deze pagina uit van zoekmachines (voegt noindex toe en haalt 'm uit de sitemap).",
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      description: "Canonical URL; leeg = de eigen pagina-URL.",
    }),
    defineField({
      name: "ogImage",
      title: "OG image",
      type: "image",
      description: "Afbeelding voor delen op social media (OG/Twitter).",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative text",
        },
      ],
    }),
  ],
});
