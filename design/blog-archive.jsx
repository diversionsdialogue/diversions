// Blog archive — list of posts + numeric pagination.
// 15 posts per page max.

const { useState, useMemo } = React;

const ALL_POSTS = [
  { id: 1,  title: "Duurzaam webdesign — uitgangspunten en aanpak", excerpt: "Een duurzame site begint bij content-keuzes, niet bij dark mode. Wat we doen om footprint klein te houden.", date: "2025-04-21", author: "Marieke", cat: "design" },
  { id: 2,  title: "Zo bouw je responsive websites die níet schalen", excerpt: "Goede responsiveness is meer dan media-queries. Een korte serie principes uit onze studio-praktijk.", date: "2025-05-08", author: "Joost", cat: "dev" },
  { id: 3,  title: "Top tien web-frameworks voor 2026", excerpt: "Onze (eerlijke) selectie van frameworks waarmee je dit jaar het verschil kunt maken in je projecten.", date: "2025-06-13", author: "Sara", cat: "dev" },
  { id: 4,  title: "Het belang van user-centered design", excerpt: "User-centered design (UCD) is een cruciaal onderdeel van het maken van interfaces die werken — en blijven werken.", date: "2026-03-02", author: "Marieke", cat: "ux" },
  { id: 5,  title: "Vijf essentiële vaardigheden voor web development", excerpt: "Web-dev verandert snel; deze vijf vaardigheden helpen je mee te bewegen zonder telkens opnieuw te moeten beginnen.", date: "2026-03-29", author: "Joost", cat: "dev" },
  { id: 6,  title: "De opkomst van AI in webdevelopment", excerpt: "AI verandert hoe we sites en webapps bouwen. Een verkenning van wat dat in de praktijk betekent.", date: "2026-04-19", author: "Sara", cat: "ai" },
  { id: 7,  title: "Type, type, type — onze briefing voor designers", excerpt: "Hoe we onze typografie-keuzes briefen, en waarom we vrijwel nooit met meer dan twee fonts werken.", date: "2025-09-04", author: "Marieke", cat: "design" },
  { id: 8,  title: "Waarom we geen Figma-libraries publiceren", excerpt: "Een impopulaire mening — en waarom het werk er beter van wordt voor onze opdrachtgevers.", date: "2025-09-18", author: "Joost", cat: "design" },
  { id: 9,  title: "Notities over een rommelig proces", excerpt: "Goed werk is zelden een rechte lijn. Wat we leerden van een traject dat helemaal anders liep dan gepland.", date: "2025-10-02", author: "Sara", cat: "proces" },
  { id: 10, title: "Een kort experiment met variabele typografie", excerpt: "We schreven een Astro-component waarmee je in real-time door een lettertype-as schuift. Werkt verrassend goed.", date: "2025-10-16", author: "Marieke", cat: "design" },
  { id: 11, title: "Wat een web-app traag maakt — en hoe je het oplost", excerpt: "Een korte handleiding voor performance-debugging zonder Lighthouse-paniek.", date: "2025-11-04", author: "Joost", cat: "dev" },
  { id: 12, title: "Twee nieuwe cases — Atelier Noord & Hof & Co", excerpt: "Een terugblik op twee projecten die we dit kwartaal opleverden, met cijfers en eerlijke lessen.", date: "2025-11-22", author: "Sara", cat: "proces" },
  { id: 13, title: "AI-tooling in onze ontwerp-flow (de eerlijke versie)", excerpt: "Wat we wel gebruiken, wat we níet gebruiken, en waar we voorzichtig in blijven.", date: "2025-12-09", author: "Marieke", cat: "ai" },
  { id: 14, title: "Onze briefing-template — voor de nieuwsgierigen", excerpt: "We delen 'm. Een eenvoudig sjabloon dat ons helpt scope vooraf scherp te krijgen.", date: "2025-12-22", author: "Joost", cat: "proces" },
  { id: 15, title: "Wat we leerden van interviews bij een museum", excerpt: "Vijftien gesprekken later weet je vrij precies wat een instelling nodig heeft van een nieuwe site.", date: "2026-01-10", author: "Sara", cat: "ux" },
  { id: 16, title: "Astro of Next? Een keuze-checklist", excerpt: "Niet de hele tijd, maar voor marketing-sites is Astro vrijwel altijd het juiste antwoord. Hier is waarom.", date: "2026-01-28", author: "Joost", cat: "dev" },
  { id: 17, title: "Ontwerp-systemen die niet aanvoelen als een ketting", excerpt: "Hoe we componentbibliotheken bouwen die je teams ondersteunen zonder ze vast te zetten.", date: "2026-02-14", author: "Marieke", cat: "design" },
  { id: 18, title: "Toegankelijkheid als ontwerp-uitgangspunt", excerpt: "WCAG is geen checklist achteraf. Een paar gewoontes die we in elk traject inbouwen.", date: "2026-02-28", author: "Sara", cat: "ux" },
  { id: 19, title: "Een week in de studio — april 2026", excerpt: "Een korte vlog-stijl post over wat er deze week op tafel lag: drie pitches, één launch, vier koffie.", date: "2026-03-07", author: "Joost", cat: "proces" },
  { id: 20, title: "Hoe we copy schrijven in twee talen tegelijk", excerpt: "Tweetalige sites hoeven niet plat te worden. Een paar trucs uit onze redactie-praktijk.", date: "2026-03-21", author: "Marieke", cat: "design" },
  { id: 21, title: "AI-generated illustraties — wanneer wel, wanneer niet", excerpt: "We gebruiken ze, maar zelden in opleveringen. Hier is onze vuistregel.", date: "2026-04-04", author: "Sara", cat: "ai" },
  { id: 22, title: "De terugkomst van CSS — geen grap", excerpt: "Vanilla CSS is de laatste twee jaar zo opgeschoten dat we frameworks vaker overslaan.", date: "2026-04-12", author: "Joost", cat: "dev" },
];

