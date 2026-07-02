# Offerte-/adviesaanvragen rekenmodules → n8n

Handover voor stap 3 ("Bestellen") van de 4 rekenmodules op diversions.nl:
Pretest, Customer Journey, Klanttevredenheid en Effectmeting
(`apps/web/src/components/calculators/*.astro`). De Astro-kant is af; dit
document beschrijft de n8n-kant die jij in je **eigen n8n** importeert,
koppelt, test en publiceert. Zelfde werkwijze als
[`README-contactformulier.md`](README-contactformulier.md).

**Eén gedeelde workflow voor alle 4 rekenmodules** (niet 4 losse workflows):
één webhook, het `calculator`-veld in de payload bepaalt welke rekenmodule
de aanvraag stuurde en wordt gebruikt in de e-mailteksten.

## Webhook-URL

Deze workflow gebruikt een **al aangemaakte productie-webhook**:

```
https://diversions-connect-u67534.vm.elestio.app/webhook/b3737101-9313-4c3d-a9fa-73cb22838364
```

Die URL staat al in `apps/web/.env` als `PUBLIC_CALCULATOR_WEBHOOK_URL`. Het
webhook-`path` in `offerte-calculators.workflow.json` is bewust op dit exacte
ID gezet, zodat de workflow na import op deze URL uitkomt — je hoeft de
site-env niet aan te passen.

## Wat de workflow doet

`n8n/offerte-calculators.workflow.json` — flow:

```
Webhook (POST, CORS: https://diversions.nl)
  └─ Honeypot leeg? ── nee (bot) → Respond 200 (stil genegeerd)
                    └─ ja → Mailjet bevestiging naar de aanvrager (samenvatting + richtprijs)
                            → Mailjet interne notificatie naar info@diversions.nl
                            → Google Sheets: rij toevoegen (tabblad "Offertes", secundair)
                            → Respond 200 { success: true }
```

- **Afzender:** `info@diversions.nl`, zelfde als het contactformulier.
  Notificatie heeft **reply-to = de aanvrager**.
- **Google Sheets** is secundair: faalt dit, dan gaat de flow tóch door naar
  de 200-respons. `onError: continueRegularOutput`.
- **Spam:** honeypotveld `company_website` — verborgen voor mensen, bots
  vullen het. Ingevuld ⇒ stil 200, niets verstuurd/opgeslagen.
- **Bestellen vs. advies:** de e-mailteksten wisselen op `{{ $json.body.actie }}`
  (`"bestellen"` of `"advies"`) — geen aparte nodes per actie nodig.

## Payload die de site stuurt

Alle 4 calculators posten dezelfde vorm. Onder `$json.body`:

```json
{
  "calculator": "pretest",
  "actie": "bestellen",
  "keuzes": { "voorkeur": "verdiepend", "aanpak": "survey", "concepten": 1, "doelgroepen": 2 },
  "tier": "Core",
  "richtprijs": 2425,
  "richtprijsFormatted": "€ 2.425",
  "samenvatting": ["Verdiepend inzicht", "Survey", "2 doelgroepen"],
  "bedrijf": "Acme BV",
  "naam": "Jansen",
  "email": "jansen@acme.nl",
  "telefoon": "0612345678",
  "bericht": "",
  "consent": true,
  "company_website": ""
}
```

- `calculator` ∈ `pretest | customer-journey | klanttevredenheid | effectmeting`.
- `richtprijs` kan `null` zijn (customer-journey "mix" heeft geen vaste
  prijs); gebruik in dat geval altijd `richtprijsFormatted` (dan `"Op aanvraag"`)
  in de e-mailteksten — die is door de site al netjes geformatteerd, dus
  n8n hoeft geen NL-valutaformattering te doen.
- `samenvatting` is een array met leesbare regels (geen ruwe enum-waardes),
  klaar om te tonen of te joinen in een e-mail.
- Verplicht: `bedrijf`, `naam`, `email`, `consent`. Optioneel: `telefoon`, `bericht`.

## Stap 1 — Importeren

n8n → **Workflows → Import from File** → kies `offerte-calculators.workflow.json`.
De workflow heet *"Diversions — Offertes rekenmodules verwerken"* en staat
op **inactive**.

## Stap 2 — Credentials koppelen (jij — secrets horen NIET in tekst/JSON)

Hergebruik dezelfde credentials als het contactformulier (geen nieuwe nodig):

