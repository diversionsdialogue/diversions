// Services archive — list of services with tag filter + numeric pager.
// 9 per page (3x3 grid). Filter syncs with the .sa-tag chips in the header.

const { useState, useMemo } = React;

const ALL_SERVICES = [
  { id: 1, title: "Branding & identiteit",
    excerpt: "Een merk dat past bij wie je bent en waar je heen wilt — van strategie en naamgeving tot logo, type, kleur en richtlijnen.",
    tags: ["branding", "strategie"] },
  { id: 2, title: "Web design",
    excerpt: "Heldere, doordachte websites met aandacht voor typografie, ritme en details — voor merken die op willen vallen door rust.",
    tags: ["digital", "branding"] },
  { id: 3, title: "Webdevelopment",
    excerpt: "Snelle, toegankelijke en schaalbare sites — gebouwd in Astro, Next of een headless CMS van jouw keuze.",
    tags: ["digital"] },
  { id: 4, title: "Productontwerp",
    excerpt: "App- en webproduct-ontwerp dat verder gaat dan schermen — flows, copy, edge cases en alles ertussenin.",
    tags: ["digital", "research"] },
  { id: 5, title: "Motion & video",
    excerpt: "Korte interface-animaties, brandfilms en explainers die je verhaal versterken zonder de aandacht te stelen.",
    tags: ["motion"] },
  { id: 6, title: "Designsystemen",
    excerpt: "Componentbibliotheken die je teams ondersteunen zonder ze vast te zetten — getest, gedocumenteerd, onderhoudbaar.",
    tags: ["digital", "branding"] },
  { id: 7, title: "Strategie & positionering",
    excerpt: "Onderzoek, gesprekken en workshops om scherp te krijgen wie je bent, voor wie je werkt, en wat je belooft.",
    tags: ["strategie", "research"] },
  { id: 8, title: "Content & copy",
    excerpt: "Tone of voice, paginastructuur en redactie — in het Nederlands, Engels of beide tegelijk, zonder dat het plat wordt.",
    tags: ["branding", "strategie"] },
  { id: 9, title: "Print & editorial",
    excerpt: "Boeken, jaarverslagen, magazines en uitnodigingen — gedrukte stukken met dezelfde zorg als ons digitale werk.",
    tags: ["branding"] },
  { id: 10, title: "User research",
    excerpt: "Interviews, kwalitatieve studies en bruikbaarheidstests — zodat je beslissingen baseert op gedrag, niet op aannames.",
    tags: ["research", "strategie"] },
  { id: 11, title: "Workshops & trainingen",
    excerpt: "In-house sessies over merkrichtlijnen, designsystemen en samenwerken tussen design en development.",
    tags: ["strategie"] },
  { id: 12, title: "E-commerce",
    excerpt: "Shopify- en Stripe-koppelingen — productpagina's en checkout-flows die converteren zonder schreeuwerig te zijn.",
    tags: ["digital"] },
  { id: 13, title: "Illustratie & art direction",
    excerpt: "Custom illustraties, fotografie-direction en moodboarding voor campagnes en merkontwikkeling.",
    tags: ["branding", "motion"] },
  { id: 14, title: "Onderhoud & doorontwikkeling",
    excerpt: "Doorlopende ondersteuning na lancering — kleine verbeteringen, A/B-tests en nieuwe modules per kwartaal.",
    tags: ["digital"] },
];

const PER_PAGE = 9;

function ServicesArchive() {
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState("all");

  React.useEffect(() => {
    const tags = document.querySelectorAll(".sa-tag");
    function onClick(e) {
      e.preventDefault();
      const next = e.currentTarget.dataset.tag;
      setTag(next);
      setPage(1);
      tags.forEach(t => t.classList.toggle("active", t.dataset.tag === next));
    }
    tags.forEach(t => t.addEventListener("click", onClick));
    return () => tags.forEach(t => t.removeEventListener("click", onClick));
  }, []);

  const filtered = useMemo(() =>
    tag === "all" ? ALL_SERVICES : ALL_SERVICES.filter(s => s.tags.includes(tag))
  , [tag]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safe = Math.min(page, pages);
  const slice = filtered.slice((safe - 1) * PER_PAGE, safe * PER_PAGE);

  return (
    <>
      <section className="sa-grid">
        {slice.map(s => (
          <a key={s.id} href="services-detail.html" className="sa-card">
            <h3>{s.title}</h3>
            <p>{s.excerpt}</p>
            <div className="sa-card-tags">
              {s.tags.map(t => <span key={t} className="sa-card-tag">{t}</span>)}
            </div>
          </a>
        ))}
      </section>
      <SaPager page={safe} pages={pages} onChange={setPage} />
    </>
  );
}

function SaPager({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const items = [];
  items.push(1);
  const left = Math.max(2, page - 1);
  const right = Math.min(pages - 1, page + 1);
  if (left > 2) items.push("…");
  for (let i = left; i <= right; i++) items.push(i);
  if (right < pages - 1) items.push("…");
  if (pages > 1) items.push(pages);

  return (
    <nav className="sa-pager" aria-label="Paginering">
      <button
        className={"sa-page" + (page === 1 ? " disabled" : "")}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Vorige pagina"
      >←</button>
      {items.map((it, i) =>
        it === "…"
          ? <span key={"e"+i} className="sa-page-ellipsis">…</span>
          : <button
              key={it}
              className={"sa-page" + (it === page ? " active" : "")}
              onClick={() => onChange(it)}
              aria-current={it === page ? "page" : undefined}
            >{it}</button>
      )}
      <button
        className={"sa-page" + (page === pages ? " disabled" : "")}
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        aria-label="Volgende pagina"
      >→</button>
    </nav>
  );
}

Object.assign(window, { ServicesArchive });
