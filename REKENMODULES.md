# REKENMODULES.md — standaarden voor prijscalculators

Hoe we interactieve prijscalculators ("rekenmodules") bouwen op de Diversions-
site. Vastgelegd zodat elke nieuwe module dezelfde uitgangspunten, stijl en
techniek volgt. Eerste module: de **pretest-calculator**. Geverifieerd tegen de
code (juni 2026).

Referentie-implementatie:
- Component: [`PretestCalculator.astro`](apps/web/src/components/calculators/PretestCalculator.astro)
- Kop/pitch: [`ServicePitch.astro`](apps/web/src/components/calculators/ServicePitch.astro)
- Trust-strip: [`TrustStrip.astro`](apps/web/src/components/global/TrustStrip.astro)
- Plaatsing: [`pages/services/[...slug].astro`](apps/web/src/pages/services/%5B...slug%5D.astro) + [`ServicesLayout.astro`](apps/web/src/layouts/ServicesLayout.astro)
- Bronwaarheid logica/copy: [`calculator/`](calculator/) (`Bouwspecificatie ...md` + `Calculator-config-*.json`)
- Ontwerp: `new design/Offertespecs/` (Variant A: stappen-rail + lichte prijsbalk)

---

## 1. Uitgangspunten (principes — gelden voor elke rekenmodule)

1. **Rekentechniek = bronwaarheid in een config.** Tarieven, tiers, formules en
   copy komen uit een `Calculator-config-<naam>.json` in `calculator/`. De
   component implementeert die config; verzin geen bedragen in de UI.
2. **Leveranciersnamen NOOIT tonen.** Panelpartner, kwali-platform, surveytool
   e.d. blijven intern. In de code: neutraal benoemde tariefconstanten (geen
   merknamen), en geen inkoop-breakdown in de UI. Alleen de eindprijs + neutrale
   "wat je krijgt"-tekst.