const POSTS_PER_PAGE = 15;

const MONTHS = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

function BlogArchive() {
  const [page, setPage] = useState(1);
  const [cat, setCat] = useState("all");

  // Sync filter with the inert top nav (purely visual; clicks live here too).
  React.useEffect(() => {
    const filters = document.querySelectorAll(".ba-filter");
    function onClick(e) {
      e.preventDefault();
      const next = e.currentTarget.dataset.cat;
      setCat(next);
      setPage(1);
      filters.forEach(f => f.classList.toggle("active", f.dataset.cat === next));
    }
    filters.forEach(f => f.addEventListener("click", onClick));
    return () => filters.forEach(f => f.removeEventListener("click", onClick));
  }, []);

  const posts = useMemo(() => {
    return cat === "all" ? ALL_POSTS : ALL_POSTS.filter(p => p.cat === cat);
  }, [cat]);

  const pages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * POSTS_PER_PAGE;
  const slice = posts.slice(start, start + POSTS_PER_PAGE);

  return (
    <>
      <section className="ba-grid">
        {slice.map(p => (
          <a key={p.id} href="blog-post.html" className="ba-card">
            <div className="meta">
              <span className="author">{p.author}</span>
              <span>·</span>
              <span>{formatDate(p.date)}</span>
            </div>
            <h3>{p.title}</h3>
            <p>{p.excerpt}</p>
          </a>
        ))}
      </section>
      <Pager page={safePage} pages={pages} onChange={setPage} />
    </>
  );
}

function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null;

  // Build numeric pager: 1 … (page-1, page, page+1) … last
  const items = [];
  const add = (n) => items.push(n);

  add(1);
  const left = Math.max(2, page - 1);
  const right = Math.min(pages - 1, page + 1);
  if (left > 2) items.push("…");
  for (let i = left; i <= right; i++) add(i);
  if (right < pages - 1) items.push("…");
  if (pages > 1) add(pages);

  return (
    <nav className="ba-pager" aria-label="Paginering">
      <button
        className={"ba-page" + (page === 1 ? " disabled" : "")}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Vorige pagina"
      >←</button>

      {items.map((it, i) =>
        it === "…"
          ? <span key={"e"+i} className="ba-page-ellipsis">…</span>
          : <button
              key={it}
              className={"ba-page" + (it === page ? " active" : "")}
              onClick={() => onChange(it)}
              aria-current={it === page ? "page" : undefined}
            >{it}</button>
      )}

      <button
        className={"ba-page" + (page === pages ? " disabled" : "")}
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        aria-label="Volgende pagina"
      >→</button>
    </nav>
  );
}

Object.assign(window, { BlogArchive });
