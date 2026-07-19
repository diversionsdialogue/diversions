# Datalaag: Sanity ↔ Astro (Diversions)

Hoe de content door de site stroomt, waar je moet zijn, en de valkuilen die echt
bijten. Geverifieerd tegen de code (juni 2026). Aanvulling op `CLAUDE.md` §2 en
`AGENTS.md`; herhaalt die niet.

---

## 1. De schakelaar: één vlag bepaalt de bron

`apps/web/src/lib/data.ts` exporteert `USE_SANITY`.

- `true`  → de site leest uit **Sanity** (GROQ-query's, live dataset).
- `false` → de site leest uit **Astro Content Collections** (de `.md` in
  `apps/web/src/content/`).

**Stand nu: `true`.** Wat je op de draaiende site ziet komt dus uit Sanity, niet
uit de markdown. Een `.md` aanpassen verandert de site pas als die wijziging ook
in Sanity staat (zie §5).

Alle pagina's halen content op via de functies in `data.ts`
(`getAllServices`, `getAllWorkItems`, `getAllPosts`, ...). Die functies bevatten
de `if (USE_SANITY)`-splitsing, zodat geen enkele pagina weet welke bron actief
is. Patroon:

```ts
export async function getAllServices() {
  if (USE_SANITY) {
    const data = await fetchSanity<SanityService[]>(getAllServicesQuery);
    return data.map(transformService);   // Sanity-vorm → uniforme vorm
  }
  return await getCollection("services"); // Content Collections
}
```

---

## 2. De uniforme vorm (waarom pagina's bron-agnostisch zijn)

`transforms.ts` zet een Sanity-document om naar **dezelfde vorm** als een
Content-Collections-item, zodat de pagina-templates voor beide bronnen werken.
Elk item heeft:

| Veld | Betekenis |
|---|---|
| `id` | Sanity `_id` (bv. `service-onderzoeksbureau-reclame`) |
| `slug` | schone URL-slug (zie §6) |
| `body` | **Portable Text-array** (géén markdown-string!) |
| `collection` | `"services"` \| `"work"` \| ... |
| `data` | de overige velden (`service`, `description`, `categories`, `seo`, ...) |

Templates gebruiken dus `item.data.service`, `item.slug`, `item.body` — ongeacht
de bron.

---

## 3. Waar woont wat

| Laag | Pad |
|---|---|
| Vlag + ophaalfuncties | `apps/web/src/lib/data.ts` |
| Sanity-client (CDN, perspective) | `apps/web/src/lib/sanity/client.ts` |
| Fetch-wrapper (+ fallback) | `apps/web/src/lib/sanity/fetch.ts` |
| GROQ-query's | `apps/web/src/lib/sanity/queries.ts` |
| Sanity-vorm → uniforme vorm | `apps/web/src/lib/sanity/transforms.ts` |
| TypeScript-types van de Sanity-respons | `apps/web/src/lib/sanity/types.ts` |
| Beeld-URL-builder | `apps/web/src/lib/sanity/image.ts` |
| Portable Text → platte tekst | `apps/web/src/lib/sanity/portableText.ts` |
| Portable Text → HTML/componenten | `apps/web/src/components/global/PortableText.astro` |
| Sanity-schema's (Studio) | `apps/studio/schemas/` |
| Env (project-id, token) | `apps/web/.env` |

---

## 4. Body = Portable Text, niet markdown

Het `body`-veld is een **array van Portable-Text-blokken**, niet een tekst.
`PortableText.astro` rendert het:

- **Standaardknopen** (paragraaf, kop, lijst, marks, inline-afbeelding) →
  via `@portabletext/to-html` naar HTML.
- **Custom blokken** (`faqBlock`, `ctaBlock`, `videoBlock`, `noticeBlock`,
  `quoteBlock`, ...) → elk door een **Astro-component** in
  `apps/web/src/components/blocks/`. De volgorde blijft exact behouden.

De blok-API (props per blok) staat in `CLAUDE.md` §4 en moet 1-op-1 gelijk zijn
aan de Sanity-bloktypes (parity op blokniveau).

> **a11y/SEO zit in de component, niet in het schema.** Voorbeeld: `Faq.astro`
> rendert zelf de `FAQPage` JSON-LD en regelt open/dicht via het `hidden`-
> attribuut. Het `faqBlock`-schema bevat alléén de data (`items[]`,
> `question`, `answer`).

### GROQ-projectie van body

`queries.ts` heeft één gedeelde `bodyProjection` die asset-referenties binnen de
body dereferencet (inline-afbeeldingen, CTA/video-posters). Houd die in parity
over `post` / `service` / `workItem`.

---

## 5. Content in Sanity krijgen

Bron-markdown → Sanity gaat via `scripts/`:

- `migrate-to-sanity.ts` — leest alle `.md` uit `content/`, converteert de body
  naar Portable Text en schrijft naar Sanity. Commando's: `pnpm migrate`,
  `:validate`, `:dry-run`, `seed:all`.
- `markdown-to-portable-text.ts` — de offline converter. Herkent markers uit de
  voorbewerking (`:::faq`, `:::cta`, `[EMBED ...]`, ...) en bouwt de echte
  bloktypes. **Stript HTML-comments** (`<!-- ... -->`).

> ⚠️ **`pnpm migrate` is grof.** Het doet `createOrReplace` op **álle** documenten
> van een type én neemt `slug` en `categories` **niet** mee. Draai je het zomaar,
> dan overschrijf je handmatige Studio-edits en verdwijnen tags/slugs. **Voor één
> losse pagina: schrijf een gericht seed-script** dat alleen dat ene `_id` raakt
> (zie `scripts/seed-branche-communicatie.ts` als voorbeeld) of patch alleen het
> bedoelde veld met `client.patch(id).set({...})`.

Schrijven vereist een `SANITY_TOKEN` (Editor-rechten) in `apps/web/.env`.

---

## 6. Slugs en routing

- Detailroutes gebruiken `getStaticPaths()` met `params: { slug }` uit de
  ophaalfunctie. Bv. `apps/web/src/pages/services/[...slug].astro` →
  `/services/<slug>`.
- De slug komt uit `transforms.ts → deriveSlug()`: **een expliciet `slug`-veld**
  als dat er is, anders **afgeleid door het `<type>-`-prefix van het `_id` te
  strippen**. `_id`-conventie: `${type}-${slug}` (bv.
  `service-onderzoeksbureau-reclame` → slug `onderzoeksbureau-reclame`).
- Zet bij een nieuw seed-script dus zowel een consistent `_id` als een expliciet
  `slug`-object (`{ _type: "slug", current: "..." }`).

### Paginatitel vs body

Op een services-detailpagina rendert `ServicesLayout.astro`:
`data.service` als `<h1>` en `data.description` als lead-paragraaf. De **body
begint dus bij de eerste inhoudssectie** (geen eigen H1 in de body, anders dubbel).

---

## 7. Valkuilen die echt bijten

1. **TLS in dev — "unable to verify the first certificate".** Een lokale
   root-CA (bedrijfsproxy/antivirus) onderschept TLS; Node vertrouwt standaard
   niet de Windows-certificaatstore. Fix: draai met `NODE_OPTIONS=--use-system-ca`
   (verificatie blijft aan). Voor de preview-server staat dit al in
   `.claude/launch.json`. Voor losse scripts moet je het zelf meegeven.

2. **CDN-staleness.** `client.ts` heeft `useCdn: true`. Na een schrijfactie naar
   Sanity serveert de dev-server nog even de **oude** versie uit de CDN-cache
   (eventual consistency, paar minuten). De data-API (`useCdn: false`) is direct
   correct — verifieer dáártegen, niet tegen de dev-pagina. Productiebuild leest
   bij het bouwen via de API.

3. **`perspective: "published"`.** De client haalt alleen gepubliceerde
   documenten. Drafts uit de Studio zie je niet op de site tot ze gepubliceerd zijn.

4. **HTML-comments in body.** De converter stript ze nu, maar oudere data kan
   resten bevatten (zichtbaar als tekst op de pagina). Detecteren/opschonen kan
   met `scripts/cleanup-comments-sanity.ts` (chirurgisch: patcht alleen `body` van
   documenten die nog `<!--`/`-->` bevatten).

5. **Parity-regel.** Een veld/type wijzigen raakt meerdere plekken tegelijk
   (`CLAUDE.md` §2): Studio-schema + `index.ts` + `structure.ts` + `queries.ts` +
   `types.ts`, plus de Zod-collectie en `transforms.ts`. Houd ze synchroon.

---

## 8. Snelle verificatie-recepten

Document rechtstreeks uit Sanity lezen (zonder CDN, met system-CA):

```bash
cd scripts
NODE_OPTIONS=--use-system-ca npx tsx -e "
import {createClient} from '@sanity/client';
import {config} from 'dotenv'; config({path:'../apps/web/.env'});
(async()=>{
  const c=createClient({projectId:process.env.SANITY_PROJECT_ID,dataset:'production',apiVersion:'2024-01-01',useCdn:false});
  console.log(await c.getDocument('service-<slug>'));
})();
"
```

Een gerenderde pagina checken op de dev-server (let op CDN-staleness):

```bash
curl -s "http://localhost:4321/services/<slug>" | grep -c '<zoekterm>'
```
