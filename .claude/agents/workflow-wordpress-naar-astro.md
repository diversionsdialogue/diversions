# Workflow: WordPress → Astro migratie met Claude Code

Een herbruikbaar draaiboek. Per nieuw migratieproject kopieer je dit document
naar de projectmap en pas je de projectspecifieke onderdelen aan (welke pagina's,
welke Sanity-types, welke formulieren). De structuur van de fases blijft gelijk.

**Stack:** Astro · Sanity CMS · GitHub · Ploi · Hetzner · n8n (formulieren) ·
basis-theme van Lexington Themes · designinstructies vanuit Claude Design.

---

## 1. Het kernidee in één alinea

We splitsen de oude WordPress-site in vier soorten content:
**direct bouwen in Astro**, **importeren naar Sanity**, **droppen**, of
**alleen redirecten**. Eén centraal bestand (het *inventaris-bestand*) houdt per
URL bij welke keuze is gemaakt en in welke fase die zit. Het werk gebeurt in
opeenvolgende fases; elke fase heeft een eigen gespecialiseerde subagent met
duidelijke input en output. Op vaste momenten stopt het proces voor een
menselijke controle. Pas aan het einde, na een volledige scan en jouw akkoord,
gaat er iets naar GitHub.

---

## 2. Kernprincipes (waarom de opzet zo is)

- **Eén gedeelde context (`CLAUDE.md`).** In de projectroot staat een
  `CLAUDE.md` met de stack, de mapstructuur, de afspraken over blokken en de
  API van de componenten. Elke subagent leest deze eerst, zodat iedereen vanuit
  dezelfde afspraken werkt.
- **Eén centraal inventaris-bestand.** Alle fases lezen en schrijven naar
  hetzelfde bestand (`inventaris.json`). Dat voorkomt dat agents langs elkaar
  heen werken en het is later de bron voor je redirects.
- **Fases zijn meestal sequentieel.** Je kunt redirects pas bepalen als de
  content staat. Alleen losse, onafhankelijke taken (beeldoptimalisatie,
  blokdetectie per artikel) mogen parallel.
- **Incrementeel committen.** Na elke fase een commit op een *aparte branch* (nog
  niet naar productie). Gaat een agent de fout in, dan kun je terug.
- **Human-in-the-loop op meerdere momenten**, niet alleen aan het eind: na de
  intake, na de contentconversie, na de SEO-beslissingen, na de formulierentest,
  en vlak voor de push.

---

## 3. Projectstructuur

> **Belangrijk: de structuur van de theme staat niet vast en verschilt per theme.**
> De ene theme is één Astro-project met `src/` in de root; de andere is een
> *monorepo* met meerdere apps (bijv. `apps/web` voor de site en `apps/studio` voor
> de Sanity Studio). Daarom legt dit document **geen vaste mappenboom** op. De
> werkelijke opbouw wordt in **Fase 0a** uitgelezen en vastgelegd in `CLAUDE.md`;
> alle agents lezen de paden daarvandaan. Zo blijft dit proces bruikbaar voor elke
> theme zonder het document te verbouwen.

Er zijn twee soorten mappen, met een duidelijke scheiding:

