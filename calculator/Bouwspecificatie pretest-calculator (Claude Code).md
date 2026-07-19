# Bouwspecificatie — pretest-calculator

*Voor Claude Code. Doel: bouw de interactieve pretest-calculator als component op de Diversions-site (Astro), in de bestaande sitestijl. 
Zie service detail - Offerte Starter

---

## 1. Doel en plaatsing

Een compacte calculator die in een paar klikken een richtprijs voor een pretest toont. Hij staat **bovenaan** de dienstpagina Pretest (boven de hero), en is herbruikbaar op branchepagina's. De klant kiest een voorkeur, krijgt direct een richtprijs en kan die verzenden of meteen bestellen.

**Belangrijk principe:** leveranciersnamen (panelpartner, kwali-platform, surveytool) worden **nooit** getoond. De klant ziet alleen wat hij krijgt, niet hoe wij inkopen.

---

## 2. Schermflow en states

De calculator is een **progressive disclosure**-formulier: velden verschijnen op basis van eerdere keuzes.

### Stap 1 — Voorkeur (altijd zichtbaar)
Twee keuzekaarten, vraag: **"Wat heeft je voorkeur?"**

- **Snel inzicht** → tier **Direct**. Toon drie korte features als bullets/chips:
  - Feedback op design & inhoud
  - 150 respondenten
  - Binnen een werkdag beschikbaar
- **Verdiepend inzicht** Toon drie korte features als bullets/chips:
  - Onderzoek op maat
  - Verdieping op thema's mogelijk    
  - Oplevering in overleg

→ vervolgkeuze in stap 2. Subtekst: *"Cijfers én het waarom erachter. Je bepaalt de aanpak in overleg."*

### Stap 2a — Aantal uitingen (alleen bij Snel inzicht)
Select: **"Aantal uitingen"** → 1 / 2 / 3 uitingen. Bepaalt de Direct-prijs (per uiting).

### Stap 2b — Aanpak (alleen bij Verdiepend inzicht)
Vraag: **"Hoe wil je verdiepen?"** Twee keuzekaarten met uitleg:

- **Survey** → tier **Core**. Uitleg: *"Je meet bij 150 respondenten hoe je uiting overkomt, bijvoorbeeld in termen als begrip, gevoel, onderscheid en activering."*
- **Kwalitatief** → tier **Plus**. Uitleg: *"Vijf diepte-interviews leggen bloot waaróm respondenten je product wel of neit waarderen. Een aanvullende survey zorgt voor validatie van de inzichten."*

### Stap 3 — Smart Survey (alleen bij aanpak = Survey)
Toggle, vraag: **"Wil je het onderzoek verrijken met een Smart Survey?"** Uitleg: *"Met behulp van AI maken we de vragenlijst interactief: respondenten krijgen gerichte vervolgvragen op hun antwoorden. Dat leidt tot scherpere inzichten, zonder extra doorlooptijd."*

### Resultaatblok (altijd zichtbaar, update live)
- Label **"Richtprijs"** + bedrag groot in accentkleur (formaat: `€ 1.675`, NL-notatie, excl. btw).
- Korte disclaimer: *"Een betrouwbare prijsindicatie, geen bindende offerte."*
- **Twee knoppen** (zie §6).
- Contactblok eronder: *"Heb je specifieke onderzoekswensen, bijvoorbeeld bij de selectie van doelgroepen? Neem dan contact op: (055) 20 32 193."*

---

## 5. Rekenlogica

Tarieven (intern, niet tonen) uit `tarievenIntern` in de config. Routing:

| Voorkeur | Aanpak | Tier |
|---|---|---|
| Snel | — | Direct |
| Verdiepend | Survey | Core |
| Verdiepend | Kwalitatief | Plus |

Formules (n = 150 vast):

```
Direct = 130 + (2 × 150 × aantalUitingen) + 250
Core   = (smartSurvey ? 750 : 250) + (4,50 × 150) + 750
Plus   = 250 + (4,50 × 150) + (80 × 5) + (200 × 5) + 750
```

Verwachte uitkomsten (acceptatie):

| Keuze | Richtprijs |
|---|---|
| Snel, 1 uiting | € 680 |
| Snel, 2 uitingen | € 980 |
| Snel, 3 uitingen | € 1.280 |
| Verdiepend → Survey (zonder Smart) | € 1.675 |
| Verdiepend → Survey (met Smart) | € 2.175 |
| Verdiepend → Kwalitatief | € 3.075 |

---

## 6. De twee knoppen in het resultaat

Naast elkaar (op mobiel onder elkaar):

1. **Prijsindicatie verzenden** — *secundaire* stijl 
2. **Direct bestellen** — *primaire* stijl 

> De exacte bestemming (formulier, CRM, e-mail) is nog open — bouw de knoppen met een duidelijke `onSubmit`/handler-hook en een payload-object, zodat de koppeling later ingevuld wordt. Markeer dit als `[koppeling nog aanleveren]`.


## 8. Acceptatiecriteria

- [ ] Alle zes prijsuitkomsten uit §5 kloppen exact.
- [ ] Velden verschijnen/verdwijnen correct per voorkeur en aanpak.
- [ ] Prijs en breakdown updaten live bij elke wijziging.
- [ ] Beide knoppen aanwezig met juiste stijl en een werkende payload-hook.
- [ ] Component matcht de sitetokens en oogt als onderdeel van de site.
- [ ] Bedragen in NL-notatie, excl. btw vermeld.
- [ ] Werkt zonder localStorage en zonder externe dependencies.

---

## 9. Referentiebestanden

- `Calculator-config-pretest.json` — bronwaarheid logica/tarieven/copy.
- `Calculator-pretest-test.html` — werkend rekenvoorbeeld (vanilla JS), als referentie voor de logica. Let op: dit is een testtool, niet de sitestijl.
