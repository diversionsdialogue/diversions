import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Shared, optional `seo` Zod object for the public-page collections
// (work / services / posts / legal). Fully optional and additive so existing
// markdown (which has no `seo` frontmatter) keeps validating. Mirrors the
// Sanity `seo` object-type + transforms output for parity (CLAUDE.md §2).
// `ogImage.url` is a plain string (URL or path), not Astro `image()`, because
// no current entry sets it and the value can be a remote/Sanity CDN URL.
// Rendering (head meta, canonical, sitemap) is wired up later by seo-astro.
const seoSchema = z
  .object({
    metaDescription: z.string().optional(),
    noindex: z.boolean().optional(),
    canonicalUrl: z.string().optional(),
    ogImage: z
      .object({
        url: z.string(),
        alt: z.string().optional(),
      })
      .optional(),
  })
  .optional();

const team = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/team" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      intro: z.string(),
      education: z.array(z.string()),
      experience: z.array(z.string()),
      avatar: z.object({
        url: image(),
        alt: z.string(),
      }),
    }),
});

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: ({ image }) =>
    z.object({
      link: z.string().optional(),
      company: z.string().optional(),
      year: z.string().optional(),
      client: z.string().optional(),
      work: z.string(),
      bijschrift: z.string().optional(),
      statement: z.string().optional(),
      credits: z
        .array(
          z.object({
            name: z.string(),
            role: z.string(),
          })
        )
        .optional(),
      thumbnail: z.object({
        url: image(),
        alt: z.string(),
      }),
      seo: seoSchema,
    }),
});

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: z.object({
    service: z.string(),
    description: z.string(),
    // Optioneel: korte titel + inleiding voor het diensten-overzicht.
    // Additief — bestaande .md zonder deze velden blijven valideren.
    overviewTitle: z.string().optional(),
    overviewIntro: z.string().optional(),
    // Optioneel: miniatuur + filtercategorieën voor het diensten-overzicht.
    // Additief — bestaande .md zonder deze velden blijven valideren. `url` is
    // een plain string (kan een remote/Sanity CDN-URL zijn), net als
    // seoSchema.ogImage.url; geen Astro image() omdat geen .md het nu zet.
    thumbnail: z
      .object({
        url: z.string(),
        alt: z.string().optional(),
      })
      .optional(),
    categories: z.array(z.string()).optional(),
    seo: seoSchema,
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      pubDate: z.coerce.date(),
      description: z.string(),
      author: z.string(),
      image: z.object({
        url: image(),
        alt: z.string(),
      }),
      tags: z.array(z.string()),
      seo: seoSchema,
    }),
});

const legal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/legal" }),
  schema: z.object({
    page: z.string(),
    pubDate: z.coerce.date(),
    seo: seoSchema,
  }),
});

export const collections = {
  team,
  work,
  services,
  legal,
  posts,
};
