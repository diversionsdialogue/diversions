# REKENREGELS-overzicht — de 4 calculators

Naslag van de rekenregels zoals ze **nu in de live componenten** staan
(`apps/web/src/components/calculators/`). Bij twijfel is de component leidend, niet de
`Calculator-config-*.json`. Alle bedragen zijn richtprijzen, **exclusief btw**.

Laatst bijgewerkt: 2026-06-22. Zie ook [`REKENMODULES.md`](../REKENMODULES.md) voor de
standaarden achter deze modules.

---

## 1. Pretest

Bron: [`PretestCalculator.astro`](../apps/web/src/components/calculators/PretestCalculator.astro) ·
config [`Calculator-config-pretest.json`](Calculator-config-pretest.json).
Basis-eenheid: **150 respondenten per groep**, 5 sessies bij kwalitatief.

**Tarieven:** platformbasis € 130 · € 2 p.p. (express) · € 4,50 per complete (kwanti) ·
surveybasis € 250 · begeleiding € 80/sessie · analyse € 200/sessie.

| Tier (keuze) | Formule | Baseline |
|---|---|---|
| **Direct** (Snel) | 130 + 2 × 150 × concepten + marge 250 | 1 concept = € 680 (2/3 → 980 / 1.280) |
| **Core** (Verdiepend, survey) | 250 + 4,50 × 150 × doelgroepen + marge 750 | 1 dg = € 1.675 |
| **Plus** (Verdiepend, kwali) | 250 + 4,50 × 150 × dg + 80×5 + 200×5 + marge 750 | 1 dg = € 3.075 |

> **Discrepantie:** de config kent een Smart Survey-opslag (€ 750), maar de live
> component rekent die niet door (surveybasis blijft € 250). Config en code lopen hier
> uiteen.

---

## 2. Campagne-effectonderzoek (effectmeting)

Bron: [`EffectmetingCalculator.astro`](../apps/web/src/components/calculators/EffectmetingCalculator.astro) ·
config [`Calculator-config-effectmeting.json`](Calculator-config-effectmeting.json).
€ 4,50 per respondent.

**Steekproef (N):**
- Alleen nameting (post): 400 + 150 × (doelgroepen − 1)
- Nul- én nameting (pre+post): 600 + 200 × (doelgroepen − 1)

**Overige posten:** tool € 250/meting (basis) of € 500/meting (smart) ·
metingen = 1 (post) of 2 (pre+post) · marge € 2.500 (post) / € 3.500 (pre+post) ·
combinatie interne data + € 1.000.

**Formule:** `marge + tool × metingen + 4,50 × N + (combinatie ? 1.000 : 0)`

**Baseline** (post, 1 dg, basis, geen combinatie): **€ 4.550**.

---

## 3. Customer Journey

Bron: [`CustomerJourneyCalculator.astro`](../apps/web/src/components/calculators/CustomerJourneyCalculator.astro) ·
config [`Calculator-config-customer-journey.json`](Calculator-config-customer-journey.json).
Marge zit verwerkt in de basis + stuktarieven (geen aparte margepost).

**Steekproef:** kwanti 1/2/3 doelgroepen = 400/550/700 · kwali = 7/12/16 interviews.
Bij "Zelf aanleveren" rekent de calculator met 1 doelgroep (veld verborgen).

**Tarieven:** basis € 3.000 · doorlopend + € 6.000 · werving kwanti € 4,50 p.p. ·
werving kwali € 100/interview · interview € 200/stuk · survey-tooling € 250/dg
(traditioneel) of € 500/dg (smart) · handling eigen database € 250.

**Posten (opgeteld):**
- Basis € 3.000 (altijd) + € 6.000 als doorlopend
- Survey/Combi: tooling (€ 250 of € 500) × doelgroepen; + werving € 4,50 × kwanti-N **als werven**
- Kwali/Combi: interviews € 200 × kwali-N; + werving € 100 × kwali-N **als werven**
- "Zelf aanleveren": + € 250 handling (vervangt werving)
- **Mix → geen prijs** (offerte op maat; toont `– –`)

**Voorbeelden:** Zelf/Survey/traditioneel/1 dg = € 3.500 · Werven/Combi/smart/2 dg =
€ 10.075 · idem doorlopend = € 16.075.

---

## 4. Klanttevredenheidsonderzoek

Bron: [`KlanttevredenheidCalculator.astro`](../apps/web/src/components/calculators/KlanttevredenheidCalculator.astro).
Alle bedragen all-in.

**Modules:** Klanttevredenheid € 1.500 (verplicht) · Toekomstwensen € 750 ·
Effectief communiceren € 750 · Concurrentiekracht € 750.

**Verdieping:** Smart survey + € 250 × aantal gekozen modules · Persoonlijke interviews
(7 stuks) + € 1.400.

**Frequentie:** doorlopend + € 3.500 (meethuis + dashboard).

**Formule:** `som modules + (smart ? 250 × #modules) + (interviews ? 1.400) + (doorlopend ? 3.500)`

**Baseline** (zelf aanleveren, eenmalig, alleen Klanttevredenheid): **€ 1.500**.

**Respondenten werven → geen prijs**; verwijst naar Doelgroeponderzoek en de knop
"Bereken indicatie" staat dan inactief.

---

## Aandachtspunten over de calculators heen

- **Verschillende respondent-aantallen.** Pretest = 150 per groep, effectmeting = 400+,
  customer journey = 400/550/700. Kan kloppen (ander onderzoekstype), maar bewust van zijn.
- **Smart survey wordt verschillend behandeld.** Effectmeting en customer journey
  verhogen de prijs bij smart; de pretest-component rekent het niet door (zie §1).
- **Mix / werving → geen prijs.** Customer journey (Mix) en klanttevredenheid (werven)
  tonen bewust geen richtprijs maar verwijzen naar maatwerk/Doelgroeponderzoek.
