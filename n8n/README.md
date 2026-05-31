# n8n — Contactformulier diversions.nl

Workflow-backup voor het contactformulier (Fase 4 van de WP→Astro-migratie).
Bron-formulier: `/contact` (Astro), geconsolideerd uit Gravity Form id=1.

Deze map staat in versiebeheer zodat de flow ook buiten n8n bestaat. De live
workflow wordt **handmatig** in n8n aangemaakt via import — er is in deze omgeving
geen bereikbare n8n-instance.

## Bestand

- `contact-form.workflow.json` — importeerbare workflow-definitie.

## Wat de workflow doet

```
Webhook (POST /webhook/diversions-contact)
  -> Mailjet: notificatie naar info@diversions.nl (alle ingevulde velden)
  -> Mailjet: bevestigingsmail naar de invuller ({{ $json.body.email }})
  -> Respond to Webhook: 200 JSON { "ok": true }
```

## Verwachte JSON-payload (van de Astro-site)

De site verstuurt `Content-Type: application/json`. In de Webhook-node komen de
velden binnen onder `{{ $json.body.* }}`:

| Veld              | Type    | Verplicht | Toelichting                                  |
| ----------------- | ------- | --------- | -------------------------------------------- |
| `name`            | string  | ja        | Naam invuller                                |
| `email`           | string  | ja        | E-mail invuller (ontvanger bevestigingsmail) |
| `phone`           | string  | nee       | Telefoon (optioneel veld op het formulier)   |
| `message`         | string  | ja        | Bericht                                      |
| `consent`         | boolean | ja        | AVG-consent (true = akkoord)                 |
| `company_website` | string  | (leeg)    | **Honeypot** — hoort leeg te zijn            |

> De honeypot wordt al **client-side** afgevangen (gevuld = submit genegeerd).
> Optioneel kun je in n8n een extra IF-node toevoegen die afbreekt als
> `company_website` niet leeg is, als server-side dubbele check.

## Importeren in n8n

1. Open n8n → **Workflows** → menu rechtsboven → **Import from File**.
2. Kies `contact-form.workflow.json`.
3. De workflow verschijnt met de naam **"Diversions - Contactformulier"**.

## Mailjet-credential aanmaken

De workflow bevat **geen** API-keys. De twee Mailjet-nodes verwijzen naar een
credential met placeholder-id `REPLACE_WITH_MAILJET_CREDENTIAL_ID`.

1. In n8n: **Credentials** → **New** → zoek **"Mailjet Email API"**.
2. Vul in:
   - **API Key** = Mailjet `API Key (public)`.
   - **Secret Key** = Mailjet `Secret Key (private)`.
   (Beide via Mailjet-dashboard → Account Settings → API Key Management.)
3. Geef de credential een naam (bv. **"Mailjet Diversions"**).
4. Open beide Mailjet-nodes in de workflow en selecteer deze credential in het
   credential-dropdownveld (de placeholder-id wordt dan vervangen).

## Mailjet sender / domein verifiëren (belangrijk)

Mailjet weigert mail van niet-geverifieerde afzenders.

- Het `fromEmail` is `info@diversions.nl`. Dit adres **of** het domein
  `diversions.nl` moet in Mailjet geverifieerd zijn (Account → Sender domains &
  addresses).
- Voor betrouwbare aflevering: zet **SPF** en **DKIM** records voor `diversions.nl`
  zoals Mailjet die opgeeft. Zonder DKIM belandt de bevestigingsmail vaak in spam.

## Webhook-URL koppelen aan de site

Een n8n-webhook heeft twee URL's:

- **Test-URL** (`/webhook-test/...`) — werkt alleen terwijl je in de editor op
  *"Listen for test event"* klikt. Alleen voor handmatig testen.
- **Productie-URL** (`/webhook/diversions-contact`) — werkt pas als de workflow
  **actief** (toggle rechtsboven) staat.

Stappen:

1. Zet de workflow op **Active**.
2. Kopieer de **productie-URL** uit de Webhook-node.
3. Zet die in de site-env-var **`PUBLIC_CONTACT_WEBHOOK_URL`**
   (`apps/web/.env` + de productie-omgeving op Ploi). Rebuild/deploy de site,
   want bij een statische build wordt de waarde in de client-bundle gebakken.

> Veelgemaakte fout: testen met de test-URL, denken dat het werkt, en op productie
> een dood formulier hebben. Gebruik in de site-env altijd de **productie-URL**.

## Testen vóór livegang (verplicht)

1. Verstuur het formulier op `/contact` één keer met testgegevens.
2. Controleer: notificatiemail kwam binnen op `info@diversions.nl` met alle velden.
3. Controleer: de "invuller" (testadres) kreeg de bevestigingsmail.
4. Foutpad: leeg verplicht veld → browser-validatie blokkeert; honeypot gevuld →
   inzending genegeerd (geen mail).
