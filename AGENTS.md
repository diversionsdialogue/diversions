# AGENTS.md — Lexington Astro + Sanity starter (this repo)

**Publisher:** [Lexington Themes](https://lexingtonthemes.com/). This monorepo is a single marketing-style Astro site with optional Sanity CMS: homepage sections (hero, services, work, testimonials, blog preview), team and portfolio listings, blog with tags, services, pricing variants, contact, and a small `/system/` UI reference. Primary use case is **SaaS / agency / product marketing** sites that may later hand content to editors via Sanity.

---

## Tech stack (from manifests only)

| Layer | Source | What’s installed / configured |
| ----- | ------ | ---------------------------- |
| **Workspace** | Root `package.json` | `pnpm@9.15.0`; scripts: `dev`, `dev:web`, `dev:studio`, `build`, `build:web`, `build:studio`, `migrate`, `migrate:validate`, `migrate:dry-run`, `seed:all`, `clean`. Root devDependencies: `@sanity/client`, `dotenv`, `gray-matter`, `tsx`. |
| **Site** | `apps/web/package.json` | **Astro ^6.0.4**; **Tailwind CSS ^4.1.18** with **`@tailwindcss/vite` ^4.1.18**; `@astrojs/rss` ^4.0.17; `@astrojs/sitemap` ^3.6.1; `@lexingtonthemes/seo` ^0.1.0; `@sanity/client`, `@sanity/image-url`; `@portabletext/to-html`, `@portabletext/types`; `groq` ^3.71.0; `reading-time` ^1.5.0; `sharp` ^0.34.5; `@tailwindcss/forms`, `@tailwindcss/typography`, `tailwind-scrollbar-hide`. **No `@astrojs/mdx`** (not in this repo). |
| **Site config** | `apps/web/astro.config.mjs` | Vite plugin: `tailwindcss()` from `@tailwindcss/vite`. Integrations: **`@astrojs/sitemap` only**. `site`: `https://yourwebsite.com`. `experimental.svgo`: true. Markdown: `drafts: true`; `shikiConfig.theme`: `"css-variables"`. Top-level `shikiConfig`: `wrap: true`, `skipInline: false`, `drafts: true`. |
| **Studio** | `apps/studio/package.json` | **Sanity ^5.4.0**; `@sanity/vision` ^5.4.0; `@sanity/icons` ^3.7.4; `react` / `react-dom` ^19.2.3; `styled-components` ^6.1.15. |
| **Studio config** | `apps/studio/sanity.config.ts` | Plugins: **`structureTool`** (custom `structure`) and **`visionTool`** only. Project/dataset from `SANITY_STUDIO_*` env. |

---

## Monorepo map (actual paths)

| Path | Role |
| ---- | ---- |
| `apps/web/src/pages/` | File-based routes (see [Routing](#routing)). |
| `apps/web/src/layouts/` | e.g. `BaseLayout.astro`, `TeamLayout.astro`, etc. |
| `apps/web/src/components/` | UI + `landing/`, `blog/`, `global/`, `ctas/`, **`fundations/`** (spelling intentional). |
| `apps/web/src/content/` | Markdown for Content Collections: `team/`, `work/`, `services/`, `posts/`, `legal/`. |
| `apps/web/src/content.config.ts` | Defines the five collections (Zod + `glob` loaders). |
| `apps/web/src/styles/global.css` | Tailwind v4 entry (`@import "tailwindcss"`, plugins, theme tokens/CSS variables as defined in file). |
| `apps/web/src/lib/data.ts` | **`USE_SANITY`** flag and unified `getAll*` / tag helpers (Sanity vs `astro:content`). |
| `apps/web/src/lib/sanity/` | `client.ts`, `fetch.ts`, `queries.ts`, `transforms.ts`, `types.ts`, `image.ts`, `portableText.ts`, `index.ts`. |
| `apps/web/src/images/` | Local images referenced from markdown (e.g. `/src/images/...`) and Astro imports. |
| `apps/web/public/` | **Not present** in this checkout; use `src/images/` or add `public/` if needed. |
| `apps/studio/schemas/` | `teamMember`, `workItem`, `service`, `post`, `legalPage`; `siteSettings.ts` **exists but is not** registered in `schemas/index.ts` (not in Studio). |
| `apps/studio/structure.ts` | Desk structure for the five document types above. |
| `scripts/migrate-to-sanity.ts` | Migration / validate / dry-run / `seed:all`. |
| `scripts/PROJECT_CONTENT_MODEL.ts` | Declared mapping of collection → Sanity type and fields (used by migration). |

---

## Dual content model

### Astro Content Collections (`apps/web/src/content.config.ts`)

Loader: **`glob`** with `pattern: "**/*.md"` per folder. **There is no separate `imageSchema` export** — image fields use **`image()`** from the collection `schema` callback where applicable.

| Collection key | Folder | Required frontmatter (Zod: all fields below are required unless noted) | Images | Copy-this sample |
| -------------- | ------ | ------------------------------------------------------------------------ | ------ | ---------------- |
| `team` | `apps/web/src/content/team/` | `name`, `role`, `intro`, `education` (string array), `experience` (string array), `avatar: { url, alt }` | `avatar.url`: **`image()`** — can be remote URL or local path processed by Astro (see sample). | `apps/web/src/content/team/1.md` |
| `work` | `apps/web/src/content/work/` | `work`, `thumbnail: { url, alt }`; **optional:** `link`, `company`, `year`, `client`, `credits[]` | `thumbnail.url`: **`image()`**; sample uses `"/src/images/work/1.png"`. | `apps/web/src/content/work/1.md` |
| `services` | `apps/web/src/content/services/` | `service`, `description` | No image field in schema. | `apps/web/src/content/services/web-develpment.md` |
| `posts` | `apps/web/src/content/posts/` | `title`, `pubDate` (coerced date), `description`, `author`, `image: { url, alt }`, `tags` (string array) | `image.url`: **`image()`**; sample uses `"/src/images/blog/1.jpeg"`. | `apps/web/src/content/posts/1.md` |
| `legal` | `apps/web/src/content/legal/` | `page`, `pubDate` (coerced date) | No image field. | `apps/web/src/content/legal/privacy.md` |

Body copy for each entry is **markdown after the frontmatter** (standard Content Collection body).

### Sanity CMS (`apps/studio/schemas/`)

Registered document types (**`schemaTypes` in `schemas/index.ts`**): **`teamMember`**, **`workItem`**, **`service`**, **`post`**, **`legalPage`** — aligned with the README “Content Types” table and the five folders above.

- **`teamMember`**: `name`, `role`, `intro`, `education[]`, `experience[]`, `avatar` (image + required `alt`), `body` (text, markdown-oriented).
- **`workItem`**: optional `link`, `company`, `year`, `client`; required `work`; optional `credits[]`; required `thumbnail` (image + `alt`); optional `body`.
- **`service`**: `service`, `description`, `body`.
- **`post`**: `title`, `pubDate`, `description`, `author`, `image` (+ `alt`), `tags[]`, `body`.
- **`legalPage`**: `page`, `pubDate`, `body`.

**`siteSettings.ts`** defines a richer singleton-style model (title, description, siteUrl, OG image, navigation, footer, socials) but is **not** included in `schemaTypes` or `structure.ts` — **not editable in Studio** unless wired up.

**Conceptual map:** same five content areas as collections (team, work, services, posts, legal). `apps/web/src/lib/sanity/transforms.ts` normalizes Sanity documents toward the **Content Collection–like shape** (e.g. image URLs via `urlFor`) so shared presentation can stay consistent.

### Unified API — `data.ts` + `lib/sanity/`

- **`apps/web/src/lib/data.ts`**: `USE_SANITY` boolean; `getAllTeamMembers`, `getAllWorkItems`, `getAllServices`, `getAllPosts`, `getAllLegalPages`, `getPostsByTag`, `getAllTags`.
- **`apps/web/src/lib/sanity/`**: `client.ts`, `fetch.ts`, `queries.ts`, `transforms.ts`, `types.ts`, `image.ts` (`urlFor`, etc.), `portableText.ts`, barrel `index.ts`.

**Important:** Many routes and components still call **`getCollection` from `astro:content` directly**. That matches **Content Collections mode**. After setting **`USE_SANITY = true`**, those call sites need to use **`@/lib/data`** (or equivalent) so lists and detail pages read from Sanity.

### Toggle and environment variables

- **Toggle:** **`export const USE_SANITY`** in **`apps/web/src/lib/data.ts`** (not an `.env` flag). README documents switching `true` / `false` there.
- **Collections-only mode:** no Sanity project or tokens required; `apps/web/.env` optional.
- **Sanity mode:** set **`apps/web/.env`** from **`apps/web/.env.example`**: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`; optional **`SANITY_READ_TOKEN`** (comment in `.env.example`: draft/preview). **`apps/studio/.env`**: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET` (see `apps/studio/.env.example`). Migration also needs **`SANITY_TOKEN`** in the environment when running root scripts (README: Editor token from Sanity project API).

**Preview:** README does not document a separate preview workflow beyond the optional read token note in `.env.example`.

### Migration and seeding (`scripts/`)

- **`pnpm migrate`**: runs `scripts/migrate-to-sanity.ts` — uploads content from `apps/web/src/content/` using **`scripts/PROJECT_CONTENT_MODEL.ts`**; reads **`SANITY_PROJECT_ID`** from **`apps/web/.env`**; requires **`SANITY_TOKEN`**.
- **`pnpm migrate:validate`**, **`pnpm migrate:dry-run`**: same script with `--validate` / `--dry-run`.
- **`pnpm seed:all`**: `--seed-all` — README: deletes existing documents of each type (batched), waits briefly, then creates **one document per collection** from markdown; see README for exact behavior.

---

## Routing

Dynamic segments use **`[...slug]`** (catch-all) where listed. There are **no** `customers`, `changelog`, `integrations`, or `help-center` routes in `apps/web/src/pages/`.

| Pattern | File(s) |
| ------- | ------- |
| `/` | `pages/index.astro` |
| `/contact` | `pages/contact.astro` |
| `/rss.xml` | `pages/rss.xml.js` |
| `/team`, `/team/...` | `pages/team/index.astro`, `pages/team/[...slug].astro` |
| `/work`, `/work/...` | `pages/work/index.astro`, `pages/work/[...slug].astro` |
| `/services`, `/services/...` | `pages/services/index.astro`, `pages/services/[...slug].astro` |
| `/blog`, `/blog/posts/...` | `pages/blog/index.astro`, `pages/blog/posts/[...slug].astro` |
| `/blog/tags`, `/blog/tags/[tag]` | `pages/blog/tags/index.astro`, `pages/blog/tags/[tag].astro` |
| `/legal/...` | `pages/legal/[...slug].astro` |
| `/legal/about` | `pages/legal/about.astro` (static page; separate from `[...slug]` legal entries) |
| `/pricing-simple`, `/pricing-full` | `pages/pricing-simple.astro`, `pages/pricing-full.astro` |
| `/system/overview`, `/system/colors`, `/system/typography`, `/system/buttons`, `/system/links` | `pages/system/*.astro` |
|404 | `pages/404.astro` |

---

## Customization (real files)

- **Canonical site URL:** `apps/web/astro.config.mjs` → `site`. Per-page SEO: `apps/web/src/layouts/BaseLayout.astro` → `apps/web/src/components/fundations/head/BaseHead.astro` (and related `Seo.astro`, `Meta.astro`, `Fonts.astro`, `Favicons.astro`).
- **Global CSS / Tailwind:** `apps/web/src/styles/global.css` (plugins and design tokens as defined there).
- **Chrome:** `apps/web/src/components/global/navigation/Navigation.astro`, `apps/web/src/components/global/Footer.astro`.

---

## Commands (README + root `package.json`)

| Command | Purpose |
| ------- | ------- |
| `pnpm install` | Install all workspace packages. |
| `pnpm dev` | **Parallel** `dev` in workspace packages (site + studio). |
| `pnpm dev:web` | Site only (`apps/web`, Astro dev server). |
| `pnpm dev:studio` | Studio only. |
| `pnpm build` / `pnpm build:web` / `pnpm build:studio` | Production builds. |
| `pnpm migrate` (+ token env) | Push markdown → Sanity. |
| `pnpm migrate:validate` / `pnpm migrate:dry-run` | Validate / preview migration. |
| `pnpm seed:all` | Reset-style seed (see README). |
| `pnpm clean` | `scripts/clean.sh` (cleanup for packaging). |

Day-to-day site work is usually **`pnpm dev:web`** from the repo root.

---

## Guardrails

- **Do not rename `fundations`** — imports and paths use that spelling.
- **Keep Zod collections, Sanity schemas, `transforms.ts`, `queries.ts`, `types.ts`, and `PROJECT_CONTENT_MODEL.ts` in parity** when changing fields.
- **Prefer minimal diffs** consistent with existing patterns.
- **`pnpm validate`** is **not** defined in root `package.json` (not present in this repo).

---

## Support and docs (README pattern)

Use the same placeholders as **`README.md`** until you replace them with your theme’s URLs:

- Documentation: `https://lexingtonthemes.com/documentation`
- Support: `https://lexingtonthemes.com/legal/support/`
- Changelog / specs / bundle links as in README “Links” section.

Sanity: README links to **`https://sanity.io/manage`** for project setup; official docs: **`https://www.sanity.io/docs`** (also in README Resources).
