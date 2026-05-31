# CLAUDE.md — Migratie WordPress → Astro · Diversions

Dunne, verwijzende context voor dit migratieproject. De **theme-feiten** staan in
het meegeleverde **[`AGENTS.md`](AGENTS.md)** (Lexington Astro + Sanity starter).
Lees dat eerst. Dit bestand voegt alleen de **migratiespecifieke** afspraken toe en
herhaalt de techtabellen uit `AGENTS.md` bewust niet.

> **Iedere subagent leest eerst dit bestand én `AGENTS.md`.** Theme-feiten (paden,
> content-model, naamconventies) komen hiervandaan, niet hardgecodeerd uit de agent.

---

## 0. Wat dit project is

- **Theme:** `outkast-sanity-astro` (q2 2026). Dit is een **Lexington Astro+Sanity**
  theme → het known-theme-profiel `.claude/agents/theme-profiel-lexington-sanity.md`
  is van toepassing en is bij de verkenning geverifieerd (zie §1).
- **Stack:** Astro 6 + Tailwind v4 · Sanity 5 (Studio) · GitHub · Ploi · Hetzner ·
  n8n (formulieren).
- **Site-taal:** Nederlands (`diversions.nl`).
- **Design:** map `/design` — statische HTML + losse CSS, met **React/JSX
  prototypes** (`*.jsx`) als referentie. Deze worden in de theme-fase (Fase 1) naar
  Astro-componenten omgezet; de JSX zelf gaat niet de site in.

---

## 1. Verkenning Fase 0a — bevindingen (geverifieerd)

Geïnstalleerd met `pnpm install` (root, pnpm 9.15.0, Node 24). `pnpm build:web`
draait schoon: **22 pagina's** gebouwd in Content-Collections-modus (geen Sanity-env
nodig). Het Lexington-profiel klopt op alle punten:

| Wat | Pad | Status |
|---|---|---|
| Astro-site | `apps/web/` | ✓ |
| Site-bron | `apps/web/src/` | ✓ |
| Sanity Studio | `apps/studio/` | ✓ |
| Sanity-schema's | `apps/studio/schemas/` | ✓ (5 types geregistreerd) |
| Sanity-datalaag in de site | `apps/web/src/lib/sanity/` | ✓ (client, fetch, queries, transforms, types, image, portableText) |
| `USE_SANITY`-vlag | `apps/web/src/lib/data.ts` | ✓ (staat op `false`) |
| Globale styling | `apps/web/src/styles/global.css` | ✓ |
| Markdown-content (Collections) | `apps/web/src/content/` | ✓ |
| Migratiescript | `scripts/migrate-to-sanity.ts` | ✓ (+ `PROJECT_CONTENT_MODEL.ts`) |
| Blocks-map | `apps/web/src/components/blocks/` | ✓ — **aangemaakt in Fase 1** (zie §4) |

- **Contextbestand:** de theme levert `AGENTS.md` mee → géén `/init`, deze dunne
  `CLAUDE.md` verwijst ernaar (workflow §0a contextbestand-regel).
