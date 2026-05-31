# Sanity-documenttypes — voorstel (intake, Fase 0)

> Voorstel voor de schema-fase. Niet bouwen. Map op het **bestaande** theme-content-model
> (CLAUDE.md §2); nieuwe types alleen waar niets past. Houd schema's klein — uitbreiden
> kan later via de parity-regel (CLAUDE.md §2, 5 plekken).

## Samenvatting bestemmingen (uit `inventaris.json`)

- **importeren-naar-sanity: 142** → `post` 84 · `service` 50 · `workItem` 8
- **bouwen-in-astro: 29** (home, contact, overzichtspagina's, juridisch, funnel/landing)
- **droppen: 36** · **alleen-redirect: 1**

## Te gebruiken bestaande types (geen wijziging nodig)

| Type | Aantal | Bron-URL's | Velden (bestaand, CLAUDE.md §2) |
|---|---|---|---|
| `post` | 84 | `/blog/<slug>` (berichten + 5 DRAFT-met-reusable-block, na contentcheck) | title, pubDate, description, author, image{url,alt}, tags[], body |
| `service` | 50 | `/services/<slug>` (diensten, journeys, onderzoek-, seo-, cro-detailpagina's) | service, description, body |
| `workItem` | 8 | `/work/<slug>` (cases onder `/cases-overzichtspagina/`) | work, thumbnail{url,alt}, link?, company, year, client, credits[], body |

`teamMember` en `legalPage` bestaan in de theme maar:
- **`teamMember`**: geen losse teamleden-pagina's in de export → **niet vullen** in deze migratie
  (kan later). "Wij zijn Diversions" wordt `bouwen-in-astro` (over-ons), niet per persoon.
- **`legalPage`**: 6 juridische pagina's (privacy-statement, cookie-statement, data-rechten,
  algemene-voorwaarden, richtlijnen-respondenten, privacy-statement-pensioencursus).
  **Voorstel: bouwen-in-astro** (zelden gewijzigd, eigenaar beheert). Alternatief: importeren
  als `legalPage` als de klant ze zelf wil kunnen aanpassen. **Beslissing bij checkpoint.**

## Nieuw type? — `doelgroepen` / onderzoeksvormen

- Het **design** kent doelgroepen (overzicht hergebruikt `blog.html`-layout, detail =
  `doelgroepen.html`) en heeft géén theme-equivalent (CLAUDE.md §3).
- In de **WP-export** zit dit als de 12 DRAFT-"onderzoeksvormen" (website-/panel-/lezers-/
  klant-/imago-onderzoek enz.) — nooit gepubliceerd, geen verkeer. Nu op **droppen** gezet
  (+ 301 → `/onderzoek`).
- **Voorstel:** géén apart `doelgroepen`-type aanmaken zolang deze reeks gedropt blijft. Wil
  de klant deze reeks lanceren, dan twee opties (klein houden):
  1. importeren als `service` (ze gedragen zich als dienst-detailpagina's), of
  2. één nieuw type `researchType`/`doelgroep` mét de design-doelgroepen-layout.
  **Beslissing bij checkpoint** (zie gemarkeerde groep in inventaris).

## Gedeelde blokken (Portable-Text `body`-array) — apart benoemd

Volg het blok-API-voorstel uit **CLAUDE.md §4** (definitieve props pas na Fase 1). Voorkomen
in de content:

| Blok | Sanity-type | Voorkomen in export |
|---|---|---|
| FAQ (accordeon → Q&A) | `faqBlock` | ~29 documenten met FAQ-items (3–4 per stuk) + accordion-als-faq; **incl. FAQPage Schema.org** |
| CTA | `ctaBlock` | shortcodes `[USP]`, `[template]`, `[true]`, `[vc_btn]` → CTA-/USP-blokken (homepage, diensten) |
| Quote | `quoteBlock` | pullquotes in long-form diensten/cases |
| Notice ("Onze regel") | `noticeBlock` | callouts in diensten |
| Video | `videoBlock` | `[Video]` 5x (o.a. DRAFT-blog-pagina), 3 video-embeds in berichten; AVG-consent (Fase 6) |
| Genummerde lijst | `numberedList` | werkwijze-/stappen-`<ol>` en stats in diensten |
| Opsomming | `bulletList` | bullets / venn-cellen |

Accordion-items die **géén** Q&A zijn (inhoudslijst/glossarium — o.a. design-sprint,
sociaal-bewijs, beperkte-keuze) staan in `inventaris.json` gemarkeerd: handmatig beoordelen
of dit `bulletList`/`numberedList` of toch `faqBlock` wordt.

## Aandachtspunten voor de schema-/convert-fase (uit intake)

- **`seo-marketing` (service, hoog verkeer):** MD bevat alleen 4 FAQ-blokken; ~460 woorden
  body uit Beaver Builder ontbreekt → live-pagina nahalen vóór import.
- **5 berichten + 20 berichten verwijzen naar herbruikbare blokken (refs 71846 / 72355 / 72418)
  die NIET in de export zaten** → handmatig ophalen van live in de convert-fase.
- **`ongesloten-shortcode`** in diverse seo-/conversie-diensten → body opschonen bij conversie.