| Node | Credential-type | Aanmaken met |
|---|---|---|
| Mailjet: bevestiging naar aanvrager | **Mailjet Email API** | zelfde credential als contactformulier |
| Mailjet: interne notificatie | **Mailjet Email API** | zelfde credential |
| Google Sheets: aanvraag opslaan | **Google Sheets OAuth2 API** | zelfde credential |

> ⚠️ Open **elke** node en bevestig dat de juiste credential staat
> geselecteerd (n8n koppelt bij twijfel automatisch de "laatst bewerkte").

## Stap 3 — Google Sheet: nieuw tabblad "Offertes"

De kolommen wijken af van het contactformulier ("Inzendingen"), dus:

1. Open hetzelfde Google Spreadsheet als het contactformulier (of een nieuw
   document — jouw keuze).
2. Maak een tabblad **`Offertes`** met als kopregel (rij 1):
   `Tijdstip | Calculator | Actie | Bedrijf | Naam | E-mail | Telefoon | Tier | Richtprijs | Keuzes | Consent | Bron`
3. In de node *"Google Sheets: aanvraag opslaan"*: selecteer via de pickers
   het **spreadsheet** en het tabblad **Offertes** (vervangt de
   `VERVANG_SPREADSHEET_ID`-stub).

## Stap 4 — Testen (VERPLICHT vóór livegang)

**4a. Snelle test los van de site (curl), via de test-URL:**
```bash
curl -i -X POST "https://diversions-connect-u67534.vm.elestio.app/webhook-test/b3737101-9313-4c3d-a9fa-73cb22838364" \
  -H "Content-Type: application/json" \
  -d '{
    "calculator": "pretest",
    "actie": "bestellen",
    "keuzes": {"voorkeur":"snel","aanpak":"","concepten":2,"doelgroepen":1},
    "tier": "Direct",
    "richtprijs": 980,
    "richtprijsFormatted": "€ 980",
    "samenvatting": ["Snel inzicht", "2 concepten"],
    "bedrijf": "Test BV",
    "naam": "Test Jansen",
    "email": "JOUW-eigen@mail.nl",
    "telefoon": "0612345678",
    "bericht": "",
    "consent": true,
    "company_website": ""
  }'
```
Verwacht: `HTTP/1.1 200` + `{"success":true}`, een bevestiging op
JOUW-eigen@mail.nl, een interne notificatie op info@diversions.nl, en een
nieuwe rij in het tabblad "Offertes".

**4b. Honeypot-test:** zelfde curl maar `"company_website":"bot"` → 200, maar
**geen** mail en **geen** sheet-rij.

**4c. Herhaal kort voor de overige 3 calculators** (`customer-journey`,
`klanttevredenheid`, `effectmeting`) en voor `"actie": "advies"`, zodat je
beide e-mailvarianten hebt gezien.

**4d. CORS/preflight-test:**
```bash
curl -i -X OPTIONS "https://diversions-connect-u67534.vm.elestio.app/webhook/b3737101-9313-4c3d-a9fa-73cb22838364" \
  -H "Origin: https://diversions.nl" \
  -H "Access-Control-Request-Method: POST"
```
Verwacht een `Access-Control-Allow-Origin: https://diversions.nl` header.

**4e. Echte formuliertest op staging:** publiceer de workflow (stap 5), build
de site (env staat al goed), en doorloop op de staging-URL minimaal één
calculator volledig (stap 1 → 2 → 3 → versturen). Staat de staging-site op
een andere origin dan `https://diversions.nl`, dan blokkeert CORS — voeg die
origin tijdelijk toe aan de Webhook-node, of test pas op het echte domein.

## Stap 5 — Publiceren

Pas **nadat 4a–4d slagen**: zet de workflow op **Active**. De
productie-webhook-URL (zie boven) is dan live.

## Aandachtspunten / bekend

- **Geen MCP-validatie gebeurd hier.** Controleer bij het openen van elke
  node dat de velden netjes laden.
- **Error-workflow:** overweeg een globale *Error Workflow* in te stellen
  (zoals bij andere Diversions-projecten al gebeurt) zodat je een seintje
  krijgt als een mail faalt.
- **Geen secret-header.** Deze workflow beveiligt met CORS + honeypot,
  bewust dezelfde aanpak als het contactformulier — géén gedeeld
  `x-webhook-secret`-patroon (zoals in sommige andere projecten). Bij een
  statische site staat de env-var toch in de client-bundle, dus een
  "geheime" header voegt daar geen echte beveiliging aan toe.
- **Niet gepusht/gedeployed** vanuit dit project — alles staat lokaal.