**Wat de theme meelevert (raak je niet zelf aan, dit verschilt per theme):**
- de Astro-site (de `src/` — in de root óf in bijv. `apps/web/`);
- het Sanity-deel (de schema's — bijv. in `apps/studio/`);
- `package.json`, configuratie en eventueel een eigen contextbestand zoals
  `AGENTS.md`.

**Wat jij toevoegt in de projectroot (dit is voor elke theme gelijk):**

```
project-root/                  # het niveau waar de theme staat (bij monorepo: waar apps/ staat)
├── CLAUDE.md                  # gedeelde context: paden, content-model, werkregels (zie Fase 0a)
├── inventaris.json            # het centrale inventaris-/manifestbestand
├── .claude/
│   └── agents/                # de subagent-definities (let op de punt; zie §9)
├── scripts/                   # Python-scripts
│   ├── wxr_naar_contentbron.py  # WXR-export -> schone MD + inventarissen (Fase 0b)
│   ├── afbeeldingen.py          # downloadt afbeeldingen + herschrijft paden (Fase 0b)
│   └── naar-sanity-ndjson.py    # MD -> NDJSON voor Sanity (Fase 3, route B2)
├── content-bron/              # gegenereerd door Fase 0b: opgeschoonde WP-export (MD) + inventarissen
├── design/                    # designinstructies vanuit Claude Design
└── n8n/                       # geëxporteerde n8n-workflows (JSON, als backup)
```

> De concrete paden naar de site, de schema's en de blok-componenten staan dus
> **niet** hardgecodeerd in dit document of in de agents, maar in `CLAUDE.md`. Een
> agent zegt "kijk in de studio-map zoals vastgelegd in `CLAUDE.md`", niet "kijk in
> `apps/studio/`".

---

## 4. Het besliscriterium: waar hoort elk stuk content?

Voor elke pagina/bericht uit de oude site beantwoord je drie vragen:

1. **Volgt het een herhalend sjabloon?** (zoals blogs en cases die op elkaar lijken)
2. **Hoe vaak verandert het na oplevering?**
3. **Moet een niet-technische beheerder erbij kunnen?**

| Uitkomst | Bestemming |
|---|---|
| Uniek, zelden gewijzigd, alleen jij beheert het (homepage, over-ons, losse landingspagina) | **Direct in Astro bouwen** |
| Herhalend sjabloon en/of de klant beheert het (blog, cases, nieuws) | **Naar Sanity** |
| Verouderd, dunne content, geen verkeer én geen backlinks | **Droppen** (met redirect naar relevant alternatief) |
| Oude URL die je niet behoudt maar wel waarde/verkeer had | **Alleen redirect** |

> **Let op:** ook de direct-in-Astro-pagina's krijgen hun oude URL gelogd in het
> inventaris-bestand. Anders kloppen je redirects straks niet.

---

## 5. De speciale blokken

Astro kent geen merknaam zoals "Gutenberg blocks". Het zijn gewoon **componenten**.
Tussenkoppen, quotes en opsommingen zijn standaard Markdown — daar is geen apart
component voor nodig. Alleen deze twee zijn echte componenten:

- **CTA-blok** — kop, tekst, button (label + link), optionele afbeelding.
- **FAQ-accordion** — vraag/antwoord-paren, mét toegankelijke toetsenbordbediening
  en `Schema.org`-structured data (`FAQPage`).

Deze blokken bestaan op **twee plekken**, met dezelfde velden/props (de
*parity*-gedachte op blokniveau):
- in **Sanity** als bloktypes (zodat de beheerder ze kan plaatsen), en
- als **Astro-componenten** in de blocks-map (zoals vastgelegd in `CLAUDE.md`),
  zodat de direct-gebouwde pagina's ze ook kunnen gebruiken én Sanity-content
  gerenderd wordt.

> **De blok-API is fase-afhankelijk.** De velden/props van CTA en FAQ liggen pas
> definitief vast nadat de theme-fase (Fase 1) de componenten heeft gebouwd. Tot dat
> moment staat in `CLAUDE.md` een *voorstel*-API; die wordt na Fase 1 bijgewerkt
> naar de werkelijke props. De sanity-schema- en convert-agent moeten daarom de
> blok-API uit `CLAUDE.md` lezen, niet uit hun eigen tekst.

---

## 6. Het centrale inventaris-bestand

Dit is het hart van de workflow. Eén regel per URL. Voorbeeld:

```json
[
  {
    "oude_url": "/over-ons/",
    "titel": "Over ons",
    "type": "pagina",
    "bestemming": "bouwen-in-astro",
    "nieuwe_url": "/over-ons/",
    "sanity_type": null,
    "seo": { "verkeer_12mnd": 540, "backlinks": 3, "keep_reden": "kernpagina" },
    "redirect_naar": null,
    "status": { "intake": "klaar", "build": "todo", "seo": "todo" },
    "notities": "Team-sectie later naar Sanity zodat klant zelf kan wijzigen"
  },
  {
    "oude_url": "/blog/generatie-z-op-de-werkvloer/",
    "titel": "Generatie Z op de werkvloer",
    "type": "bericht",
    "bestemming": "importeren-naar-sanity",
    "nieuwe_url": "/blog/generatie-z-op-de-werkvloer/",
    "sanity_type": "blogPost",
    "seo": { "verkeer_12mnd": 2100, "backlinks": 12, "keep_reden": "topartikel" },
    "redirect_naar": null,
    "status": { "intake": "klaar", "convert": "todo", "seo": "todo" },
    "notities": "Bevat 1 CTA-blok en een FAQ"
  },
  {
    "oude_url": "/oude-actie-2019/",
    "titel": "Zomeractie 2019",
    "type": "pagina",
    "bestemming": "alleen-redirect",
    "nieuwe_url": null,
    "sanity_type": null,
    "seo": { "verkeer_12mnd": 30, "backlinks": 0, "keep_reden": null },
    "redirect_naar": "/aanbod/",
    "status": { "intake": "klaar" },
    "notities": "Verlopen actie, redirect naar aanbod"
  }
]
```

Naast de pagina's houdt het inventaris ook een **formulierenlijst** bij (zie Fase 4)
en een **afbeeldingenlijst** (welke `wp-content/uploads`-bestanden opnieuw gehost
en geoptimaliseerd moeten worden).

---

## 7. De fases en hun subagents

Telkens: **rol → input → output → checkpoint**.

### Fase 0a — Theme-installatie & verkenning · *agent: handmatig + `intake`-verkenning*
De structuur van de theme is onbekend tot je hem hebt geïnstalleerd. Deze fase
maakt de rest van het proces theme-onafhankelijk. Drie stappen:

1. **Installeer de theme** volgens de instructies van de theme-maker en draai hem
   één keer lokaal, zodat je bevestigt dat zowel de site als de Studio werken. Bij
   een monorepo: let op of je dependencies één keer in de root installeert of per
   app (zie of er een `pnpm-workspace.yaml` of een `workspaces`-regel in de
   root-`package.json` staat).
2. **Verken de werkelijke opbouw.** Laat Claude Code de echte structuur uitlezen:
   waar staat de Astro-site, hoe heet de Sanity-app, bestaat er al een vast
   **content-model** (bijv. een set vaste documenttypes die de theme oplegt), en
   levert de theme al een **contextbestand** mee (zoals `AGENTS.md`)?
3. **Leg dit vast in `CLAUDE.md`.** Niet de feiten verspreiden over de agents, maar
   centraliseren in `CLAUDE.md`:
   - de **paden** (site-map, studio-map, blocks-map);
   - het **content-model** van de theme (welke types bestaan al, en — indien van
     toepassing — over welke bestanden die synchroon moeten blijven);
   - **naamconventies** die import-breed gebruikt worden en niet zomaar gewijzigd
     mogen worden (fundament-componenten e.d.);
   - de **werkregels** (zie §2).

> **Known-theme-profiel — sla verkenning over als de theme bekend is.** Stel bij de
> start één vraag: *gebruik je een theme waarvoor al een profiel bestaat?* (bijv.
> "Is dit een Lexington Astro+Sanity-theme?").
> - **Ja** → laad het bijbehorende profiel (bijv.
>   `theme-profiel-lexington-sanity.md`). Daarin staan de paden, naamconventies,
>   parity-koppeling en eventuele meegeleverde scripts al vast; je kunt stap 2
>   grotendeels overslaan en `CLAUDE.md` direct vullen uit het profiel. Verifieer
>   alleen de met ⚠️ gemarkeerde punten, want themes worden bijgewerkt.
> - **Nee** → doe stap 2 volledig. Heb je daarna een herbruikbare theme te pakken,
>   leg je bevindingen dan vast als nieuw profiel voor de volgende keer.
>
> Het proces zelf blijft hierdoor theme-onafhankelijk: de profielen leven náást het
> proces, niet erin.

> **Contextbestand-regel:** levert de theme al een `AGENTS.md` (of vergelijkbaar)?
> Maak dan een **dunne `CLAUDE.md`** die daarnaar verwijst en alleen de
> migratiespecifieke afspraken toevoegt — draai **geen** `/init` (dat zou de
> bestaande context dupliceren). Levert de theme niets mee, dan is `/init` een prima
> startpunt voor een eerste `CLAUDE.md`, dat je daarna aanvult.

- **Checkpoint:** `CLAUDE.md` bestaat, met kloppende paden, content-model en
  naamconventies. Alle volgende fases leunen hierop.

### Fase 0b - Voorbewerking: WXR naar content-bron · *scripts: `wxr_naar_contentbron.py` + `afbeeldingen.py`*
De intake (Fase 0) gaat uit van een al-opgeschoonde MD-export in `content-bron/`. Die
wordt hier geproduceerd, vóór de intake. Dit is bewust **scriptwerk, geen agent-werk**:
de WXR parsen, afbeeldingen downloaden en paden herschrijven is volledig
deterministisch. Een script doet dat in één keer, waar een agent honderden losse
acties zou orkestreren. Dat bespaart tokens en maakt je bovendien onafhankelijk van de
live oude site (die kan tijdens de migratie zomaar offline gaan).

1. **`wxr_naar_contentbron.py`** zet de WordPress-export (WXR/XML, mix van Gutenberg en
   Beaver Builder) om naar:
   - per bericht/pagina een schoon MD-bestand met frontmatter, ontdaan van
     Gutenberg-comments en builder-resten;
   - `inventaris-afbeeldingen.json`, verrijkt met de canonical (originele) URL en de
     alt-tekst uit de attachment-items;
   - `conversie-overzicht.json` (machine-leesbaar) en `verdacht-rapport.md` (voor
     menselijke controle).
   - Draaien: `python3 wxr_naar_contentbron.py export.xml --out content-bron --types post`,
     en apart met `--types page` voor pagina's.
2. **`afbeeldingen.py`** leest dat inventaris, downloadt de afbeeldingen op originele
   resolutie, dedupliceert, en herschrijft optioneel de paden in de MD naar een lokale
   map. Relatieve `../../wp-content/...`-paden worden opgelost tegen de pagina waarop ze
   stonden. Draaien op een machine mét internet (niet alle omgevingen mogen de oude site
   bereiken).

De speciale blokken (FAQ, accordion, herbruikbare blokken, embeds) worden hierbij als
tekstmarkers vastgelegd; de convert-agent (Fase 3) mapt die naar de echte bloktypes.
De markerconventie staat in `convert.md`.

> **Wantrouw de export, ook hier.** Berichten en pagina's gedragen zich verschillend:
> bij berichten zit de content meestal volledig in de gerenderde body, bij
> builder-zware pagina's niet altijd. Het script doet een body-vs-builder-data-check en
> markeert verdachte gevallen. Het `verdacht-rapport.md` lijst de aandachtspunten:
> drop-kandidaten (lege/zeer korte output), pagina's met mogelijk incomplete body,
> herbruikbare blokken die niet in de export zaten, gevonden Gravity Forms, en
> afbeeldingen zonder alt-tekst. Lees dit vóór de intake.

- **Checkpoint:** `content-bron/` staat klaar (schone MD + inventarissen +
  verdacht-rapport), afbeeldingen gedownload en paden herschreven. Hierop bouwt de
  intake voort.

### Fase 0 — Intake & inventarisatie · *agent: `intake`*
- **Rol:** de site in kaart brengen en alle beslissingen vastleggen.
- **Input:** de live WP-site (URL-lijst/sitemap), Google Search Console-data, de
  door Fase 0b geproduceerde `content-bron/` (MD + inventarissen + verdacht-rapport),
  de designinstructies.
- **Output:**
  - het gevulde `inventaris.json` (bestemming per URL volgens §4);
  - de **formulieren-inventaris**: welke formulieren bestaan er, welke velden, en
    waar gingen ze nu heen (Gravity Forms-notificaties/bestemmingen)?
  - de **afbeeldingen-inventaris**;
  - een eerste voorstel voor de **Sanity-documenttypes** (welke types, welke velden).
- **Checkpoint:** jij keurt het inventaris goed. Dit is de belangrijkste check —
  alles erna bouwt hierop voort.

### Fase 1 — Theme & design · *agent: `theme`*
- **Rol:** de Lexington-basistheme ombouwen naar jullie styling.
- **Input:** de basistheme, de designinstructies uit Claude Design, `CLAUDE.md`.
- **Output:** aangepaste kleuren, typografie, spacing en de basislayouts; de twee
  speciale blokken (CTA, FAQ) als Astro-componenten; zelf-gehoste fonts (preloaded);
  een 404-pagina.
- **Checkpoint:** visuele controle op een staging-preview.

### Fase 2 — Sanity-schema's ontwerpen · *agent: `sanity-schema`*
- **Rol:** de structuur van de CMS-content vastleggen. **Dit moet vóór het
  conversiescript** — het script kan pas naar Sanity schrijven als de vorm bekend is.
- **Input:** de documenttypes uit Fase 0, de blokdefinities.
- **Output:** Sanity-schema's voor elk type (bijv. `blogPost` en `case`). Ze delen
  de blokken (CTA, FAQ, quote) maar hebben eigen velden — een case heeft bijv.
  *klant*, *sector*, *resultaat*. Tekst wordt opgeslagen als **Portable Text**
  (Sanity's gestructureerde tekstformaat).
- **Beginner-tip:** houd de eerste schema-versie bewust klein. Velden toevoegen kan
  altijd; een te complex schema maakt zowel het script als het beheer onnodig zwaar.
- **Checkpoint:** korte review van de schema's.

### Fase 3 — Content omzetten · *agent: `convert`*
Twee routes, één opschoonbron.
- **Route A — direct in Astro:** de agent *herbouwt* deze pagina's met de oude
  content als referentie (niet machinaal geconverteerd), en plaatst waar nodig de
  blok-componenten.
- **Route B — naar Sanity:** een Python-script (`naar-sanity-ndjson.py`) zet de
  opgeschoonde export om naar een **NDJSON**-bestand dat Sanity kan importeren.
  Hiervoor bestaat een officiële hulp-tool, `@sanity/block-tools`, die HTML omzet
  naar Portable Text. Per artikel bepaalt de agent welke blokken (CTA, FAQ)
  ingevoegd worden.
- **Belangrijk:** afbeeldingen *in* de content wijzen naar `wp-content/uploads`.
  Die moeten gedownload, opnieuw gehost en de paden herschreven worden (sluit aan
  op Fase 6). Wantrouw de "schone" export: Elementor/BeaverBuilder laten vaak
  resten achter — neem handmatige steekproeven.
- **Output:** gevulde Astro-pagina's + geïmporteerde Sanity-documenten; statusveld
  in inventaris bijgewerkt.
- **Checkpoint:** steekproef van omgezette artikelen (klopt de opmaak, staan de
  blokken goed, missen er geen afbeeldingen?).

### Fase 4 — Formulieren & n8n-flows · *agent: `forms`*
- **Rol:** de formulieren werkend krijgen op de statische site.
- **Architectuur:** elk formulier stuurt zijn gegevens via `fetch` naar een
  **n8n-webhook** (een postbus-URL). n8n voert dan de flow uit: mail via Mailjet,
  wegschrijven naar Supabase, Zoho CRM bijwerken, bevestiging naar de invuller.
- **Input:** de formulieren-inventaris uit Fase 0.
- **Output:**
  - Astro-formuliercomponenten met validatie, succes-/foutmelding,
    **honeypot** (eenvoudige spambescherming) en een **AVG-consentvinkje**;
  - de **n8n-workflows**, aangemaakt via je n8n-connector óf gegenereerd als JSON
    voor import (een backup-export landt in `/n8n/`);
  - webhook-URL's opgeslagen als **omgevingsvariabelen** (niet hardgecodeerd).
- **Checkpoint (verplicht testen):** dien elk formulier één keer in en controleer
  dat de mail/CRM/database-actie echt gebeurt. Dit is het minst voorspelbare deel
  van de migratie — een stil kapot formulier kost leads zonder waarschuwing.

### Fase 5 — SEO · *agent: `seo-astro`*
- **Rol:** zoekverkeer behouden en verbeteren bij de overstap.
- **Output:**
  - **Keep/drop** bevestigen: niet alleen op verkeer sturen, maar ook op
    **backlinks** (weinig verkeer + goede backlinks = behouden of netjes
    redirecten); dunne content **samenvoegen** i.p.v. weggooien.
  - **Redirects** afleiden uit het inventaris. Plaats deze als **301 in de
    nginx-config op Ploi/Hetzner** (beter voor SEO dan in Astro zelf).
  - **Interne linkstructuur** bepalen.
  - **Meta-description, canonical, Open Graph/Twitter-tags** per pagina toevoegen.
  - **Structured data** breder dan FAQ: `Article`, `BreadcrumbList`, `Organization`.
  - **Sitemap** genereren voor Search Console.
  - **RSS-feed** behouden op dezelfde URL (als de oude blog die had — abonnees).
- **Checkpoint:** je controleert de redirect-lijst en de keep/drop-keuzes.

### Fase 6 — Kwaliteitschecks · *agent: `quality`*
- **WCAG (toegankelijkheid):** automatische tools (axe, Lighthouse, pa11y) vangen
  maar ~30-40%. Extra aandacht voor de **FAQ-accordion** (toetsenbord +
  `aria-expanded`) en **alt-teksten** (de WP-export mist ze soms; laten
  checken/genereren — goed voor a11y én SEO).
- **Afbeeldingen:** via Astro's ingebouwde beeldoptimalisatie (`astro:assets` →
  AVIF/WebP, responsive). Alle in Fase 3 opnieuw gehoste afbeeldingen hierdoorheen.
- **Snelheid:** grotendeels gratis bij Astro (stuurt standaard geen JavaScript mee).
  Lighthouse-controle als sluitstuk.
- **AVG:** checklist i.p.v. iets dat "opgelost" wordt — cookieconsent,
  analytics-keuze, privacyverklaring, consent op embeds (YouTube e.d.). Baken af
  wat je hier precies van de workflow verwacht.
- **Zoekfunctie (optioneel):** **Pagefind** is de standaard voor statische
  Astro-sites.
- **Checkpoint:** rapport van bevindingen, jij prioriteert wat nog moet.

### Fase 7 — Pre-launch scan & livegang · *agent: `prelaunch`*
- **Rol:** laatste totaalcontrole vóór de push.
- **Output:** scan op **broken links** en andere problemen over de hele site
  (intern + uitgaand), draaiend op de **staging-deploy van Ploi**; een
  go/no-go-rapport.
- **Human-in-the-loop:** jij geeft definitief akkoord.
- **Daarna:** push naar GitHub → deploy via Ploi naar Hetzner. **Na de cutover:**
  domein opnieuw verifiëren in Search Console, sitemap indienen, redirects
  steekproefsgewijs natrekken, `robots.txt` controleren.

---

## 8. Projectspecifieke aandachtspunten (vooraf afvinken)

- [ ] Theme geïnstalleerd en lokaal werkend (site + Studio).
- [ ] `CLAUDE.md` gemaakt met kloppende paden, content-model en naamconventies
      (dunne `CLAUDE.md` als de theme al een `AGENTS.md` heeft).
- [ ] Voorbewerking (Fase 0b) gedraaid: `content-bron/` met schone MD + inventarissen,
      afbeeldingen gedownload en paden herschreven, `verdacht-rapport.md` doorgenomen.
- [ ] Keuze per pagina vastgelegd in het inventaris (incl. oude URL's van
      Astro-pagina's).
- [ ] Content-model van de theme als gegeven genomen (geen overbodige nieuwe types).
- [ ] Formulieren-inventaris compleet en n8n-flows getest.
- [ ] 301-redirects op nginx/Ploi, niet in Astro.
- [ ] RSS-feed-URL behouden (indien aanwezig).
- [ ] `robots.txt`, 404-pagina, sitemap aanwezig.
- [ ] Fonts zelf gehost en preloaded.
- [ ] Search Console opnieuw geverifieerd na cutover.

---

## 9. Hoe je dit als Claude Code subagents opzet (kort)

In Claude Code definieer je elke subagent als een los bestand in
`.claude/agents/`, bijvoorbeeld `.claude/agents/seo-astro.md`. Bovenin staat een klein
blok met de naam en een omschrijving van wanneer de agent ingezet wordt; daaronder
de instructies (rol, input, output, checkpoint — precies wat hierboven per fase staat).

Eenvoudig voorbeeld van zo'n bestand:

```markdown
---
name: seo-astro
description: Bepaalt keep/drop, redirects, interne links en metadata na de conversie.
---

Je bent de SEO-agent. Lees eerst CLAUDE.md en inventaris.json.
Werk alleen aan items met bestemming 'importeren-naar-sanity' of 'bouwen-in-astro'.
Output: ... (zie Fase 5). Stop voor menselijke controle bij de redirect-lijst.
```

Eén **hoofdagent** (jij stuurt die aan vanuit de chat) roept de fase-agents in
volgorde aan en bewaakt de checkpoints. Begin klein: laat eerst alleen de
`intake`-agent draaien op een echte site voordat je de hele keten automatiseert.

**Over `CLAUDE.md`:** dit is het bestand dat Claude Code automatisch als eerste
leest. Maak het zoals beschreven in Fase 0a: levert de theme al een contextbestand
mee (`AGENTS.md` o.i.d.), maak dan een **dunne `CLAUDE.md`** die ernaar verwijst en
alleen de migratiespecifieke afspraken toevoegt (paden, content-model,
naamconventies, blok-API-voorstel, werkregels) — draai géén `/init`. Levert de theme
niets mee, dan is `/init` een prima eerste versie die je daarna aanvult. De agents
halen alle theme-specifieke feiten uit `CLAUDE.md`; zo blijft het proces zelf
theme-onafhankelijk.
