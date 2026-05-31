# Sanity-schema nulpunt (Stap 1) — vóór wijziging

Vastlegging van wat de **outkast** Lexington-theme al meelevert in
`apps/studio/schemas/` en de datalaag `apps/web/src/lib/sanity/`. Dit is het
referentiepunt; de wijzigingen in Stap 2-4 worden hiertegen afgezet.

## Bestaande documenttypes (5 geregistreerd in `schemas/index.ts`)

| Type | Geregistreerd | In scope migratie | Velden (huidig) |
|---|---|---|---|
| `post` | ja | **ja** (79) | `title` (string), `pubDate` (date), `description` (text), `author` (string), `image` (image+alt), `tags` (string[]), `body` (**text**) |
| `service` | ja | **ja** (50) | `service` (string), `description` (text), `body` (**text**) |
| `workItem` | ja | **ja** (8) | `link?` (url), `company?`, `year?`, `client?`, `work` (string), `credits[]` ({name,role}), `thumbnail` (image+alt), `body?` (**text**) |
| `teamMember` | ja | nee (niet vullen) | name, role, intro, education[], experience[], avatar, body (text) |
| `legalPage` | ja | nee (bouwen-in-astro) | page, pubDate, body (text) |

`siteSettings.ts` bestaat als bestand maar is **niet** geregistreerd (laten zoals het is).

## Kernobservatie: `body` is nu een platte string, GEEN Portable Text

In alle drie de in-scope types is `body` gedefinieerd als:

```ts
defineField({ name: "body", title: "Body Content", type: "text",
  description: "...markdown format" })
```

Dat is dus een **markdown/tekstveld**, geen Portable-Text `array`. Gevolgen:

- Er is **geen** rich-text-veld waarin blokken (CTA, FAQ, quote, ...) kunnen leven.
- Er bestaan **nog geen** bloktypes (`ctaBlock`, `faqBlock`, etc.).
- De datalaag is hierop afgestemd: `portableText.ts` is een **stub** die de string
  ongewijzigd teruggeeft (`portableTextToHtml(body: string)`), en `transforms.ts`
  geeft `body: sanityDoc.body` (string) door als Collection-`body` (markdown).
- In de Content-Collections-modus is `body` de markdown **ná** de frontmatter
  (glob-loader), niet een Zod-veld in `content.config.ts`.

### Ontwerpkeuze die hieruit volgt

De gedeelde blokken uit CLAUDE.md §4 (CTA, FAQ, quote, notice, video, numberedList,
bulletList) hebben een Portable-Text-array nodig om "tussen de tekst" te kunnen
leven. De site heeft daar al infra voor (`@portabletext/to-html` aanwezig,
`lib/sanity/portableText.ts` placeholder). **Daarom wordt `body` in `post`,
`service` en `workItem` omgezet naar een Portable-Text `array`** met:
- standaard `block` (H2/H3, normal, quote-style, bullet/number lists, marks) — de
  gewone Portable-Text-stijlen, geen aparte bloktypes;
- de custom blok-object-types als toegestane array-leden.

Dit is een **uitbreiding** van de drie bestaande types (geen nieuw type, niets
dubbel). `teamMember`/`legalPage` blijven ongemoeid (buiten scope).

## Slug — ontbreekt nu in Sanity

Geen van de types heeft een expliciet `slug`-veld. In Collections-modus komt de slug
uit de bestandsnaam; in Sanity gebruikt `transforms.ts` nu `slug: sanityDoc._id`. Voor
de import moet de slug matchen met `nieuwe_url` uit `inventaris.json`
(post → `/blog/<slug>`, service → `/services/<slug>`, workItem → `/work/<slug>`).
Daarom voeg ik een `slug`-veld toe aan de drie types.

## Parity-plekken (CLAUDE.md §2 — 5 + 2)

Een veld-/typewijziging raakt: (1) `apps/studio/schemas/`, (2) `schemas/index.ts`,
(3) `apps/studio/structure.ts`, (4) `apps/web/src/lib/sanity/queries.ts`,
(5) `apps/web/src/lib/sanity/types.ts` — plus `transforms.ts` en
`scripts/PROJECT_CONTENT_MODEL.ts` / Zod-collectie waar relevant.

## inventaris.json — typenamen

`bestemming: importeren-naar-sanity` = 137 items: `post` 79 · `service` 50 ·
`workItem` 8. De `sanity_type`-waarden zijn al exact `post`/`service`/`workItem` en
de URL-prefixes (`/blog/`, `/services/`, `/work/`) kloppen → **geen update van
`inventaris.json` nodig**.
