# -*- coding: utf-8 -*-
"""
Convert-fase (Fase 3) - Route B.

Zet de opgeschoonde WP-export (wp-content/content-bron-*) om naar Astro
Content-Collections-markdown in apps/web/src/content/{posts,services,work}.

Dit is EXACT de contentvorm die het meegeleverde script scripts/migrate-to-sanity.ts
later (met SANITY_TOKEN + project) naar Sanity uploadt.

Belangrijk:
- Er is GEEN Sanity-project / token in deze fase -> we uploaden NIET naar Sanity.
- Content Collections rendert de body als platte markdown (geen MDX). De
  blok-componenten (Faq/Cta/...) renderen pas in Sanity-modus via Portable Text.
  We bewaren de speciale blokken daarom als (a) leesbare markdown EN (b) een
  machine-leesbare HTML-comment-marker (<!-- BLOK:... -->), zodat de latere
  Sanity-conversie ze betrouwbaar naar de bloktypes uit CLAUDE.md s4 kan mappen.
- Afbeeldingen kunnen niet gedownload worden (geen netwerk). De Zod image()-velden
  eisen een lokaal bestand bij de build, dus required image/thumbnail krijgt een
  bestaande placeholder. De echte WP-bron-URL + alt blijven bewaard
  (inline HTML-comment) voor de quality-fase.

Gebruik:
    python scripts/wp-md-naar-collections.py            # alles
    python scripts/wp-md-naar-collections.py --limit 5  # eerste 5 per type (steekproef)
    python scripts/wp-md-naar-collections.py --only post,service,workItem
"""
import json, os, re, glob, argparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_PAGINAS = os.path.join(ROOT, "wp-content", "content-bron-paginas", "pagina")
SRC_BERICHTEN = os.path.join(ROOT, "wp-content", "content-bron-berichten", "artikelen")
CONTENT = os.path.join(ROOT, "apps", "web", "src", "content")
OUT = {
    "post": os.path.join(CONTENT, "posts"),
    "service": os.path.join(CONTENT, "services"),
    "workItem": os.path.join(CONTENT, "work"),
}
PLACEHOLDER = {"post": "/src/images/blog/1.jpeg", "workItem": "/src/images/work/1.png"}
LOCAL_INLINE_IMG = "/src/images/assets/blog.jpeg"

log = []


# ---------- IO ----------

def read_md(path):
    txt = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", txt, re.S)
    if not m:
        return {}, txt
    return parse_simple_yaml(m.group(1)), m.group(2)


def parse_simple_yaml(raw):
    fm, key = {}, None
    for line in raw.splitlines():
        if re.match(r"^\s*-\s", line) and key:
            fm.setdefault(key, [])
            if isinstance(fm[key], list):
                fm[key].append(line.split("-", 1)[1].strip().strip('"'))
            continue
        mm = re.match(r"^(\w+):\s*(.*)$", line)
        if mm:
            key, val = mm.group(1), mm.group(2).strip()
            if val in ("", "[]"):
                fm[key] = []
            elif val == "null":
                fm[key] = None
            else:
                fm[key] = val.strip('"')
    return fm


def yaml_str(s):
    if s is None:
        s = ""
    return '"' + str(s).replace('"', "'").replace("\n", " ").strip() + '"'


def yaml_inline(s):
    return '"' + str(s).replace('"', "'").strip() + '"'


def to_pubdate(datum):
    return str(datum).split(" ")[0] if datum else "2016-01-01"


def first_sentence_description(body, maxlen=180):
    for line in body.splitlines():
        t = line.strip()
        if not t or t.startswith(("#", ">", ":::", "![", "[!", "|", "-", "1.", "[EMBED", "<!--")):
            continue
        t = re.sub(r"\*\*(.*?)\*\*", r"\1", t)
        t = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", t)
        t = re.sub(r"[*_`]", "", t).strip()
        if len(t) < 20:
            continue
        if len(t) > maxlen:
            t = t[:maxlen].rsplit(" ", 1)[0] + "…"
        return t
    return ""


# ---------- blok-conversie ----------

