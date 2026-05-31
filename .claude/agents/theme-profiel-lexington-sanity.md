# Theme-profiel: Lexington Astro + Sanity

Een **known-theme-profiel**: een verzameling vaste feiten over de Lexington
Astro+Sanity-themes. Dit bestand hoort **niet** bij het generieke proces — het
workflow-document en de agents blijven theme-onafhankelijk. Dit profiel wordt alleen
gebruikt als de Lexington-check in **Fase 0a** "ja" oplevert.

**Gebruik:** dit profiel is de **invul-basis voor `CLAUDE.md`**. Bij een
Lexington-ja kun je de verkenningsstap grotendeels overslaan en `CLAUDE.md` direct
vullen met onderstaande feiten — in plaats van ze uit de repo af te leiden.

> **Belangrijk: verifieer bij installatie.** Lexington werkt themes regelmatig bij.
> Behandel dit profiel als "zeer waarschijnlijk correct", niet als onveranderlijk.
> Controleer bij de eerste verkenning of de paden en bestandsnamen nog kloppen, en
> werk dit profiel bij als Lexington iets verandert. De punten met ⚠️ wisselen het
> vaakst per theme.

---

## 1. Architectuur (vast)

- **Monorepo** met **pnpm workspaces** (`pnpm-workspace.yaml` in de root).
- Twee apps:
  - `apps/web/` — de Astro-website;
  - `apps/studio/` — de Sanity Studio (CMS).
- Tech: **Astro JS + Tailwind CSS v4**, **Alpine JS** voor interactiviteit, vanilla
  JS voor complexere componenten.
- Kan ook als statische HTML geëxporteerd worden.

### Paden (voor `CLAUDE.md`)
| Wat | Pad |
|---|---|
| Astro-site | `apps/web/` |
| Site-bron | `apps/web/src/` |
| Sanity Studio | `apps/studio/` |
| Sanity-schema's | `apps/studio/schemas/` |
| Sanity-datalaag in de site | `apps/web/src/lib/sanity/` |
| Globale styling | `apps/web/src/styles/global.css` |
| Markdown-content (Content Collections) | `apps/web/src/content/` |
| Migratiescript | `scripts/migrate-to-sanity.ts` |

---

## 2. De `fundations`-map (naamconventie — fragiel)

De basiscomponenten staan in **`apps/web/src/components/fundations/`** (let op: de
naam is gespeld als **`fundations`**, zonder "o" — dat is bewust zo in de hele
codebase). Imports door de hele site wijzen hierop.

```
fundations/
├── containers/   # o.a. Wrapper.astro
├── elements/     # o.a. Button.astro, Link, Text
├── head/         # BaseHead, Seo, Meta, Fonts, Favicons
├── icons/        # Close, Menu, Plus, Search
└── scripts/      # FuseJS, KeenSlider
```

> **Regel voor de theme-agent:** de **inhoud** van deze componenten mag je restylen
> (dat is juist het werk). **Wijzig de mapnaam `fundations` of de import-paden niet** —
> dan breekt de hele site. Hernoem de typefout niet "om het netjes te maken".

Twee fundament-componenten om te kennen:
- **`Wrapper.astro`** — standaardiseert sectiebreedte/spacing/typografie. Heeft een
  `variant`-prop: `default` (container met padding) en `prose` (Tailwind Typography,
  voor rijke tekst zoals blogposts). Plus `class` en `id`.
- **`Button.astro`** — toegankelijke button met `variant` (`default`/`muted`/`none`),
  `size` (`xs`–`xl`), `gap`, `onlyIconSize`, `class`. Iconen via named slots
  (`slot="left-icon"` / `slot="right-icon"`).

⚠️ **Iconen:** de specs noemen op verschillende plekken `lucide-astro` én Remix/
Tabler/Phosphor. Welke iconen-set deze specifieke theme gebruikt, even checken bij
installatie.

---

## 3. Dual data source: het `USE_SANITY`-mechanisme (belangrijk)

Dit is het hart van waarom Lexington goed bij jouw proces past. De theme kan content
uit **twee bronnen** halen, met dezelfde componenten en layouts:

- een vlag in **`apps/web/src/lib/data.ts`**:
  - `export const USE_SANITY = false;` → content uit **Markdown** (Content
    Collections in `apps/web/src/content/`);
  - `export const USE_SANITY = true;` → content uit **Sanity CMS**.

