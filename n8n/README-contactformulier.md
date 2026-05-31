# Contactformulier → n8n (Fase 4)

Handover voor het enige formulier in scope: het **contactformulier** op `/contact`.
De Astro-kant is af; dit document beschrijft de n8n-kant die jij in je **eigen
n8n** importeert, koppelt, test en publiceert. (Er is hier geen n8n-MCP, dus ik kon
niet zelf valideren/testen/publiceren — die stappen staan hieronder voor jou.)

## Wat de workflow doet

`n8n/contactformulier.workflow.json` — flow:

```
Webhook (POST /contact-diversions, CORS: https://diversions.nl)
  └─ Honeypot leeg? ── nee (bot) → Respond 200 (stil genegeerd)
                    └─ ja → Mailjet notificatie naar info@diversions.nl
                            → Mailjet bevestiging naar de invuller
                            → Google Sheets: rij toevoegen (secundair)
                            → Respond 200 { success: true }
```

- **Afzender:** `info@diversions.nl` (jouw keuze). Notificatie heeft **reply-to = de
  invuller**, zodat "Beantwoorden" direct naar de klant gaat.
- **Google Sheets** is secundair: faalt dit, dan gaat de flow tóch door naar de
  200-respons (de lead is al gemaild). `onError: continueRegularOutput`.
- **Spam:** honeypotveld `company_website` — de browser verbergt het; bots vullen het.
  Ingevuld ⇒ stil 200, niets verstuurd.

## Payload die de site stuurt

De site doet een `fetch` POST met JSON. In n8n staat dit onder **`$json.body`**:

```json
{ "name": "...", "email": "...", "phone": "...", "message": "...",
  "consent": true, "company_website": "" }
```

## Stap 1 — Importeren

n8n → **Workflows → Import from File** → kies `contactformulier.workflow.json`.
De workflow heet *"Diversions — Contactformulier verwerken"* en staat op **inactive**.

## Stap 2 — Credentials koppelen (jij — secrets horen NIET in tekst/JSON)

De JSON bevat placeholder-credential-id's (`VERVANG_...`). Open na import elke node
met een credential en **selecteer/maak de juiste**:

| Node | Credential-type | Aanmaken met |
|---|---|---|
| Mailjet: notificatie | **Mailjet Email API** | Mailjet API-key + secret-key |
| Mailjet: bevestiging | **Mailjet Email API** | (dezelfde credential) |
| Google Sheets: opslaan | **Google Sheets OAuth2 API** | Google-account met toegang tot het sheet |

> ⚠️ n8n koppelt bij twijfel automatisch de "laatst bewerkte" credential van het
> juiste type. Open **elke** node en bevestig dat de juiste credential staat geselecteerd.
>
> **Mailjet sender:** `info@diversions.nl` moet een **geverifieerde sender** (of een
> geverifieerd domein) in je Mailjet-account zijn, anders weigert Mailjet de mail.

## Stap 3 — Google Sheet klaarzetten

1. Maak (of kies) een Google Spreadsheet.
2. Maak een tabblad **`Inzendingen`** met als kopregel (rij 1):
   `Tijdstip | Naam | E-mail | Telefoon | Bericht | Consent | Bron`
3. In de node *"Google Sheets: inzending opslaan"*: selecteer via de pickers het
   **spreadsheet** en het tabblad **Inzendingen** (vervangt de `VERVANG_SPREADSHEET_ID`-stub).

## Stap 4 — Webhook-URL → site-env

Na import geeft de Webhook-node twee URL's:

- **Test-URL:** `https://diversions-connect-u67534.vm.elestio.app/webhook-test/contact-diversions` (alleen actief
  zolang je in de editor op *"Listen for test event"* staat)
- **Productie-URL:** `https://diversions-connect-u67534.vm.elestio.app/webhook/contact-diversions` (werkt zodra de
  workflow **actief/gepubliceerd** is)

Zet de **productie-URL** in `apps/web/.env`:

```
PUBLIC_CONTACT_WEBHOOK_URL=https://diversions-connect-u67534.vm.elestio.app/webhook/contact-diversions
```

(De `PUBLIC_`-prefix is verplicht; alleen dan komt de var in de client-bundle.
Daarna `pnpm build:web` zodat de waarde in de gebouwde site zit.)

## Stap 5 — Testen (VERPLICHT vóór livegang)

**5a. Snelle test los van de site (curl):**
```bash
curl -i -X POST "https://diversions-connect-u67534.vm.elestio.app/webhook-test/contact-diversions" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Jansen","email":"JOUW-eigen@mail.nl","phone":"0612345678","message":"Dit is een test.","consent":true,"company_website":""}'
```
Verwacht: `HTTP/1.1 200` + `{"success":true}`, een mail naar info@, een bevestiging
op JOUW-eigen@mail.nl, en een nieuwe rij in het sheet.

**5b. Honeypot-test:** zelfde curl maar `"company_website":"bot"` → 200, maar **geen**
mail en **geen** sheet-rij.

**5c. CORS/preflight-test** (de site is cross-origin, dus dit moet kloppen):
```bash
curl -i -X OPTIONS "https://diversions-connect-u67534.vm.elestio.app/webhook/contact-diversions" \
  -H "Origin: https://diversions.nl" \
  -H "Access-Control-Request-Method: POST"
```
Verwacht een `Access-Control-Allow-Origin: https://diversions.nl` header. Zo niet:
controleer "Allowed Origins (CORS)" op de Webhook-node.

**5d. Echte formuliertest op staging:** publiceer de workflow (stap 6), zet de
productie-URL in env, build de site en verstuur het formulier op de staging-URL.
> Let op: staat de site op een **andere origin** dan `https://diversions.nl` (bv.
> een staging-subdomein), dan blokkeert CORS. Voeg die origin tijdelijk toe aan de
> Webhook-node, of test pas op het echte domein.

## Stap 6 — Publiceren

Pas **nadat 5a–5c slagen**: zet de workflow op **Active** (publiceren). De
productie-webhook-URL is dan live.

## Aandachtspunten / bekend

- **Geen MCP-validatie gebeurd hier.** Controleer bij het openen van elke node dat de
  velden netjes laden (vooral de Mailjet-node-versie en de Google Sheets-kolommapping
  kunnen per n8n-versie iets afwijken; n8n migreert bij import meestal automatisch).
- **Error-workflow:** overweeg in n8n een globale *Error Workflow* in te stellen zodat
  je een seintje krijgt als een notificatiemail faalt.
- **Veldnamen GF id=1** waren niet hard bevestigd; de site gebruikt
  `naam / e-mail / telefoon / bericht` + AVG-consent. Wijkt het echte oude formulier
  af, dan hier én in `apps/web/src/pages/contact.astro` aanpassen.
- **Niet gepusht/gedeployed** vanuit dit project — alles staat lokaal.