def convert_faq_blocks(body, faq_items):
    pattern = re.compile(r":::faq\s*\nVRAAG:\s*(.*?)\nANTWOORD:\s*(.*?)\n:::", re.S)
    matches = list(pattern.finditer(body))
    if not matches:
        return body
    for m in matches:
        faq_items.append({"question": m.group(1).strip(), "answer": m.group(2).strip()})
    start, end = matches[0].start(), matches[-1].end()
    rendered = ["<!-- BLOK:faqBlock open=0 -->", "", "## Veelgestelde vragen", ""]
    for it in faq_items:
        rendered += ["### " + it["question"], "", it["answer"], ""]
    rendered.append("<!-- /BLOK:faqBlock -->")
    return body[:start] + "\n".join(rendered) + body[end:]


def convert_accordion_blocks(body):
    pattern = re.compile(r":::accordion\s*\nTITEL:\s*(.*?)\nINHOUD:\s*(.*?)\n:::", re.S)
    matches = list(pattern.finditer(body))
    if not matches:
        return body, 0
    out, last, i, n = [], 0, 0, len(matches)
    while i < n:
        group = [matches[i]]
        j = i + 1
        while j < n and body[matches[j - 1].end():matches[j].start()].strip() == "":
            group.append(matches[j]); j += 1
        out.append(body[last:group[0].start()])
        seg = ["<!-- BLOK:accordion (inhoudslijst, geen Q&A) -->", ""]
        for g in group:
            seg += ["**" + g.group(1).strip() + "**", "", g.group(2).strip(), ""]
        seg.append("<!-- /BLOK:accordion -->")
        out.append("\n".join(seg))
        last = group[-1].end()
        i = j
    out.append(body[last:])
    return "".join(out), len(matches)


def convert_embeds(body):
    cnt = [0]
    def repl(m):
        cnt[0] += 1
        kind, url = m.group(1), m.group(2).strip()
        return (f"<!-- BLOK:videoBlock provider={kind} url={url} "
                f"poster=PLACEHOLDER consent=AVG-fase6 -->\n"
                f"[Video bekijken ({kind})]({url})")
    body = re.sub(r"\[EMBED (youtube|vimeo)\]:\s*(\S+)", repl, body)
    return body, cnt[0]


def convert_reusable(body):
    refs = []
    def repl(m):
        ref = m.group(1)
        refs.append(ref)
        return (f"<!-- HANDMATIG: herbruikbaar WP-blok ref={ref} ontbreekt in export; "
                f"live ophalen of opnieuw opbouwen -->\n"
                f"> **[Inhoud handmatig aanvullen - herbruikbaar blok {ref}]** "
                f"De originele inhoud van dit blok zat niet in de WP-export.")
    return re.sub(r">\s*\[!HERBRUIKBAAR-BLOK ref=(\d+)\][^\n]*", repl, body), refs


SHORTCODE_RE = re.compile(
    r"\[(/?)(vc_\w+|fl_builder_insert_layout|do_widget|caption|aioseo_breadcrumbs|"
    r"wp_sitemap_page|display-posts|imap-gj|vc_btn|vc_separator|vc_empty_space|"
    r"vc_single_image|false|true|nederland|Search|ENG|checklist|template|USP)[^\]]*\]"
)


def strip_shortcodes(body, found):
    def repl(m):
        found.add(m.group(2))
        return ""
    body = SHORTCODE_RE.sub(repl, body)
    body = re.sub(r"^#image\\?_title\s*$", "", body, flags=re.M)
    return body


def rewrite_images(body, slug, alt_missing):
    def img_comment(url, title):
        c = f"<!-- IMG originele bron: {url}"
        if title:
            c += f" (title: {title})"
        return c + " -- quality-fase: downloaden+optimaliseren -->"

    def repl_linked(m):
        alt, url, title, href = m.group(1).strip(), m.group(2).strip(), (m.group(3) or "").strip(), m.group(4).strip()
        if not alt:
            alt_missing.append((slug, url))
        return f"{img_comment(url, title)}\n[![{alt}]({LOCAL_INLINE_IMG})]({href})"
    body = re.compile(
        r'\[!\[([^\]]*?)\]\(((?!/src/images)[^\s)]+)(?:\s+"([^"]*)")?\)\]\(([^)\n]+)\)'
    ).sub(repl_linked, body)

    def repl_img(m):
        alt, url, title = m.group(1).strip(), m.group(2).strip(), (m.group(3) or "").strip()
        if not alt:
            alt_missing.append((slug, url))
        return f"{img_comment(url, title)}\n![{alt}]({LOCAL_INLINE_IMG})"
    body = re.compile(
        r'!\[([^\]]*?)\]\(((?!/src/images)[^\s)]+)(?:\s+"([^"]*)")?\)'
    ).sub(repl_img, body)
    return body


