# Theme Name

![Theme preview](https://lexingtonthemes.com/OpenGraph/theme-name/twitter.png)


## Links
- **Theme specs:** https://lexingtonthemes.com/templates/theme-name  
- **Documentation:** https://lexingtonthemes.com/documentation  
- **Changelog:** https://lexingtonthemes.com/changelog/theme-name  
- **Support:** https://lexingtonthemes.com/legal/support/  
- **Get the bundle:** https://lexingtonthemes.com  

---

## Two Ways to Use This Theme

This theme supports **two data sources** — choose what works best for you:

### Option A: Content Collections (No CMS Required)

Use markdown files in `apps/web/src/content/`. Perfect for:

- Quick setup with no external services
- Git-based content workflow
- Developers comfortable editing markdown

### Option B: Sanity CMS (Recommended for Clients)

Use Sanity Studio for a visual editing experience. Perfect for:

- Non-technical content editors
- Teams collaborating on content
- Dynamic content updates without code changes

**By default, the theme uses Content Collections.** Follow the instructions below to switch to Sanity.

---

## Quick Start (Content Collections)

If you just want to get started without Sanity:

```bash
# Install dependencies
pnpm install

# Start the website
pnpm dev:web
```

Open http://localhost:4321 — your site is ready with sample content!

Edit content in `apps/web/src/content/`:

- `team/` — Team members
- `work/` — Work/portfolio items
- `services/` — Services offered
- `posts/` — Blog posts
- `legal/` — Legal pages

---

## Getting Started with Sanity

### Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org)
- **pnpm** — Install with `npm install -g pnpm`
- **Sanity account** — Free at [sanity.io](https://sanity.io)

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Create Your Sanity Project

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Sign up or log in
3. Click **"Create project"**
4. Give it a name (e.g., "My Website")
5. Choose the **Free** plan
6. **Create a dataset** named `production`
7. Copy your **Project ID** (you'll need this next)

### Step 3: Set Up Environment Variables

**For the website** — Create `apps/web/.env`:

```bash
cp apps/web/.env.example apps/web/.env
```

Open `apps/web/.env` and add your Project ID:

```env
SANITY_PROJECT_ID=your-project-id-here
SANITY_DATASET=production
SANITY_API_VERSION=2024-01-01
```

**For the CMS** — Create `apps/studio/.env`:

```bash
cp apps/studio/.env.example apps/studio/.env
```

Open `apps/studio/.env` and add the same Project ID:

```env
SANITY_STUDIO_PROJECT_ID=your-project-id-here
SANITY_STUDIO_DATASET=production
```

### Step 4: Enable Sanity Mode

Open `apps/web/src/lib/data.ts` and change:

```typescript
export const USE_SANITY = true;
```

### Step 5: Migrate Your Content (Optional)

Want to use the existing sample content? Run the migration script:

1. Get a Sanity API token:
   - Go to [sanity.io/manage](https://sanity.io/manage) → Your Project → API
   - Click **"Add API token"**
   - Name it "Migration" with **Editor** permissions
   - Copy the token

2. Run the migration:

```bash
SANITY_TOKEN=your-token-here pnpm migrate
```

Or validate first (recommended):

```bash
SANITY_TOKEN=your-token-here pnpm migrate:validate
```

The script automatically reads `SANITY_PROJECT_ID` from `apps/web/.env` and uploads all content from `apps/web/src/content/` to your Sanity project, including images.

**Full seed (one document per content type):** To clear Sanity and repopulate with exactly one document per collection (team, work, services, posts, legal), run:

```bash
SANITY_TOKEN=your-token-here pnpm run seed:all
```

This deletes all existing documents of each type (in batches), removes any leftover documents with the same IDs, waits a few seconds for mutations to apply, then creates one document per collection from the content in `apps/web/src/content/`. Use this for a clean template-friendly state in Studio.

### Step 6: Start Development

```bash
pnpm dev
```

This starts:

- **Website** → http://localhost:4321
- **Sanity Studio (CMS)** → http://localhost:3333

### Step 7: Add Content in Studio

1. Go to http://localhost:3333
2. Create or edit content (posts, team members, etc.)
3. Click **Publish** so updates show up on http://localhost:4321

---

## Switching Between Data Sources

The `USE_SANITY` flag in `apps/web/src/lib/data.ts` controls the data source:

```typescript
// Use Sanity CMS
export const USE_SANITY = true;

// Use Content Collections (markdown files)
export const USE_SANITY = false;
```

Both options use the same components and layouts — just different data sources.

---

## Project Structure

```
/
├── apps/
│   ├── web/              # Your Astro website
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── layouts/
│   │   │   ├── lib/sanity/  # Sanity integration
│   │   │   ├── pages/
│   │   │   └── styles/
│   │   └── .env.example
│   │
│   └── studio/           # Sanity CMS
│       ├── schemas/      # Content models
│       └── .env.example
│
├── scripts/              # Utility scripts (migrations, cleanup)
├── pnpm-workspace.yaml
└── package.json
```

---

## Content Types

### Team Members

- Name, role, intro
- Education and experience (arrays)
- Avatar image with alt text
- Markdown body content

### Work Items

- Work description, link, company, year, client
- Credits (team members with roles)
- Thumbnail image with alt text
- Optional markdown body content

### Services

- Service name and description
- Markdown body content

### Blog Posts

- Title, description, author
- Cover image with alt text
- Publish date
- Tags for categorization
- Markdown body content

### Legal Pages

- Page title (Privacy, Terms, etc.)
- Last updated date
- Markdown body content

---

## Website Routes

| URL                  | Page            |
| -------------------- | --------------- |
| `/`                  | Homepage        |
| `/team`              | Team listing    |
| `/team/[slug]`       | Team member     |
| `/work`              | Work listing    |
| `/work/[slug]`       | Work item       |
| `/services`          | Services listing|
| `/services/[slug]`   | Service detail  |
| `/blog`              | Blog listing    |
| `/blog/posts/[slug]` | Blog post       |
| `/blog/tags`         | All tags        |
| `/blog/tags/[tag]`   | Posts by tag    |
| `/legal/[slug]`      | Legal pages     |
| `/contact`           | Contact page    |
| `/rss.xml`           | RSS feed        |

---

## Deployment

### Deploy the Website

**Vercel (recommended):**

```bash
cd apps/web
npx vercel
```

**Netlify:**

```bash
cd apps/web
npx netlify deploy --prod
```

Add these environment variables in your hosting dashboard:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_VERSION`

### Deploy the CMS

Deploy to Sanity's free hosting:

```bash
cd apps/studio
pnpm deploy
```

You'll get a URL like `https://your-project.sanity.studio`

---

## Customization

### Styling

Edit `apps/web/src/styles/global.css` for global styles. This theme uses Tailwind CSS v4.

### Adding New Content Types

1. Create schema in `apps/studio/schemas/`
2. Register in `apps/studio/schemas/index.ts`
3. Add to `apps/studio/structure.ts`
4. Create query in `apps/web/src/lib/sanity/queries.ts`
5. Add types in `apps/web/src/lib/sanity/types.ts`

---

## Troubleshooting

### "Cannot find module" errors?

Run `pnpm install` in the project root to reinstall dependencies.

### Content not showing?

- Make sure you clicked **"Publish"** in Sanity Studio
- Check that your Project ID is correct in both `.env` files
- Verify your dataset name matches (default: `production`)

### "Failed to fetch" error?

- Your Project ID might be wrong
- Go to [sanity.io/manage](https://sanity.io/manage) and verify the ID

### Images not loading?

- Images must be uploaded directly to Sanity
- Check that your image fields have the required `asset` data

### CORS errors?

- Go to [sanity.io/manage](https://sanity.io/manage) → Your Project → API → CORS Origins
- Add `http://localhost:4321` for development
- Add your production URL for deployment

---

## Useful Commands

| Command                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `pnpm install`         | Install all dependencies                       |
| `pnpm dev`             | Start website + CMS                            |
| `pnpm dev:web`         | Start website only                             |
| `pnpm dev:studio`      | Start CMS only                                 |
| `pnpm build`           | Build both for production                      |
| `pnpm migrate`         | Migrate content to Sanity                      |
| `pnpm migrate:validate`| Validate migration without uploading           |
| `pnpm migrate:dry-run` | Preview what would be migrated                 |
| `pnpm run seed:all`    | Clear Sanity and seed one document per collection |
| `pnpm clean`           | Remove node_modules/.env/dist before packaging |

---

## Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lexington Themes](https://lexingtonthemes.com)

---

## License

MIT — Use freely for personal and commercial projects.
