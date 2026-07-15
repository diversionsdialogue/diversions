# CONTENT-SCHRIJFWIJZER — ruwe content → markdown met blokken → Sanity

Dit is het **contract** voor het omzetten van aangeleverde content naar een nette
markdown met de speciale blokken, die daarna deterministisch naar Sanity Portable
Text gaat. Jij levert ruwe tekst aan, Claude schrijft een `.md` volgens deze
syntax, jij reviewt, daarna schrijft Claude het naar Sanity.

> **Bron, niet hardcoden.** De blok-API (props) staat in `CLAUDE.md` §4. De
> markdown-syntax hieronder wordt geparset door `scripts/markdown-to-portable-text.ts`.
> Wijzigt een blok-prop, dan ook hier én in dat script én in het Sanity-schema.

---

## 0. Werkwijze (de flow)

1. **Jij levert ruwe content** (platte tekst, kopjes, een citaat, een lijstje, een
   vraag/antwoord, enz.). Hoe ruwer mag, Claude structureert.
2. **Claude schrijft een `.md`** in de juiste collectie-map onder
   `apps/web/src/content/<collection>/` met frontmatter + body volgens deze syntax.
3. **Jij reviewt de markdown** (in git/PR of in de editor). Dit is het
   human-in-the-loop checkpoint.
4. **Naar Sanity.** Twee routes, zelfde resultaat:
   - Claude schrijft direct via de Sanity-MCP (create/patch + publish), of
   - via een script met `SANITY_TOKEN` (zoals `migrate-work-statement.ts`).
5. **Controle op de live/preview-pagina.**

> **Voorwaarde:** de blok-schema's moeten in de Studio **gedeployed** zijn. Schrijf
> je een bloktype weg dat de gedeployde Studio niet kent, dan toont Studio
> "Unknown field". Bij twijfel eerst `pnpm --filter @lexington/studio run deploy`.

---

## 1. Frontmatter (per collectie)

Bovenaan elk `.md` tussen `---`. Velden per collectie staan in `CLAUDE.md` §2.
Voorbeeld voor een **service**:

```yaml
---
service: Pretest
slug: pretest
description: Korte omschrijving voor het overzicht.
thumbnail:
  url: /img/voorbeeld.jpg
  alt: Beschrijvende alt-tekst
---
```

De **body** (alles ná de tweede `---`) is waar de blokken in staan.

---

## 2. Gewone tekst (geen marker nodig)

Deze schrijf je als normale markdown; de converter zet ze 1-op-1 om:

| Wil je | Schrijf | Wordt |
|---|---|---|
| Tussenkop | `## Kop` of `### Kop` | block `h2` / `h3` (`#`/`##` → h2, `###`+ → h3) |
| Paragraaf | gewone regel(s) | block `normal` |
| Vet | `**vet**` | mark `strong` |
| Cursief | `*cursief*` of `_cursief_` | mark `em` |
| Link | `[label](https://...)` | `link`-annotatie |
| Gewone bullets | `- punt` | listItem `bullet` |
| Gewone nummers | `1. stap` | listItem `number` |
| Citaat (simpel) | `> tekst` | block `blockquote` |
| Afbeelding | `![alt](/pad.jpg)` | inline `image` |

> Let op: een simpel `>`-citaat wordt een **blockquote-stijl**, NIET het opgemaakte
> Quote-blok. Wil je het opgemaakte Quote-blok (met auteur/rol), gebruik dan
> `:::quote` hieronder.

---

## 3. De 7 speciale blokken (fence-syntax)

Een blok begint met `:::<naam>` op een eigen regel en eindigt met `:::` op een eigen
regel. Veldlabels in HOOFDLETTERS, één per regel.

### 3.1 Quote — `:::quote`
```
:::quote
QUOTE: Onderzoek is geen luxe, het is je kompas.
AUTEUR: William Burghout
ROL: Onderzoeker
:::
```
- `QUOTE` verplicht. `AUTEUR` en `ROL` optioneel.
- Sanity-type: `quoteBlock` (`quote`, `author?`, `role?`).

### 3.2 Opsomming / bullets — `:::bullets`
```
:::bullets
TITEL: Wat we doen
KOLOMMEN: 2
- Doelgroeponderzoek
- Pretesten
- Effectmeting
- Klanttevredenheid
:::
```
- `TITEL` optioneel. `KOLOMMEN` optioneel (`1` standaard, `2` = twee kolommen).
- Items zijn `-`-regels.
- Sanity-type: `bulletList` (`title?`, `items: string[]`, `columns: 1|2`).
- **Beperking:** items zijn platte strings. De venn-variant met losse kopjes per cel
  (CLAUDE.md §4) zit niet in het Sanity-schema; `KOLOMMEN: 2` verdeelt de bullets
  alleen over twee kolommen.

