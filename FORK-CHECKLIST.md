# Fork-checklist — Diversions-repo → tweede project

Doel: de afgeronde Diversions-site hergebruiken als basis voor een vrijwel
identiek tweede project. **Zelfde vormgeving**, alleen ander logo en een **eigen
Sanity-project** (eigen content). Deze checklist somt exact de plekken op die
*repo-gebonden* (Diversions-specifiek) zijn en dus per fork moeten wijzigen.

> Voer dit pas uit **nadat Diversions volledig af is** (t/m prelaunch), zodat de
> fork ook de formulieren-, SEO- en quality-fase meeneemt en je dat werk niet
> dubbel doet.

---

## Wat NIET hoeft (wisselt automatisch mee)

Alle content uit Sanity — `work`, `posts`, `services`, `team`, `legal` — komt
uit het gekoppelde Sanity-project. Koppel je een ander project, dan is de content
vanzelf anders. Hier hoef je dus **niets in de repo** aan te passen.
(`USE_SANITY = true` in `apps/web/src/lib/data.ts` blijft staan.)

---

## A. Sanity-binding (verplicht)

- [ ] **Nieuw Sanity-project** aanmaken (eigen dataset + token).
- [ ] **`apps/web/.env`** — `SANITY_PROJECT_ID`, `SANITY_DATASET`,
      `SANITY_API_VERSION`, `SANITY_TOKEN` naar het nieuwe project zetten.
      *(Token is gevoelig — nooit committen.)*
- [ ] **`apps/studio/.env`** — `SANITY_STUDIO_PROJECT_ID` (+ dataset) idem.
- [ ] Schema's (`apps/studio/schemas/`) blijven gelijk; alleen de inhoud verschilt.
- [ ] Content importeren in het nieuwe project (eigen migratie of handmatig in Studio).

## B. Branding / logo

- [ ] **Logobestand** vervangen: `apps/web/public/diversions-logo.svg`
      (en eventueel het og-default-beeld in `apps/web/public/` + favicon).
- [ ] **`apps/web/src/components/global/navigation/Navigation.astro`** —
      `src="/diversions-logo.svg"`, `alt="Diversions"`, `aria-label="Diversions home"`
      en de nav-labels/CTA naar het nieuwe merk.
- [ ] **`apps/web/src/components/global/Footer.astro`** — merknaam, copyright,
      eventuele adres-/contactgegevens.
- [ ] **`apps/web/src/styles/global.css`** — alleen aanpassen als kleuren/tokens
      verschillen (bij "alleen logo wisselt" meestal ongemoeid laten).

## C. SEO / site-config

- [ ] **`apps/web/astro.config.mjs`** — `site:` naar de definitieve domein-URL
      (voedt sitemap + canonical). *Let op: stond op placeholder; moet sowieso
      in de Diversions-SEO-fase al correct gezet zijn.*
- [ ] **`apps/web/src/components/fundations/head/Seo.astro`** — `siteTitle`,
      `siteDescription`, `locale` (`nl_NL`), `twitterHandle` naar het nieuwe merk.
- [ ] Structured-data / organisatie-naam (als die in de SEO-fase is toegevoegd).
- [ ] **301-redirects** (nginx op Ploi) zijn Diversions-specifiek → **niet**
      meenemen naar het tweede project; nieuwe redirects op basis van de eigen
      oude URL's.

## D. Statische "bouwen-in-astro"-pagina's (handmatig per project)

Deze pagina's staan met **hardgecodeerde Diversions-tekst in de `.astro`-bestanden**
(niet in Sanity). Loop ze na en vervang de content:

- [ ] `apps/web/src/pages/index.astro` (home)
- [ ] `apps/web/src/pages/contact.astro`
- [ ] `apps/web/src/pages/wij-zijn-diversions.astro` (over-ons)
- [ ] `apps/web/src/pages/404.astro`
- [ ] Legal: `privacy-statement.astro`, `cookie-statement.astro`,
      `diversions-algemene-voorwaarden.astro`, `data-rechten.astro`,
      `diversions-richtlijnen-respondenten.astro`, `privacy-statement-pensioencursus.astro`
- [ ] Campagne-/landingspagina's (Diversions-specifiek — waarschijnlijk schrappen):
      `bison.astro`, `bison-bonus-materiaal.astro`, `freedcamp.astro`,
      `freedcamp-lovah.astro`, `accountancy-*.astro`, `pensioencursus-*.astro`,
      `onderzoek-socials.astro`, `videocall-plannen.astro`, `innovatie-intake.astro`,
      `project-starten.astro`, `kennismaking-bedankt.astro`,
      `volgende-stap-voor-de-maag-lever-darm-stichting.astro`,
      `journey-de-kracht-van-het-klantperspectief.astro`, `onze-diensten.astro`,
      `cases-overzichtspagina.astro`, `updates.astro`
- [ ] `apps/web/src/pages/pricing-*.astro` (starter-restanten — schrappen of vullen)
- [ ] **Bestandsnamen = URL's.** Hernoem Diversions-specifieke slugs naar de
      nieuwe site; werk dan ook de nav-hrefs in `Navigation.astro` bij.

## E. Opschonen (aanrader)

- [ ] **`apps/web/src/content/`** — de WP-gemigreerde markdown (work/posts/services/…)
      is met `USE_SANITY = true` ongebruikt, maar staat nog in de repo. Voor een
      schone fork: leegmaken/verwijderen (de Sanity-content is leidend).
- [ ] `inventaris.json` + `wp-content/` (migratie-artefacten van Diversions) → weg.
- [ ] `CLAUDE.md` / `AGENTS.md` aanpassen naar het nieuwe project (paden blijven,
      projectnaam/afspraken wijzigen).

## F. Formulieren (n8n)

- [ ] Formuliercomponenten blijven, maar **n8n-webhook-URL's, Mailjet/Zoho/Supabase-
      bestemmingen** zijn Diversions-specifiek → nieuwe workflows + nieuwe
      env-variabelen (geen webhook-URL's in tekstvelden).

## G. Verifiëren

- [ ] `pnpm install` → `pnpm build:web` schoon (geen placeholder-leaks,
      geen Diversions-tekst meer in de output).
- [ ] Steekproef: home, een case-detail, een blogpost, contact, een legal-pagina.
- [ ] `dist/sitemap-index.xml` wijst naar de nieuwe `site:`-URL.

---

_Snelle grep om Diversions-resten te vinden vóór livegang van project 2:_
`grep -ri "diversions" apps/web/src apps/web/public` _(verwacht: 0 hits behalve
bewuste uitzonderingen)._
