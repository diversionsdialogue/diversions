# Deploy naar Ploi — diversions.nl (Astro statisch + Sanity)

Recept om de site op een **bestaande Ploi-server** (Hetzner) te draaien op een
**tijdelijke URL** (preview). De oude WordPress-site blijft ondertussen live op
`diversions.nl`; pas bij definitieve cutover wijs je het echte domein hierheen.

> De site is een **statische** Astro-build (SSG → `apps/web/dist/`). In productie
> draait er dus géén Node-runtime: nginx serveert kant-en-klare HTML. Node/pnpm zijn
> alleen nodig tijdens de **build** (deploy-stap).

---

## 0. Vooraf op de server (eenmalig)

- **Node ≥ 20** (lokaal draait Node 24) beschikbaar voor de `ploi`-gebruiker.
  Installeer via Ploi → Server → **Node.js**, of check met `node -v`.
- **pnpm** beschikbaar: `corepack enable` (zit bij Node ≥ 16.13) of `npm i -g pnpm`.
  Check: `pnpm -v` (lokaal: 9.15.0).

## 1. Site aanmaken in Ploi

1. Ploi → je server → **New Site**.
2. **Domain:** de tijdelijke URL (bv. het Ploi-testdomein of een subdomein zoals
   `preview.diversions.nl`). **Niet** `diversions.nl` zelf — dat blijft naar de oude
   site wijzen.
3. **Project type:** Static HTML / "no framework" (geen PHP nodig).
4. **Web Directory:** zet op **`/apps/web/dist`**
   (volledige pad wordt dan `/home/ploi/<site>/apps/web/dist`).

## 2. Repository koppelen

1. Site → **Repository** → provider GitHub, repo `diversionsdialogue/diversions`,
   branch **`main`**.
2. Ploi plaatst een **deploy key**; autoriseer die in GitHub als daarom gevraagd wordt.
3. Nog **niet** deployen — eerst de env (stap 3) en het deploy-script (stap 4).

## 3. Secrets op de server (NIET in git)

De build leest `apps/web/.env`. Dat bestand staat in `.gitignore`, dus het komt niet
mee met de clone — je maakt het **eenmalig handmatig** aan op de server en het blijft
bij elke `git pull` staan (untracked).

Maak `/home/ploi/<site>/apps/web/.env` met:

```
SANITY_PROJECT_ID=t13muaka
SANITY_DATASET=production
SANITY_API_VERSION=2024-01-01
SANITY_TOKEN=<je-Sanity-token>
PUBLIC_CONTACT_WEBHOOK_URL=https://diversions-connect-u67534.vm.elestio.app/webhook/contact-diversions
```

> De `SANITY_TOKEN` is een read-token voor de build. Zet 'm hier op de server (of via
> Ploi's env-beheer), nooit in de repo. `apps/studio/.env` is **niet** nodig voor de
> sitebuild (de Studio host je los).

## 4. Deploy-script (Ploi → Site → Deploy Script)

```bash
cd /home/ploi/{SITE_DIRECTORY}

git pull origin main

# pnpm beschikbaar maken (zie stap 0)
corepack enable >/dev/null 2>&1 || true

pnpm install --frozen-lockfile
pnpm build:web

echo "Build klaar: $(date)"
```

`pnpm build:web` schrijft naar `apps/web/dist/` — exact de Web Directory uit stap 1.
Omdat het statisch is, hoeft er geen service herstart te worden.

> Faalt de build op ontbrekende env? Dan ontbreekt `apps/web/.env` (stap 3) of staat
> Node/pnpm niet op het PATH van de `ploi`-gebruiker (stap 0).

## 5. nginx-config (Ploi → Site → **Manage** → nginx)

Binnen het bestaande `server { }`-blok toevoegen/aanpassen:

### 5a. Statische serving + nette URL's
```nginx
index index.html;
# Astro bouwt /pagina/index.html. Probeer bestand, map-index, dan .html, anders 404.
location / {
    try_files $uri $uri/index.html $uri.html /404.html;
}
error_page 404 /404.html;
```

### 5b. Tijdelijke URL niet laten indexeren (BELANGRIJK)
Zolang dit een preview is naast de live oude site:
```nginx
add_header X-Robots-Tag "noindex, nofollow" always;
```
(Verwijder deze regel pas bij de definitieve cutover naar `diversions.nl`.)

### 5c. 301/410-redirects
Plak de inhoud van **`seo-redirects.conf`** (projectroot) in het `server { }`-blok.
Dat zijn de 301-redirects (oude WP-paden → nieuwe) en de 410's. De `www → non-www`-
regel uit dat bestand is alleen relevant op het échte domein; op de tijdelijke URL
mag je 'm overslaan.

Na elke nginx-wijziging: Ploi test + reload automatisch (of `nginx -t && reload`).

## 6. Eerste deploy

Ploi → Site → **Deploy Now**. Controleer in de deploy-log dat `pnpm build:web`
slaagt en "X page(s) built" toont (nu ~75).

## 7. Controle op de tijdelijke URL

- [ ] Homepage + een paar diensten/blogs/cases laden.
- [ ] Een oude WP-URL test de redirect (bv. `/insights` → `/services/insights`).
- [ ] Een 410-pad geeft echt 410 (bv. `/marketing-automation`).
- [ ] `X-Robots-Tag: noindex` aanwezig (check met DevTools → Network → response headers).
- [ ] **Contactformulier:** werkt pas als je in de n8n Webhook-node de tijdelijke
      origin toevoegt aan "Allowed Origins (CORS)" (naast `https://diversions.nl`),
      én de n8n-workflow actief is. Anders blokkeert de browser de POST.

## 8. Later: definitieve cutover naar diversions.nl (NIET nu)

Pas ná akkoord + prelaunch-scan: DNS van `diversions.nl` naar deze server, site-domein
in Ploi wijzigen (of nieuwe site op het echte domein), SSL (Let's Encrypt via Ploi),
de `noindex`-header (5b) verwijderen, en de `www → non-www`-redirect activeren.

---

### Nog open vóór een échte livegang (niet blokkerend voor de preview)
- Contactformulier getest + n8n-workflow actief (zie `n8n/README-contactformulier.md`).
- Prelaunch-scan (broken links / go-no-go).
- Geconsolideerde interne-links-pass (zie `seo-opruimpunten.md`).