def rewrite_internal_links(body):
    return re.sub(r"\(https?://(?:www\.)?diversions\.nl(/[^)\s\"]*)", r"(\1", body)


CTA_LABELS = ("maak kennis", "neem contact", "plan", "start je", "start nu",
              "download", "aanvragen", "vraag aan", "boek", "afspraak",
              "inschrijven", "aanmelden", "offerte", "kennismaken")


def detect_cta(body):
    lines = body.split("\n")
    out, i, n, count = [], 0, len(lines), 0
    link_re = re.compile(r"^\[([^\]]+)\]\(([^)]+)\)\s*$")
    while i < n:
        line = lines[i]
        h = re.match(r"^#{1,4}\s*\**(.+?)\**\s*$", line)
        if h:
            kop = h.group(1).strip()
            j = i + 1
            block = []
            while (j < n and not re.match(r"^#{1,4}\s", lines[j])
                   and not lines[j].startswith(":::") and not lines[j].startswith("<!--")):
                block.append(lines[j]); j += 1
            link_idx = label = href = None
            for k, bl in enumerate(block):
                lm = link_re.match(bl.strip())
                if lm and (lm.group(1).strip().lower().startswith(CTA_LABELS)
                           or lm.group(2).startswith(("tel:", "/contact", "mailto:"))):
                    link_idx, label, href = k, lm.group(1).strip(), lm.group(2).strip()
                    break
            nonempty = [b for b in block if b.strip()]
            if link_idx is not None and len(nonempty) <= 4:
                tekst_lines = [b.strip() for kk, b in enumerate(block) if kk != link_idx and b.strip()]
                tekst = " ".join(re.sub(r"\*\*(.*?)\*\*", r"\1", t) for t in tekst_lines)
                count += 1
                out.append(f"<!-- BLOK:ctaBlock heading={yaml_inline(kop)} "
                           f"buttonLabel={yaml_inline(label)} buttonHref={href} variant=default -->")
                out.append(f"### {kop}")
                if tekst:
                    out += ["", tekst]
                out += ["", f"[{label}]({href})", "<!-- /BLOK:ctaBlock -->"]
                i = j
                continue
        out.append(line)
        i += 1
    return "\n".join(out), count


def collapse_duplicate_hero(body):
    """BB laat vaak een # H1-hero en een identieke ## H2 staan. Verwijder duplicaat-kop."""
    lines = body.split("\n")
    seen = []
    out = []
    removed = 0
    for ln in lines:
        h = re.match(r"^#{1,4}\s*\**(.+?)\**\s*$", ln)
        if h:
            key = h.group(1).strip().lower()
            if key in seen[-3:]:
                removed += 1
                # markeer als verdacht, sla over
                continue
            seen.append(key)
        out.append(ln)
    return "\n".join(out), removed


def clean_body(body, slug, faq_items, refs_holder, counters, shortcodes_found, alt_missing):
    body = convert_faq_blocks(body, faq_items)
    body, ac = convert_accordion_blocks(body)
    counters["accordion"] += ac
    body, vc = convert_embeds(body)
    counters["video"] += vc
    body, refs = convert_reusable(body)
    refs_holder.extend(refs)
    body = strip_shortcodes(body, shortcodes_found)
    body = rewrite_images(body, slug, alt_missing)
    body = rewrite_internal_links(body)
    body, cta = detect_cta(body)
    counters["cta"] += cta
    body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
    return body


# ---------- index + writers ----------

def build_index():
    files = {}
    for base in (SRC_PAGINAS, SRC_BERICHTEN):
        for p in glob.glob(os.path.join(base, "*.md")):
            fm, body = read_md(p)
            slug = fm.get("slug") or os.path.splitext(os.path.basename(p))[0]
            files.setdefault(slug, []).append((p, fm, body))
    return files