- **Sanity-koppeling:** volledig ingebouwd via de `USE_SANITY`-vlag. De Studio is
  bedraad (5 schema's + `structure.ts` + `visionTool`) maar **draait pas met een
  `SANITY_STUDIO_PROJECT_ID`** in `apps/studio/.env`. Een Sanity-project aanmaken is
  een latere, externe stap (niet in Fase 0a uitgevoerd).
- **`siteSettings.ts`** bestaat wél in `schemas/` maar is **niet** geregistreerd in
  `schemas/index.ts` → niet bewerkbaar in Studio tenzij bewust aangezet.

---

## 2. Content-model van de theme (als gegeven nemen)

Vijf Content Collections ↔ vijf Sanity-documenttypes, in parity gehouden. Velden
staan in `apps/web/src/content.config.ts` (Zod), `apps/studio/schemas/*` en
`scripts/PROJECT_CONTENT_MODEL.ts`.

| Collection | Sanity-type | Kernvelden |
|---|---|---|
| `team` | `teamMember` | name, role, intro, education[], experience[], avatar{url,alt}, body |
| `work` | `workItem` | work, thumbnail{url,alt}, (opt) link, company, year, client, credits[], body |
| `services` | `service` | service, description, body |
| `posts` | `post` | title, pubDate, description, author, image{url,alt}, tags[], body |
| `legal` | `legalPage` | page, pubDate, body |

> **Parity-regel (5 plekken).** Een veld/type toevoegen of wijzigen raakt: (1)
> `apps/studio/schemas/`, (2) `apps/studio/schemas/index.ts`, (3)
> `apps/studio/structure.ts`, (4) `apps/web/src/lib/sanity/queries.ts`, (5)
> `apps/web/src/lib/sanity/types.ts` — plus de Zod-collectie en `transforms.ts` /
> `PROJECT_CONTENT_MODEL.ts`. Houd ze synchroon, anders breekt de datalaag of de
> migratie. Houd schema's bewust klein; uitbreiden kan altijd.

---

## 3. Design → paginatype → theme-route/collection (mapping)

De NL-designtermen overbruggen we naar de bestaande theme-structuur. **Cases = work**,
**diensten = services**, **blog = posts**. **Doelgroepen** heeft géén theme-equivalent
en is een toe te voegen sectie.

| Design-pagina (`/design`) | Paginatype | Theme-route (bestaand) | Collection / bestemming |
|---|---|---|---|
| `index.html` | home | `/` (`pages/index.astro`) | bouwen-in-astro |
| `werk.html` | cases-overzicht | `/work` | `work` |
| `case-messup.html` | case-detail | `/work/[...slug]` | `work` (workItem) |
| `blog.html` | blog-overzicht | `/blog` | `posts` |
| `blog-post.html` | blog-detail | `/blog/posts/[...slug]` | `posts` (post) |
| `services.html` | diensten-overzicht | `/services` | `services` |
| `services-detail.html` | diensten-detail (long-form, blokken) | `/services/[...slug]` | `services` (service) |
| `contact.html` | contact | `/contact` | bouwen-in-astro (+ formulier, Fase 4) |
| `doelgroepen.html` | doelgroep-detail | **nieuw** | nieuw — zie hieronder |
| (doelgroepen-overzicht, design hergebruikt `blog.html`) | doelgroepen-overzicht | **nieuw** | nieuw |
| `404.html` | 404 | `pages/404.astro` | bouwen-in-astro |

> **Doelgroepen** is een nieuw, herhalend type (overzicht reuse `blog.html`-layout,
> detail = `doelgroepen.html`). Beslis in de intake/schema-fase of dit een **nieuwe
> Sanity-collectie** wordt (dan: parity-regel §2 volgen) of als variant van een
> bestaand type. Niet vooruitlopen — dit is een intake-beslissing.

> **URL's & redirects:** de theme-routes hierboven zijn de *huidige* (Engelstalige)
> paden. Definitieve NL-slugs, keep/drop en 301-redirects zijn beslissingen van de
> **intake** en **seo-astro**-fases en komen in `inventaris.json`; niet hier
> hardcoden.

---

## 4. Speciale blokken — blok-API (DEFINITIEF, vastgelegd in Fase 1)

> **Definitief.** De Astro-componenten staan in `apps/web/src/components/blocks/`
> (gebouwd in Fase 1). De props/veldnamen hieronder zijn de **werkelijke props** van
> die componenten en gelden als **contract** voor de `sanity-schema`-agent (Sanity-
> bloktypes) en de `convert`-agent (mapping). Houd Sanity-bloktype-velden **identiek**
> aan de Astro-props (parity op blokniveau). Wijzigt een prop hier, dan ook in het
> Sanity-schema.

Elk blok heeft een **Astro-component** in `apps/web/src/components/blocks/` en krijgt
straks een **Sanity-bloktype** (object in een Portable-Text `body`-array). Bron-CSS/
markup: `design/services-detail.html` + `design/article.css` (+ `components.jsx`,
`article-extras.jsx`).

| Blok | Astro-component | Sanity-type | Werkelijke props (component-API) |
|---|---|---|---|
| Quote | `Quote.astro` | `quoteBlock` | `quote` (string, verplicht), `author?` (string), `role?` (string) |
| Opsomming (bullets / venn) | `BulletList.astro` | `bulletList` | `title?` (string), `columns?` (`1`\|`2`, default `1`), `items[]`. Bij `columns:1` → `items: string[]`. Bij `columns:2` (venn) → `items: { heading, text?, items?: string[] }[]` |
| CTA | `Cta.astro` | `ctaBlock` | `heading` (string, verplicht), `text?` (string), `buttonLabel` (string, verplicht), `buttonHref` (string, verplicht), `variant?` (`default`\|`sage`, default `default`), `image?` (`{ url, alt? }`) |
| Let-op-blok | `Notice.astro` | `noticeBlock` | `label` (string, verplicht — bv. "Onze regel"), `text` (string, verplicht) |
| Video | `Video.astro` | `videoBlock` | `videoUrl` (string, verplicht — embed-URL), `poster` (`{ url, alt? }` of string, verplicht), `label?` (string). **Klik-om-te-laden**: embed wordt pas op klik/Enter geïnjecteerd; géén third-party load vóór interactie. **AVG-consent-gate is gemarkeerd in de component voor Fase 6.** |
| Opsomming cijfers | `NumberedList.astro` | `numberedList` | `title?` (string), `items[]`: `{ number?: string, label: string, text?: string }`. `number` ontbreekt → 1-based positie (stappen); `number` aanwezig → stat-waarde (bv. "92%"). Dekt beide leeswijzen. |
| Accordeon → FAQ | `Faq.astro` | `faqBlock` | `items[]`: `{ question: string, answer: string }`, `open?` (number, index dat open is op load, default `0`; `-1` = alles dicht). Component rendert **`FAQPage` Schema.org JSON-LD** + is **toetsenbord-toegankelijk** (native `<button>`, `aria-expanded`, `aria-controls` → gekoppelde `role="region"`). a11y/JSON-LD horen bij de component, **niet** in het schema. |

> **Opgelost open punt (was checkpoint-vraag).** "Opsomming cijfers" dekt zowel
> genummerde stappen (`werkwijze`-`<ol>`) als een stats/cijfer-lijst via het optionele
> `number`-veld op elk item — bevestigd in de Fase 1-review.

> **Parity-prioriteit:** `Cta` en `Faq` zijn de blokken die zeker ook als Sanity-
> bloktype bestaan; houd hun velden 1-op-1. `Cta.astro` hergebruikt
> `fundations/elements/Button.astro`; de overige blokken zijn pure presentatie en
> gebruiken de centrale tokens/kleurschalen uit `global.css`.

> **Visuele referentie / demo:** `apps/web/src/pages/system/blocks.astro`
> (`/system/blocks`, `noindex`) rendert alle blokken voor visuele + a11y-controle.

---

## 5. Naamconventies (fragiel — niet wijzigen)

- **`fundations`** (zonder "o") in `apps/web/src/components/fundations/` — bewuste
  spelling, imports door de hele site wijzen hierop. **Niet hernoemen.**
- **Fundament-componenten:** `Wrapper.astro` (`variant`: `default`/`prose`) en
  `Button.astro` (`variant`/`size`/icon-slots). Inhoud restylen mag; API/paden niet
  breken.
- Workspace-filters heten `@lexington/web` en `@lexington/studio` (zie root
  `package.json`); `pnpm dev:web` / `pnpm dev:studio`.

---

## 6. Commando's (dagelijks)

| Commando | Doel |
|---|---|
| `pnpm install` | Alles installeren (root) |
| `pnpm dev:web` | Alleen site, `http://localhost:4321` |
| `pnpm dev:studio` | Alleen Studio, `http://localhost:3333` (vereist Sanity-env) |
| `pnpm dev` | Beide parallel |
| `pnpm build:web` | Productiebuild site → `dist/` |
| `pnpm migrate` / `:validate` / `:dry-run` | MD → Sanity (vereist `SANITY_TOKEN`) |

Meer in `AGENTS.md` (Commands) en `README.md`.

---

## 7. Werkregels (gelden altijd, voor alle agents)

- **Nooit naar GitHub pushen, nooit deployen.** Werk lokaal; commits op aparte
  branches per fase.
- **Stop bij elk checkpoint** voor menselijk akkoord. Human-in-the-loop na: intake,
  contentconversie, SEO-beslissingen, formulierentest, en vlak vóór de push.
- **Eén centraal `inventaris.json`** (projectroot, nog aan te maken in de intake) is
  de bron voor bestemming per URL en voor redirects. Alle fases lezen/schrijven hier.
- **Theme-feiten uit `CLAUDE.md`/`AGENTS.md` halen**, niet hardcoden in agents.
- **301-redirects in nginx op Ploi**, niet in Astro. Negeer de Vercel/Netlify-stappen
  uit de theme-docs (onze hosting is Ploi + Hetzner).
- **Geen secrets in tekstvelden** — webhook-URL's en tokens als omgevingsvariabelen.
- **Wantrouw de WP-export**: neem handmatige steekproeven (zie
  `wp-content/.../verdacht-rapport.md`).

---

## 8. Mapstructuur (toegevoegd door de migratie)

- `wp-content/content-bron-paginas/` — door Fase 0b geproduceerde schone MD +
  inventarissen (afbeeldingen, conversie-overzicht, verdacht-rapport) voor pagina's.
- `wp-content/afbeeldingen.py` — afbeeldingen-downloadscript (Fase 0b).
- `inventaris.json` — **nog niet aanwezig**; output van de intake (Fase 0).
- `/design` — designinstructies (HTML/CSS/JSX-prototypes).
- `.claude/agents/` — subagent-definities + workflow-document + Lexington-profiel.

---

_Referentie-bestanden: [`AGENTS.md`](AGENTS.md), [`README.md`](README.md),
[`STARTING-UP.md`](STARTING-UP.md),
[`.claude/agents/workflow-wordpress-naar-astro.md`](.claude/agents/workflow-wordpress-naar-astro.md),
[`.claude/agents/theme-profiel-lexington-sanity.md`](.claude/agents/theme-profiel-lexington-sanity.md)._
