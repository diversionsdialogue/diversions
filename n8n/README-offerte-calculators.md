# Offerte-/adviesaanvragen rekenmodules → n8n

Handover voor stap 3 ("Bestellen") van de **10 rekenmodules** op diversions.nl
(`apps/web/src/components/calculators/*.astro`). De Astro-kant is af; dit
document beschrijft de n8n-kant die jij in je **eigen n8n** importeert,
koppelt, test en publiceert. Zelfde werkwijze als
[`README-contactformulier.md`](README-contactformulier.md).

**Eén gedeelde workflow voor alle 10 rekenmodules** (niet 10 losse workflows):
één webhook; het `calculator`-veld in de payload bepaalt de nette naam in de
e-mails via de labelmap in de node **"Valideer en label"**.

> **Versie 2026-07-16** — vervangt de versie van 2026-07-01 die op de
> n8n-instantie draait (workflow-id `y0MY3XYKhQT2rqsB`). Wijzigingen:
> (1) labelmap voor alle 10 calculator-id's (was: ruwe id in de mailtekst);
> (2) volgorde robuuster: eerst **opslaan**, dan **200 naar de bezoeker**,
> dan pas mailen — een mailstoring kost zo geen leads en de bezoeker wacht
> niet op Mailjet; (3) servervalidatie van verplichte velden (400 + details);
> (4) staging-origin in CORS voor de livegang-test; (5) mail-retries naar
> 3× met 5s tussenpauze.

## Webhook-URL (ongewijzigd)

```
https://diversions-connect-u67534.vm.elestio.app/webhook/b3737101-9313-4c3d-a9fa-73cb22838364
```

Staat al in `apps/web/.env` als `PUBLIC_CALCULATOR_WEBHOOK_URL`; het
webhook-`path` in de JSON is hetzelfde gebleven, dus de site-env hoeft niet
te wijzigen.

## Wat de workflow doet

`n8n/offerte-calculators.workflow.json` — flow:

```
Webhook (POST, CORS: diversions.nl + www + staging)
  └─ Honeypot leeg? ── nee (bot) → Respond 200 (stil genegeerd)
      └─ ja → Valideer en label (Code: verplichte velden + labelmap)
          └─ Geldig? ── nee → Respond 400 { details }
              └─ ja → Google Sheets: rij "Offertes" (lead veilig; retry 2x,
                      faalt door bij storing)
                      → Respond 200 { success: true }  ← bezoeker klaar
                      → Mailjet bevestiging naar aanvrager (retry 3x/5s)
                      → Mailjet interne notificatie naar info@ (retry 3x/5s,
                        reply-to = aanvrager)
```

- **Calculator-id's** (labelmap): `pretest`, `effectmeting`,
  `customer-journey`, `klanttevredenheid`, `diepte-interviews`,
  `groepsdiscussie`, `doelgroeponderzoek`, `kwantitatief-onderzoek`,
  `kwalitatief-onderzoek`, `waardepropositie`. **Onbekende id's worden niet
  geweigerd**: ze krijgen een generiek label en de interne mail markeert ze,
  zodat een vergeten labelregel nooit leads kost. Nieuwe rekenmodule op de
  site = één regel toevoegen in "Valideer en label".
- **Verplicht:** `bedrijf`, `naam`, geldig `email`, `consent: true`.
  Ontbreekt iets (directe POST buiten de site om), dan 400 met `details`.
- `richtprijs` kan `null` zijn; de mails gebruiken altijd
  `richtprijsFormatted` (dan `"Op aanvraag"`).

## Stap 1 — Oude workflow vervangen

De vorige versie draait al (actief) op de instantie:

1. n8n → open *"Diversions — Offertes rekenmodules verwerken"* →
   zet **Inactive** (anders claimen twee workflows hetzelfde webhook-pad).
   Archiveer of hernoem hem (bv. "… (oud, 2026-07-01)").
2. **Workflows → Import from File** → `offerte-calculators.workflow.json`.
   De import staat op inactive.

## Stap 2 — Credentials koppelen (secrets horen NIET in tekst/JSON)

Zelfde credentials als voorheen/het contactformulier:

| Node | Credential-type |
|---|---|
| Mailjet: bevestiging naar aanvrager | **Mailjet Email API** |
| Mailjet: interne notificatie | **Mailjet Email API** (zelfde) |
| Google Sheets: aanvraag opslaan | **Google Sheets OAuth2 API** |

