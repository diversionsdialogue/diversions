import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { createClient } from "@sanity/client";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import dotenv from "dotenv";

// --- Sanity-gestuurde noindex-uitsluiting voor de sitemap --------------------
// Detailpagina's (post / service / workItem / legalPage) kunnen via het optionele
// Sanity-`seo`-object op `noindex: true` staan. Zo'n pagina krijgt in de <head>
// een `noindex`-robots-tag (zie Seo.astro) EN moet uit de sitemap blijven.
//
// De sitemap-`filter` werkt op URL-patronen. We leiden daarom vóór de build één
// keer een set noindex-URL-paden af uit dezelfde Sanity-data die de pagina's
// gebruiken (USE_SANITY=true). Dit gebeurt in Node-context, dus we lezen de env
// via dotenv (leest apps/web/.env in process.env) i.p.v. import.meta.env.
//
// Robuust/mode-onafhankelijk: lukt de fetch niet (geen Sanity-env, of
// Content-Collections-modus), dan blijft de set leeg en vallen we terug op
// alleen de hardgecodeerde URL-patronen hieronder — de build breekt nooit op SEO.
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });
const env = process.env;

// Slug → URL-pad per documenttype. Houd dit in lijn met de routes in
// src/pages/** (AGENTS.md Routing). Trailing slash weglaten: de sitemap-URL's
// en de filter-`page`-string gebruiken beide het pad zonder trailing slash.
const NOINDEX_ROUTE_PREFIX = {
  post: "/blog/",
  service: "/services/",
  workItem: "/work/",
  legalPage: "/", // legal-pagina's staan op hun root-URL (pages/[...slug].astro)
};

async function collectNoindexPaths() {
  const projectId = env.SANITY_PROJECT_ID;
  const dataset = env.SANITY_DATASET;
  if (!projectId || !dataset) {
    // Geen Sanity-env (bv. Content-Collections-only build): niets uit te sluiten
    // op documentniveau. De URL-patroonfilter hieronder blijft werken.
    return new Set();
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: env.SANITY_API_VERSION || "2024-01-01",
    useCdn: true,
    perspective: "published",
  });

  // Eén query voor alle vier de publieke types. We leiden de slug af zoals
  // transforms.ts dat doet: expliciete slug, anders het _id zonder type-prefix.
  const query = `
    *[_type in ["post","service","workItem","legalPage"] && seo.noindex == true]{
      _type,
      _id,
      "slug": slug.current
    }
  `;

  try {
    const docs = await client.fetch(query);
    const paths = new Set();
    for (const doc of docs ?? []) {
      const prefixMap = { post: "post", service: "service", workItem: "workItem", legalPage: "legalPage" };
      const typePrefix = prefixMap[doc._type];
      let slug = doc.slug;
      if (!slug && typeof doc._id === "string") {
        slug = doc._id.startsWith(`${typePrefix}-`)
          ? doc._id.slice(typePrefix.length + 1)
          : doc._id;
      }
      if (!slug) continue;
      const routePrefix = NOINDEX_ROUTE_PREFIX[doc._type];
      if (!routePrefix) continue;
      // Pad zonder trailing slash, lowercase voor robuuste vergelijking.
      paths.add(`${routePrefix}${slug}`.replace(/\/+$/, "").toLowerCase());
    }
    return paths;
  } catch (error) {
    // Fetch mislukt → log en val terug op alleen de patroonfilter. Nooit de build breken.
    console.warn(
      "[sitemap] Kon noindex-pagina's niet uit Sanity ophalen; alleen patroonfilter actief:",
      error?.message ?? error,
    );
    return new Set();
  }
}

const noindexPaths = await collectNoindexPaths();

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    drafts: true,
    shikiConfig: {
      theme: "css-variables",
    },
  },
  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true,
  },
  site: "https://diversions.nl",
  integrations: [
    sitemap({
      // noindex-pagina's uit de sitemap houden:
      // - /system/* : UI-referentiepagina's
      // - /pricing-* : achtergebleven theme-demopagina's (geen Diversions-content)
      // - /blog/tags/* : tagindex + tagpagina's staan op noindex (opschoning 2026-05-31)
      // - /kennismaking-bedankt, /videocall-plannen : funnel/bevestiging, noindex
      // - `noindexPaths` : detailpagina's met seo.noindex==true in Sanity (zie boven)
      filter: (page) => {
        if (
          page.includes("/system/") ||
          page.includes("/pricing-") ||
          page.includes("/blog/tags") ||
          page.includes("/kennismaking-bedankt") ||
          page.includes("/videocall-plannen")
        ) {
          return false;
        }
        // `page` is een absolute URL incl. trailing slash. Normaliseer naar pad
        // zonder trailing slash + lowercase, gelijk aan collectNoindexPaths().
        try {
          const path = new URL(page).pathname.replace(/\/+$/, "").toLowerCase();
          if (noindexPaths.has(path)) return false;
        } catch {
          /* ongeldige URL → laat staan */
        }
        return true;
      },
    }),
  ],
});