def convert_item(d, fm, body):
    st = d["sanity_type"]
    slug = d["nieuwe_url"].rstrip("/").split("/")[-1]
    faq_items, refs, alt_missing, shortcodes = [], [], [], set()
    counters = {"accordion": 0, "video": 0, "cta": 0}
    new_body = clean_body(body, slug, faq_items, refs, counters, shortcodes, alt_missing)

    title = fm.get("titel") or d["titel"]
    desc = fm.get("excerpt") or first_sentence_description(new_body)
    desc_generated = not bool(fm.get("excerpt"))
    tags = fm.get("categorieen") or []
    if isinstance(tags, str):
        tags = [tags] if tags else []
    tags = [t for t in tags if t and t.lower() != "blog"] or ["algemeen"]

    notes = []
    if faq_items:
        notes.append(f"{len(faq_items)} FAQ-items -> faqBlock-marker")
    if counters["accordion"]:
        notes.append(f"{counters['accordion']} accordion-items (geen Q&A) -> markdown")
    if counters["cta"]:
        notes.append(f"{counters['cta']} CTA('s) gedetecteerd -> ctaBlock-marker")
    if counters["video"]:
        notes.append(f"{counters['video']} video-embed(s) -> videoBlock-marker")
    if refs:
        notes.append(f"HANDMATIG herbruikbaar blok(ken): {sorted(set(refs))}")
    if shortcodes:
        notes.append(f"shortcodes gestript: {sorted(shortcodes)}")
    if alt_missing:
        notes.append(f"{len(alt_missing)} afbeelding(en) zonder alt -> quality-fase")
    if desc_generated:
        notes.append("description automatisch afgeleid (geen excerpt)")

    fm_lines = ["---"]
    if st == "post":
        fm_lines += [f"title: {yaml_str(title)}", f"pubDate: {to_pubdate(fm.get('datum'))}",
                     f"description: {yaml_str(desc)}", f"author: {yaml_str(fm.get('auteur') or 'Diversions')}",
                     "image:", f'  url: "{PLACEHOLDER["post"]}"', '  alt: "#_"', "tags:"]
        for t in tags:
            fm_lines.append(f"  - {yaml_str(t)}")
    elif st == "service":
        fm_lines += [f"service: {yaml_str(title)}", f"description: {yaml_str(desc)}"]
    elif st == "workItem":
        # client/company afleiden uit titel ("Case - GGNet" -> "GGNet")
        client = re.sub(r"^\s*case\s*[-:]\s*", "", title, flags=re.I).strip() or title
        fm_lines += [f"work: {yaml_str(title)}",
                     f"company: {yaml_str(client)}",
                     f"client: {yaml_str(client)}",
                     "credits: []",
                     "thumbnail:",
                     f'  url: "{PLACEHOLDER["workItem"]}"',
                     f'  alt: {yaml_str(client + " - project van Diversions")}']
    fm_lines.append("---")

    header = ["<!-- CONVERT-META", f"  oude_url: {d['oude_url']}",
              f"  nieuwe_url: {d['nieuwe_url']}", f"  sanity_type: {st}",
              "  placeholder-afbeelding gebruikt (quality-fase: echte WP-afbeelding plaatsen)"]
    for nn in notes:
        header.append(f"  - {nn}")
    header.append("-->")
    out = "\n".join(fm_lines) + "\n\n" + "\n".join(header) + "\n\n" + new_body
    return slug, out, notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="post,service,workItem")
    args = ap.parse_args()
    only = set(args.only.split(","))

    inv = json.load(open(os.path.join(ROOT, "inventaris.json"), encoding="utf-8"))
    files = build_index()
    for v in OUT.values():
        os.makedirs(v, exist_ok=True)

    counts = {"post": 0, "service": 0, "workItem": 0}
    written = []
    for d in inv:
        st = d.get("sanity_type")
        if st not in only or d.get("bestemming") != "importeren-naar-sanity":
            continue
        if args.limit and counts[st] >= args.limit:
            continue
        slug = d["nieuwe_url"].rstrip("/").split("/")[-1]
        entry = files.get(slug)
        if not entry:
            log.append(f"GEEN MD voor {slug} ({d['oude_url']})")
            continue
        p, fm, body = entry[0]
        out_slug, content, notes = convert_item(d, fm, body)
        open(os.path.join(OUT[st], out_slug + ".md"), "w", encoding="utf-8").write(content)
        counts[st] += 1
        written.append((st, out_slug, notes))
        for nn in notes:
            if nn.startswith("HANDMATIG"):
                log.append(f"{st}/{out_slug}: {nn}")

    print(json.dumps({"counts": counts, "written": len(written)}, ensure_ascii=False))
    for l in log:
        print(l)


if __name__ == "__main__":
    main()