### 3.3 Opsomming met cijfers / stappen — `:::nummers`
Eén item per regel, velden gescheiden door `|`. Alleen `LABEL` verplicht.
```
:::nummers
TITEL: Onze werkwijze
- LABEL: Intake | TEKST: We bepalen samen de vraag
- LABEL: Analyse | TEKST: We duiken in de data
- NUMMER: 92% | LABEL: tevreden | TEKST: van de respondenten
:::
```
- Zonder `NUMMER` → genummerde **stap** (1, 2, 3 ...). Met `NUMMER` → **stat/cijfer**
  (bv. "92%"). Je mag binnen één blok mengen, maar kies meestal één leeswijze.
- Sanity-type: `numberedList` (`title?`, `items[]` met `number?`, `label`, `text?`).

### 3.4 Let-op-blok / callout — `:::let-op`
```
:::let-op
LABEL: Onze regel
TEKST: Respondenten werven we altijd via een panel.
:::
```
- `LABEL` en `TEKST` beide verplicht.
- Sanity-type: `noticeBlock` (`label`, `text`).

### 3.5 CTA — `:::cta`
```
:::cta
KOP: Tijd voor scherper onderzoek?
TEKST: Plan een vrijblijvende kennismaking.
KNOP: Maak een afspraak
URL: /contact
VARIANT: sage
:::
```
- `KOP`, `KNOP`, `URL` verplicht. `TEKST` en `VARIANT` (`default`|`sage`) optioneel.
- Mist een verplicht veld, dan wordt het als gewone tekst gelaten (zie log).
- Sanity-type: `ctaBlock`.

### 3.6 Video — `[EMBED youtube]: <url>`
```
[EMBED youtube]: https://www.youtube.com/watch?v=XXXX
```
- Ook `[EMBED vimeo]: <url>`.
- De **poster** (verplichte still) is bij import nog leeg en wordt later in Studio
  ingevuld. Klik-om-te-laden + AVG-consent zitten in de component.
- Sanity-type: `videoBlock`.

### 3.7 FAQ / accordeon — `:::faq`
Eén `:::faq`-fence per vraag; opeenvolgende fences worden samengevoegd tot één
FAQ-blok.
```
:::faq
VRAAG: Hoe lang duurt een onderzoek?
ANTWOORD: Gemiddeld vier tot zes weken.
:::
:::faq
VRAAG: Werken jullie met een panel?
ANTWOORD: Ja, respondenten komen altijd via een panel.
:::
```
- `VRAAG` en `ANTWOORD` verplicht. Een item zonder `VRAAG` wordt overgeslagen (log).
- De component rendert zelf `FAQPage`-JSON-LD en is toetsenbord-toegankelijk; dat
  hoort bij de component, niet in de content.
- Sanity-type: `faqBlock`.

---

## 4. Snelle test (zonder Sanity)

De converter heeft een CLI. Output controleren zonder iets weg te schrijven:
```
npx tsx scripts/markdown-to-portable-text.ts apps/web/src/content/services/voorbeeld.md
```
Verschijnt er een `LOG:` onderaan, dan zijn er aandachtspunten (ontbrekende
verplichte velden, overgeslagen items). Loop die handmatig na.

---

## 5. Spelregels

- **Eén leeswijze per blok.** Meng stappen en stats niet onnodig in één `:::nummers`.
- **Geen leveranciersnamen** in content van calculators/diensten (afspraak project).
- **Verplichte velden** altijd invullen, anders valt een blok terug op platte tekst.
- **Markdown is de bron**, Sanity is afgeleid. Wijzig content in de `.md` en schrijf
  opnieuw weg, niet andersom (anders loopt de git-bron achter op Sanity).

---

## 6. Standaardafsluiting: "Onderzoek starten"

Dienst-, methode- en branchepagina's sluiten **standaard** af met een
"Onderzoek starten"-CTA. Dit vervangt het oude "Over de onderzoeker"-blok
(met teksten als "William Burghout, Onderzoek & Innovatie" en de
"Data & Insights Network / AVG"-alinea); gebruik dat blok niet meer.

Plak onderaan de body exact dit:

```
## Onderzoek starten

:::cta
KOP: Even sparren over je onderzoeksvraag?
TEKST: Stel je vragen gerust vooraf. We denken vrijblijvend met je mee over de opzet die bij jouw onderzoeksvraag past.
KNOP: Neem contact op
URL: /contact
VARIANT: sage
:::
```

- Vaste opzet: kop "Even sparren over je onderzoeksvraag?", knop "Neem contact op"
  naar `/contact`, `VARIANT: sage`.
- De afbeelding bij het CTA-blok (`image`) staat niet in markdown; die wordt in de
  Studio gezet (asset `image-…`). Bij nieuwe pagina's dezelfde contact-afbeelding
  aanhouden als de andere onderzoekspagina's.
- Wil je een pagina toch persoonlijker afsluiten, doe dat dán vóór deze CTA
  (bijv. een `:::quote` van de onderzoeker), maar de CTA blijft de laatste sectie.
