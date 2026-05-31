# SEO-opruimpunten — definitieve pass (Fase 5)

Verzamellijst van losse opruimpunten die we bewust **uitstellen tot de definitieve
SEO-pass**, als alle keep/drop-, redirect- en opschoonbeslissingen vaststaan
(zie afspraak: interne links + discutabele links in één keer verwerken, niet
piecemeal). Draai dan: `pnpm build:web` → `node scripts/scan-broken-links.mjs`
en `node scripts/verify-redirects.mjs`, en werk deze lijst af.

## 1. Lexington-demo-resten verwijderen (staan nog in de sitemap)
- [x] `/services/web-develpment/` — Sanity-doc `service-web-develpment` verwijderd;
      410 GONE in seo-redirects.conf (sitemap-opschoning 2026-05-31).
- [ ] `/legal/privacy/` — starter-juridische demopagina, náást de echte
      `/privacy-statement/`. Droppen of redirecten naar `/privacy-statement/`.
      (NOG OPEN — staat nog in de sitemap.)
- [x] `/blog/tags/freelancing/` — tag zat alleen op demo-post `post-1`; die post is
      verwijderd, dus de tagpagina is weg. Ook `optimalisatie` verwijderd
      (uit `post-overtuigingsprincipes`). Resterende tagpagina's staan op `noindex`.

## 2. Paginatie-pagina's uit de sitemap / noindex
- [x] `/blog/1/`, `/work/1/`, `/team/1/` waren Lexington-demo-docs (`post-1`,
      `workItem-1`, `teamMember-1`, geen paginatie). Uit Sanity verwijderd → weg uit
      de sitemap (sitemap-opschoning 2026-05-31).

## 3. Dubbel diensten-overzicht canoniek maken
- [x] `/onze-diensten/` is canoniek. Theme-default `/services/` (index.astro)
      verwijderd; `/services` 301 → `/onze-diensten` (seo-redirects.conf). De
      `/services/<slug>` detailroutes blijven bestaan. Idem dedup cases-overzicht:
      `/cases-overzichtspagina` verwijderd, 301 → `/work`.

## 4. Interne body-links herschrijven (grote, geconsolideerde taak)
- [ ] Body-content (Portable Text) bevat nog oude WordPress-paden
      (`/customer-journey`, `/gebruikerstesten`, `/contact-2`, …) en links naar
      verwijderde/410-pagina's. In één pass herschrijven via `inventaris.json`
      (oude_url → nieuwe_url / redirect_naar), links naar gedropte content
      weghalen of naar een overzicht sturen. Aanpak: render-time rewrite in
      `PortableText.astro` (laat Sanity-content ongemoeid).
- [ ] Ontbrekende `/manifest.webmanifest` — wordt in `<head>` gelinkt op alle
      pagina's maar bestaat niet in `dist`. Aanmaken of de link verwijderen.

## 5. Host-canonicalisatie (nginx, Ploi)
- [ ] Losse `www → non-www` 301 vóór de redirects in `seo-redirects.conf`
      (canonieke host = `https://diversions.nl`).