> ⚠️ Open **elke** node en bevestig dat de juiste credential geselecteerd is
> (n8n koppelt bij twijfel de "laatst bewerkte"). Controleer op de twee
> Mailjet-nodes ook dat **Settings → Retry On Fail** aan staat (3×, 5000 ms)
> en dat het HTML-veld leeg is.

## Stap 3 — Google Sheet selecteren

Zelfde tabblad **"Offertes"** en kolommen als voorheen (geen wijziging):
`Tijdstip | Calculator | Actie | Bedrijf | Naam | E-mail | Telefoon | Tier | Richtprijs | Keuzes | Consent | Bron`.
In de node *"Google Sheets: aanvraag opslaan"*: selecteer via de pickers het
spreadsheet en het tabblad (vervangt de `VERVANG_SPREADSHEET_ID`-stub).

## Stap 4 — Error workflow instellen

Workflow-instellingen (⚙ rechtsboven) → **Error Workflow** → kies
*"N8N Error trigger"*. Faalt een mail na 3 pogingen, dan is de lead al
opgeslagen én krijg je een melding.

## Stap 5 — Testen (VERPLICHT vóór activeren)

**5a. Succespad (curl, via de test-URL — klik eerst "Listen for test event"):**
```bash
curl -i -X POST "https://diversions-connect-u67534.vm.elestio.app/webhook-test/b3737101-9313-4c3d-a9fa-73cb22838364" \
  -H "Content-Type: application/json" \
  -d '{
    "calculator": "diepte-interviews",
    "actie": "bestellen",
    "keuzes": {"respondenten":"zelf","frequentie":"eenmalig","doelgroepen":1},
    "tier": "PLUS",
    "richtprijs": 4650,
    "richtprijsFormatted": "€ 4.650",
    "samenvatting": ["Diepte-interviews (kwalitatief)", "Zelf aanleveren", "Eenmalig"],
    "bedrijf": "Test BV",
    "naam": "Test Jansen",
    "email": "JOUW-eigen@mail.nl",
    "telefoon": "0612345678",
    "bericht": "",
    "consent": true,
    "company_website": ""
  }'
```
Verwacht: `200` + `{"success":true}`, rij in "Offertes", bevestiging op je
eigen mail ("… voor de diepte-interviews …"), interne notificatie op info@.

**5b. Honeypot:** zelfde curl met `"company_website":"bot"` → 200, geen rij,
geen mail.

**5c. Validatie:** zelfde curl zonder `"email"` → **400** met
`{"success":false,"details":["geldig e-mailadres ontbreekt"]}`.

**5d. Labelmap-dekking:** herhaal 5a kort met elk nieuw id
(`groepsdiscussie`, `doelgroeponderzoek`, `kwantitatief-onderzoek`,
`kwalitatief-onderzoek`, `waardepropositie`) en één oud id (`pretest`), plus
één keer `"actie": "advies"`. Check dat de mails nette namen tonen, geen
ruwe id's.

**5e. Echte formuliertest op staging:** activeer (stap 6), doorloop op de
ploi.link-staging minimaal één calculator volledig (stap 1 → 2 → 3 →
versturen). De staging-origin staat al in de CORS-lijst van de Webhook-node.

## Stap 6 — Activeren + opruimen

1. Zet de workflow op **Active** (productie-URL is dan live).
2. Verwijder of archiveer de oude workflow definitief.
3. **Na livegang:** haal `https://friendly-dust-xs6wxtya91.ploi.link` uit
   `allowedOrigins` van de Webhook-node.

## Aandachtspunten

- **Volgorde niet wijzigen** (Sheets → Respond → mails): opslaan vóór alles
  is de leadgarantie; de spam-tak (nep-200) en de 400-tak horen intact te
  blijven.
- Sheets heeft bewust `onError: continueRegularOutput`: een Sheets-storing
  blokkeert bezoeker en mails niet, maar de error workflow ziet hem wel.
- **Geen secret-header** — bewuste keuze bij een statische site (env-var
  staat toch in de client-bundle); bescherming = CORS + honeypot +
  servervalidatie. Zie ook README-contactformulier.md.
- Handmatige wijzigingen in de n8n-UI: controleer daarna dat expressies in
  Expression-modus staan (waarde begint met `=` in de export) en dat de
  retry-instellingen op de mailnodes bewaard zijn gebleven.