3. **Respondenten altijd via ons panel.** Geen klantkeuze over werving.
4. **Prijs is een richtprijs, geen offerte.** Toon dat expliciet ("excl. btw ·
   richtprijs") met een disclaimer.
5. **Geen externe dependencies, geen localStorage.** De module werkt standalone
   met vanilla JS.
6. **NL-notatie, exclusief btw.** `Intl.NumberFormat("nl-NL")`, formaat `€ 1.675`.
7. **Bekende default toont meteen een prijs.** Is de eerste keuze al volledig
   bepaald (zoals "Snel"), toon dan direct de richtprijs. Is de prijs nog
   onbekend (er volgen nog keuzes), toon `– – –` en laat de primaire knop
   "Bereken indicatie" worden die naar de volgende stap leidt.
8. **Toegankelijk.** Echte `<button>`/`<input>`/`<select>`, `aria-pressed`/
   `aria-live` waar relevant, zichtbare focus, werkt met toetsenbord.

---

## 2. Technische standaard

- **Astro-"island" zonder framework.** Server-gerenderde HTML-schil + één vanilla
  `<script>` voor de interactie. Geen React/Vue/Svelte (de site heeft géén
  framework-integratie en de eis is "zonder dependencies").
- **State in een gewoon JS-object** in de `.qcalc`-scope; render-functies werken
  het DOM bij. Eén `forEach(".qcalc")` zodat de module meerdere keren op een
  pagina kan staan.
- **Gedeelde styling:** importeer [`styles/calculators.css`](apps/web/src/styles/calculators.css)
  (`import "@/styles/calculators.css";`) i.p.v. de stijl per component te
  dupliceren. Alle `.qcalc`/`.qc-*`-klassen staan daar; de component bevat alleen
  markup + script.
- **Sitetokens uit `global.css`** (kleuren, radius, schaduw, fonts) — identiek aan
  `colors_and_type.css`. Nooit hardcoden. Let op: `--color-pink-200` ís de
  butter-tint, `--primary` is terracotta, `--color-accent-400` is sage.
- **Responsief via container queries, niet viewport.** De calculatorkaart zit
  binnen padding + de afgeronde site-"surface", dus hij is veel smaller dan de
  viewport. Schakel kolommen op **kaartbreedte** (`container: ... / inline-size`
  + `@container`). Viewport-breakpoints knijpen het prijsblok kapot.
- **Prijs altijd zichtbaar:** desktop = sticky **zijpaneel**; mobiel = sticky
  **balk onderaan** (in beide stappen). Eén `[data-price]`-update vult beide.
- **Beeld via `<Picture>`** (AVIF/WebP), zie [`DATALAAG-SANITY-ASTRO.md`] en
  `scripts/optimize-public-images.mjs`.

> **Valkuil (echt gebeurd):** Astro **scoped CSS geldt niet voor HTML die je via
> `set:html` of `innerHTML` injecteert** (geen scope-attribuut). Geef geïnjecteerde
> SVG's daarom inline `width`/`height`/`color` mee, of render statisch in de
> markup en toggle met `hidden`. Idem voor child-componenten: gebruik
> `.parent :global(img)` om een `<img>` uit `<Picture>` te stylen.

---

## 3. Prijsmodel-conventies

- **n = 150 respondenten per groep** is de basis-eenheid.
- **Schaalfactor per pad** vermenigvuldigt de respondentkosten:
  - *Snel* schaalt met **aantal concepten** (1–3) — elk concept = 150 resp.
  - *Verdiepend* schaalt met **aantal doelgroepen** (1–3) — elke doelgroep = 150 resp.
- **Vaste delen** (platform, surveybasis, interviewkosten, marge) schalen niet mee.
- **Baseline blijft stabiel.** Bij factor 1 mogen de "bekende" richtprijzen niet
  veranderen als je het model uitbreidt.

Pretest-formules (tarieven uit de config, neutraal benoemd):

```
Direct (snel)        = platformBasis(130) + 2 × 150 × concepten + marge(250)
Core  (verdiepend/survey) = surveyBasis(250) + 4,5 × 150 × doelgroepen + marge(750)
Plus  (verdiepend/kwali)  = surveyBasis(250) + 4,5 × 150 × doelgroepen
                            + 80 × 5 + 200 × 5 + marge(750)
```

Baseline (1): **€ 680 / € 1.675 / € 3.075**. Concepten 1/2/3 → 680/980/1.280.

---

## 4. UX/flow-standaard (gestapte offerte-starter)

- **Witte kaart op de sage merkband** (ServicePitch levert de band + kop + foto +
  trust-strip; de calculator zit in de `above`-slot). De kaart draagt een
  **stappen-rail** (Voorkeur → Onderzoek → Bestellen).
- **Stap 1 — Voorkeur:** keuzekaarten (radio + checkmark-bullets) + "Bereken
  indicatie". Prijspaneel staat er al naast (default-prijs of `– – –`).
- **Stap 2 — Samenstellen:** expert-kaart, padspecifieke keuzes (bv.
  Survey/Kwalitatief), de schaalfactor-select (concepten/doelgroepen), infoblok.
- **Terug kunnen:** expliciete "Vorige stap"-knop (ook in stap 3).
- **Twee acties in de prijs:** primair "Direct bestellen", secundair "Advies
  aanvragen". Beide leiden naar **stap 3 — Bestellen**: een samenvatting van
  de keuzes/prijs + een contactformulier (bedrijf, naam, e-mail, telefoon
  optioneel, AVG-akkoord, bericht optioneel). Submit post naar de gedeelde
  n8n-webhook (zie §6.6) én dispatcht nog steeds een
  `CustomEvent("pretest-calculator:submit")` met
  `{ calculator, actie, keuzes, tier, richtprijs, richtprijsFormatted, samenvatting, ... }`
  voor eventuele analytics.

---

## 5. Plaatsing op een pagina

1. Calculator is een component in `components/calculators/`.
2. `ServicesLayout` heeft een `above`-slot (vóór de hero) en een `hidePageHero`-
   prop (de pitch draagt dan de paginatitel; geen dubbele hero).
3. In `pages/services/[...slug].astro` staat een `CALCULATOR_PAGES`-set: voeg een
   slug toe en de calculator (in `ServicePitch`) verschijnt boven de hero, met
   `hidePageHero`. Herbruikbaar op branchepagina's door de slug toe te voegen.
   (Promoveer dit later eventueel naar een Sanity-schemaveld.)

---

## 6. Stappenplan — een nieuwe rekenmodule bouwen

1. **Config schrijven** (`calculator/Calculator-config-<naam>.json`): tiers,
   tarieven (neutraal benoemd), formules, copy, guardrails, en de **verwachte
   uitkomsten** (acceptatietabel).
2. **Ontwerp ophalen** uit `new design/` (of Claude Design) en de sitetokens
   matchen.
3. **Component bouwen** o.b.v. de referentie-implementatie: state, `priceFor()`,
   render-functies, stappen, prijspaneel + sticky balk, payload-hook.
4. **Plaatsen** via `CALCULATOR_PAGES` + `ServicePitch` (§5).
5. **Verifiëren tegen de acceptatiecriteria:**
   - [ ] Alle prijsuitkomsten uit de config kloppen exact.
   - [ ] Velden verschijnen/verdwijnen correct per keuze (progressive disclosure).
   - [ ] Prijs + knoplabel updaten live; onbekende prijs = `– – –` + "Bereken indicatie".
   - [ ] Beide knoppen met een werkende payload-hook.
   - [ ] Geen leveranciersnamen in de gerenderde output.
   - [ ] NL-notatie, "excl. btw" vermeld.
   - [ ] Responsief op kaartbreedte (container queries); sticky balk op mobiel.
   - [ ] `pnpm build:web` schoon; getoetst op desktop én mobiel.
6. **Koppeling** (formulier/CRM/e-mail): stap 3 ("Bestellen") verzamelt
   bedrijf/naam/e-mail/telefoon/bericht + AVG-akkoord en post naar één
   gedeelde n8n-webhook (`PUBLIC_CALCULATOR_WEBHOOK_URL`), met het
   `calculator`-veld als router. Zie
   [`n8n/README-offerte-calculators.md`](n8n/README-offerte-calculators.md) +
   [`n8n/offerte-calculators.workflow.json`](n8n/offerte-calculators.workflow.json)
   en de gedeelde client-helper
   [`apps/web/src/scripts/submitCalculatorLead.ts`](apps/web/src/scripts/submitCalculatorLead.ts).
   Een nieuwe rekenmodule hergebruikt dit patroon i.p.v. het opnieuw te bouwen.

---

_Zie ook: [`CLAUDE.md`](CLAUDE.md) §4 (blok-API), [`AGENTS.md`](AGENTS.md),
[`DATALAAG-SANITY-ASTRO.md`](DATALAAG-SANITY-ASTRO.md)._
