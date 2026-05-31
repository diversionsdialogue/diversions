#!/usr/bin/env python3
"""
afbeeldingen.py

Downloadt de afbeeldingen uit een (of meerdere) inventaris-afbeeldingen.json,
zoals dat door wxr_naar_contentbron.py is gegenereerd. Pakt de originele
resolutie (canonical_url), dedupliceert, en bouwt een manifest met de mapping
oude URL -> lokaal bestand. Optioneel herschrijft het de afbeeldingspaden in de
opgeschoonde MD-bestanden.

Dit is bewust een los script: het downloaden raakt de live oude site en is puur
deterministisch werk (geen LLM-tokens waard). De alt-tekst-generatie voor wat
nog ontbreekt en de optimalisatie (AVIF/WebP, responsive) horen later thuis bij
de quality-agent.

Gebruik:
    # eerst kijken wat het zou doen (geen download):
    python3 afbeeldingen.py content-bron/inventaris-afbeeldingen.json --dry-run

    # echt downloaden naar ./media/ :
    python3 afbeeldingen.py \\
        content-bron/inventaris-afbeeldingen.json \\
        content-bron-paginas/inventaris-afbeeldingen.json \\
        --media-dir media

    # ook de paden in de MD herschrijven naar /media/<bestand>:
    python3 afbeeldingen.py content-bron/inventaris-afbeeldingen.json \\
        --media-dir media --rewrite-dir content-bron/artikelen

Alleen de Python-standaardbibliotheek nodig (urllib).
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlparse

UA = "Mozilla/5.0 (compatible; afbeeldingen.py migratie-script)"


# --------------------------------------------------------------------------- #
def load_inventories(paths):
    """Meerdere inventarissen inladen en dedupliceren op canonical_url."""
    by_canon = {}
    for p in paths:
        data = json.loads(Path(p).read_text(encoding="utf-8"))
        for entry in data:
            c = entry["canonical_url"]
            if c not in by_canon:
                by_canon[c] = {
                    "canonical_url": c,
                    "varianten": list(entry.get("varianten", [])),
                    "alt": entry.get("alt"),
                    "alt_bron": entry.get("alt_bron", "geen"),
                    "gevonden_op": list(entry.get("gevonden_op", [])),
                }
            else:
                e = by_canon[c]
                for v in entry.get("varianten", []):
                    if v not in e["varianten"]:
                        e["varianten"].append(v)
                for g in entry.get("gevonden_op", []):
                    if g not in e["gevonden_op"]:
                        e["gevonden_op"].append(g)
                if not e["alt"] and entry.get("alt"):
                    e["alt"], e["alt_bron"] = entry["alt"], entry.get("alt_bron", "geen")
    return list(by_canon.values())


def target_filename(url, taken):
    """Platte, veilige bestandsnaam; botsingen krijgen een suffix."""
    name = os.path.basename(urlparse(url).path)
    name = unquote(name)
    name = re.sub(r"[^A-Za-z0-9._-]", "-", name) or "afbeelding"
    stem, ext = os.path.splitext(name)
    candidate = name
    i = 2
    while candidate in taken and taken[candidate] != url:
        candidate = f"{stem}-{i}{ext}"
        i += 1
    taken[candidate] = url
    return candidate


def download(url, dest, timeout, retries=2):
    """Eén bestand downloaden. Geeft (ok, foutmelding)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last = ""
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
            dest.write_bytes(data)
            return True, ""
        except urllib.error.HTTPError as e:
            return False, f"HTTP {e.code}"  # 404 e.d.: niet retryen
        except Exception as e:  # noqa: BLE001 timeouts, conn-resets
            last = str(e)
            time.sleep(1 + attempt)
    return False, last or "onbekende fout"


# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser(description="Download afbeeldingen uit het inventaris")
    ap.add_argument("inventaris", nargs="+",
                    help="een of meer inventaris-afbeeldingen.json bestanden")
    ap.add_argument("--media-dir", default="media", help="map om naartoe te downloaden")
    ap.add_argument("--public-path", default="/media",
                    help="pad-prefix dat in de MD komt (bv. /media of /images)")
    ap.add_argument("--rewrite-dir", default=None,
                    help="map met .md-bestanden waarin paden herschreven worden")
    ap.add_argument("--timeout", type=int, default=20)
    ap.add_argument("--dry-run", action="store_true",
                    help="toon het plan, download/herschrijf niets")
    args = ap.parse_args()

    items = load_inventories(args.inventaris)
    media = Path(args.media_dir)
    if not args.dry_run:
        media.mkdir(parents=True, exist_ok=True)

    taken, manifest, status = {}, [], Counter()
    pad_map = {}  # elke oude URL (canonical + varianten) -> nieuw pad

    print(f"{len(items)} unieke afbeeldingen in het inventaris.")
    print(f"{'DRY-RUN: ' if args.dry_run else ''}downloaden naar {media}/\n")

    for it in items:
        canon = it["canonical_url"]
        fname = target_filename(canon, taken)
        dest = media / fname
        new_ref = f"{args.public_path.rstrip('/')}/{fname}"

        if args.dry_run:
            st, err = "gepland", ""
        elif dest.exists():
            st, err = "bestond-al", ""
        else:
            ok, err = download(canon, dest, args.timeout)
            if not ok:
                # val terug op de eerste (verkleinde) variant als die afwijkt
                fallback = next((v for v in it["varianten"] if v != canon), None)
                if fallback:
                    ok2, err2 = download(fallback, dest, args.timeout)
                    if ok2:
                        st, err = "ok-via-variant", ""
                    else:
                        st, err = "MISLUKT", f"{err} / variant: {err2}"
                else:
                    st, err = "MISLUKT", err
            else:
                st, err = "ok", ""

        status[st] += 1
        if st not in ("MISLUKT",):
            for old in [canon] + it["varianten"]:
                pad_map[old] = new_ref
        if st in ("MISLUKT",) or err:
            print(f"  [{st}] {canon}  {err}")

        manifest.append({
            "canonical_url": canon, "bestand": fname, "nieuw_pad": new_ref,
            "status": st, "fout": err or None, "alt": it["alt"],
            "alt_bron": it["alt_bron"], "varianten": it["varianten"],
            "gevonden_op": it["gevonden_op"],
        })

    # Manifest wegschrijven
    out_manifest = media.parent / "afbeeldingen-manifest.json"
    if not args.dry_run:
        out_manifest.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # Paden herschrijven in de MD (opt-in)
    rewritten = 0
    if args.rewrite_dir and not args.dry_run:
        rewritten = rewrite_markdown(Path(args.rewrite_dir), pad_map)

    # Samenvatting
    print("\n--- Samenvatting ---")
    for k, v in status.most_common():
        print(f"  {k}: {v}")
    zonder_alt = sum(1 for m in manifest if not m["alt"])
    print(f"  zonder alt-tekst (voor quality-agent): {zonder_alt}")
    if not args.dry_run:
        print(f"\nManifest: {out_manifest}")
        if args.rewrite_dir:
            print(f"Paden herschreven in {rewritten} MD-bestanden ({args.rewrite_dir}).")
    else:
        print("\n(DRY-RUN: niets gedownload of gewijzigd.)")


def rewrite_markdown(md_dir, pad_map):
    """Vervang oude afbeeldings-URL's door het nieuwe pad in alle .md."""
    count = 0
    # langste URL's eerst, zodat varianten niet half vervangen worden
    keys = sorted(pad_map.keys(), key=len, reverse=True)
    for md_file in md_dir.rglob("*.md"):
        txt = md_file.read_text(encoding="utf-8")
        new = txt
        for old in keys:
            if old in new:
                new = new.replace(old, pad_map[old])
        if new != txt:
            md_file.write_text(new, encoding="utf-8")
            count += 1
    return count


if __name__ == "__main__":
    sys.exit(main())
