import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

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
      filter: (page) =>
        !page.includes("/system/") &&
        !page.includes("/pricing-") &&
        !page.includes("/blog/tags") &&
        !page.includes("/kennismaking-bedankt") &&
        !page.includes("/videocall-plannen"),
    }),
  ],
});