Gevolg voor het migratieproces: de **MD→Sanity-route bestaat al ingebouwd**. Je hoeft
het wisselen tussen bronnen niet zelf te bouwen — alleen de vlag om te zetten en je
content op de juiste plek te krijgen.

---

## 4. Bestaand migratiescript (hergebruiken i.p.v. zelf bouwen)

De theme levert **`scripts/migrate-to-sanity.ts`** mee. Dit script:
- leest content uit **`apps/web/src/content/`**;
- uploadt die naar Sanity, **inclusief afbeeldingen**;
- leest `SANITY_PROJECT_ID` uit `apps/web/.env`.

Draaien (met een Sanity API-token met Editor-rechten):
```bash
cd scripts
SANITY_TOKEN=jouw-token npx tsx migrate-to-sanity.ts
```

> **Gevolg voor de convert-agent:** voor content die op het vaste Lexington-model
> past, kun je dit script hergebruiken in plaats van je eigen
> `naar-sanity-ndjson.py` te bouwen. **Voorwaarde:** je opgeschoonde WP-MD moet eerst
> in de structuur van `apps/web/src/content/` staan (de Content Collections van deze
> theme). Het werk verschuift dus van "MD → Sanity bouwen" naar "MD → Lexington
> Content Collections vormgeven", waarna hun script de rest doet.

---

## 5. Content-model & parity-koppeling (vast patroon)

Een nieuw content-type toevoegen raakt **vijf plekken** die synchroon moeten blijven.
Dit is de parity-regel, officieel uit de Lexington-docs:

1. schema aanmaken in `apps/studio/schemas/`
2. registreren in `apps/studio/schemas/index.ts`
3. toevoegen aan `apps/studio/structure.ts`
4. query maken in `apps/web/src/lib/sanity/queries.ts`
5. types toevoegen in `apps/web/src/lib/sanity/types.ts`

⚠️ **Welke content-types de theme standaard heeft, verschilt per theme** (de ene
Lexington-theme heeft andere collecties dan de andere). Lees de werkelijke set uit
`apps/web/src/content/` (de Content-Collections-config) en `apps/studio/schemas/`.
Vaak zie je iets als posts, team, services, work, legal — maar ga daar niet vanuit;
verifieer per theme.

> **Regel voor de sanity-schema-agent:** neem het bestaande content-model als
> **gegeven** en map je content daarop. Voeg je tóch een veld of type toe, werk dan
> **alle vijf** bovenstaande plekken bij — anders breekt de migratie of de datalaag.

---

## 6. Praktische commando's & omgeving

- **Node.js** v16.12.0 of hoger; **pnpm** als package manager.
- Installeren: `pnpm install` in de **root** (niet per app).
- Ontwikkelen: `pnpm dev` (site + Studio samen), `pnpm dev:web`, `pnpm dev:studio`.
- Bouwen: `pnpm build`. Output in `dist/`.
- Site draait lokaal op `http://localhost:4321`, Studio op `http://localhost:3333`.
- **Omgevingsvariabelen** (twee `.env`-bestanden, kopieer van `.env.example`):
  - `apps/web/.env`: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`;
  - `apps/studio/.env`: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`.

⚠️ **Let op — afwijkende hosting.** De Lexington-docs gaan uit van Vercel/Netlify.
**Jouw stack is Ploi + Hetzner.** Negeer dus de Vercel/Netlify-deploystappen uit de
theme-docs; gebruik je eigen deploy. De **redirects** horen sowieso in de
nginx-config op Ploi (zie de seo-astro-agent), niet bij een themedienst.

---

## 7. Wat dit profiel je per fase bespaart

- **Fase 0a:** paden, fundations-regel, parity-koppeling en het content-model-patroon
  zijn al bekend → verkenning grotendeels overslaan; `CLAUDE.md` direct vullen.
- **Theme-fase:** de `fundations`-naamregel en de Wrapper/Button-API zijn bekend.
- **Sanity-schema-fase:** de 5-plekken-parity is bekend.
- **Convert-fase:** mogelijk geen eigen Python-script nodig — hergebruik
  `migrate-to-sanity.ts`, mits content in de Content-Collections-vorm staat.

> Vul bij een nieuw (niet-Lexington) theme een eigen profiel naar ditzelfde stramien;
> dan groeit je verzameling known-theme-profielen zonder dat het proces verandert.
