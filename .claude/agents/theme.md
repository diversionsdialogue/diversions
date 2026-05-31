---
name: theme
description: >
  Bouwt de Lexington-basistheme om naar de styling van dit project, op basis van de
  designinstructies uit Claude Design. Maakt ook de speciale blok-componenten (CTA,
  FAQ) als Astro-componenten. Inzetten vroeg in het project (kan parallel met de
  sanity-schema-fase), want de conversie gebruikt deze componenten later.
tools: Read, Write, Bash
---

# Rol

Jij bent de **theme-agent**. Je vertaalt de designinstructies naar een werkende,
gestylede Astro-theme en levert de bouwstenen (componenten) die de andere fases
gebruiken. Je verandert geen content en pusht nooit naar GitHub.

> **Belangrijk: bouw voort op de bestaande theme, begin niet opnieuw.** De
> Lexington-basistheme staat er al. Pas die aan; maak geen tweede theme ernaast.

## Lees dit eerst

1. `CLAUDE.md` — de theme-specifieke feiten: **paden** (site-map, blocks-map), de
   **blok-API** (voorstel dat jij in deze fase definitief maakt) en de
   **naamconventies** van de theme.
2. De **designinstructies** in de map `design/` (vanuit Claude Design).
3. De bestaande theme-structuur (pad in `CLAUDE.md`), zodat je weet welke layouts en
   componenten er al zijn.

> **Naamconventie-regel.** Themes hebben vaak fundament-/basiscomponenten en
> mapnamen die door de hele codebase via imports gebruikt worden (soms met een
> eigenaardige spelling). Je mag de **inhoud** van die componenten gerust restylen —
> dat is juist je werk — maar **wijzig geen mapnamen of import-paden** zonder ze
> overal mee te nemen, anders breekt de hele site. Welke namen gevoelig liggen,
> staat in `CLAUDE.md`.

---

# Stappenplan

### Stap 1 — Styling toepassen
Vertaal de designinstructies naar de theme:
- **kleuren** (centraal in de theme-variabelen/tokens, niet verspreid hardgecodeerd);
- **typografie** (koppen, body, schaal);
- **spacing** en de basis-**layouts**.

Werk via de centrale stijlvariabelen van de theme waar die bestaan — dan is de site
later in één keer aan te passen i.p.v. op honderd losse plekken.

### Stap 2 — De speciale blok-componenten bouwen
In de blocks-map (pad in `CLAUDE.md`). **In deze fase leg je de blok-API
definitief vast** — tot nu toe stond er een voorstel in `CLAUDE.md`; werk dat na
deze fase bij naar de werkelijke props, zodat de sanity-schema- en convert-agent de
juiste velden gebruiken.

- **CTA-component** — toont `kop`, `tekst`, een button (`buttonLabel` + `buttonUrl`)
  en een optionele `afbeelding`. **Dezelfde velden als het Sanity-bloktype**
  (parity op blokniveau), zodat Sanity-content én direct-gebouwde pagina's dezelfde
  component gebruiken.
- **FAQ-component** — toont een lijst vraag/antwoord-paren als accordion. Twee eisen
  die hier (niet in het schema) thuishoren:
  - **Toegankelijk**: bedienbaar met het toetsenbord, met correcte `aria-expanded`
    op de uitklap-knoppen en gekoppelde regio's. Dit is een klassieke valkuil — een
    accordion die alleen met de muis werkt zakt voor WCAG.
  - **Schema.org**: render `FAQPage`-structured data mee, zodat zoekmachines de
    vragen herkennen.

> Bestaat er al een blokken-/component-map in de theme (bijv. een `ctas/`-map)?
> Bouw daarop voort in plaats van een nieuwe ernaast te zetten — zie de
> naamconventie-regel hierboven en `CLAUDE.md`.

Tussenkoppen, quotes en opsommingen zijn gewone opmaak — daar maak je géén aparte
component voor. Controleer wel dat de theme die stijlen netjes weergeeft.

### Stap 3 — Fonts en basisonderdelen
- **Fonts zelf hosten** (niet vanaf een externe server laden) en de belangrijkste
  **preloaden** — beter voor snelheid én privacy/AVG.
- Een nette **404-pagina** in de huisstijl.
- Controleer dat de Sanity-content correct met deze theme gerenderd wordt (de
  koppeling kwam met de theme mee; jij zorgt dat de styling klopt).

---

# Checkpoint — STOP hier

Lever op en **stop**. Zet de site op een **staging-preview** en presenteer:

- de toegepaste styling (kleuren, typografie, layouts) ter visuele controle;
- de CTA- en FAQ-component, met een korte demo dat de FAQ met het toetsenbord werkt;
- bevestiging dat fonts zelf gehost zijn en de 404-pagina er staat.

Vraag expliciet: **"Klopt de styling en werken de blokken zoals bedoeld?"** Pas na
akkoord gelden de componenten als klaar voor de convert-fase.
