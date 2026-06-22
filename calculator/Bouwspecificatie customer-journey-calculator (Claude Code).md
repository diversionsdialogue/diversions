# Bouwspecificatie — customer-journey-calculator

Rekenmodule voor de customer-journey-dienst. Bronwaarheid voor tarieven en formules:
[`Calculator-config-customer-journey.json`](Calculator-config-customer-journey.json).
Volgt de standaard in [`REKENMODULES.md`](../REKENMODULES.md). Status: **uitgangspunten
vastgelegd, nog niet gebouwd.**

---

## 1. Flow (twee stappen)

**Stap 1 — Opzet**
1. **Respondenten** (buttons): Zelf aanleveren* / Respondenten werven / Mix
2. **Frequentie** (buttons): Eenmalig* / Doorlopend

**Stap 2 — Pakket**
3. **Onderzoekspakket** (cards): Survey* / Kwalitatief / Combi
4. **Smart Survey?** (buttons, alleen bij Survey of Combi): Traditionele survey* / Smart Survey
5. **Doelgroepen** (dropdown, alleen als respondenten ≠ Zelf aanleveren): 1* / 2 / 3

`*` = default. De prijs is vanaf stap 1 zichtbaar (de defaults geven een complete prijs).

---

## 2. Beslissingen (vastgelegd 2026-06-21)

- **Mix** → nooit een prijs; toon `– –` + "We stellen graag een offerte op maat voor je op."
  De 50/50-verdeelsleutel uit het oorspronkelijke voorstel is geschrapt uit de calculator.
- **Zelf aanleveren** → doelgroepen-veld verborgen, calculator rekent met **1 doelgroep**.
- **Doorlopend** → vaste **+€6.000** (meethuis met dashboard). Alle andere posten gelijk.
- **Marge** → zit in de basisprijs + de stuktarieven. Geen aparte margepost.
- **Handling-fee €250** → vast per project, **vervangt** de wervingskosten bij Zelf aanleveren.
  Bij Combi geldt de fee **één keer** (bevestigd), niet per spoor.
- **B2B/B2C** → werving-tarief is B2C; disclaimer onder de prijs.
- **Tier-mapping** (LIGHT/CORE/PLUS) → **intern**, nooit klantgericht tonen.
- **Klantcopy** → versie 1 vastgelegd in het `klanttekst`-blok van de config, ter review.

---

## 3. Steekproef (automatisch)

| Doelgroepen | Kwanti (survey) | Kwali (interviews) |
|---|---|---|
| 1 | 400 | 7 |
| 2 | 550 | 12 |
| 3 | 700 | 16 |

Combi telt beide op. Kwanti: 400 basis + 150 per extra doelgroep. Kwali: verzadiging.

---

## 4. Prijsmodel

Geldige doelgroepen `g` = bij Zelf aanleveren altijd 1, anders de keuze.

| Post | Wanneer | Bedrag |
|---|---|---|
| Basis | altijd | € 3.000 |
| Doorlopend-opslag | frequentie = doorlopend | € 6.000 |
| Survey-tooling | survey of combi | (smart? €500 : €250) × g |
| Werving kwanti | (survey/combi) én werven | € 4,50 × kwanti(g) |
| Werving kwali | (kwali/combi) én werven | € 100 × kwali(g) |
| Interviews | kwali of combi | € 200 × kwali(g) |
| Handling eigen base | respondenten = zelf | € 250 (i.p.v. werving) |

Mix → geen prijs.

### Acceptatietabel (kerngevallen, eenmalig)

| Respondenten | Pakket | Smart | Dg | Richtprijs |
|---|---|---|---|---|
| Zelf | Survey | nee | 1 | € 3.500 (default) |
| Zelf | Kwali | — | 1 | € 4.650 |
| Zelf | Combi | ja | 1 | € 5.150 |
| Werven | Survey | nee | 1 | € 5.050 |
| Werven | Survey | ja | 2 | € 6.475 |
| Werven | Kwali | — | 3 | € 7.800 |
| Werven | Combi | ja | 2 | € 10.075 |
| Werven | Combi | ja | 2 (doorlopend) | € 16.075 |

Volledige tabel: zie `voorbeelden` in de config.

---

## 5. Open punten

- Klantcopy is versie 1 (`klanttekst`-blok in de config), ter review.
- Zelf aanleveren + kwali: interviews altijd door ons afgenomen (€200 blijft)?
- Koppeling bestellen/advies (payload-hook → n8n) is een aparte stap.

---

## 6. Bouwfase (nog te doen, volgens REKENMODULES §6)

1. Component `components/calculators/CustomerJourneyCalculator.astro` op basis van
   `PretestCalculator.astro` (state, `priceFor()`, render, sticky prijsbalk, payload-hook).
2. Plaatsen via `CALCULATOR_PAGES` + `ServicePitch` op de customer-journey-serviceslug.
3. Verifiëren tegen de acceptatietabel hierboven; `pnpm build:web` schoon.
