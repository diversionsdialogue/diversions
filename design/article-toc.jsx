// TOC + scroll-spy for the services article page.
// Builds the TOC from real h2/h3 elements in the article so adding sections is just HTML.

function slugify(s) {
  return s.toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ArticleTOC({ articleSelector = "#article", title = "In dit hoofdstuk" }) {
  const [sections, setSections] = React.useState([]);
  const [activeH2, setActiveH2] = React.useState(null);
  const [activeH3, setActiveH3] = React.useState(null);
  const [progress, setProgress] = React.useState(0);
  const [openMobile, setOpenMobile] = React.useState(false);

  // Build TOC from DOM
  React.useEffect(() => {
    const article = document.querySelector(articleSelector);
    if (!article) return;
    const headings = Array.from(article.querySelectorAll("h2, h3"));
    const built = [];
    let current = null;
    headings.forEach((el) => {
      if (!el.id) el.id = slugify(el.textContent);
      if (el.tagName === "H2") {
        current = { id: el.id, text: el.textContent, children: [], el };
        built.push(current);
      } else if (current) {
        current.children.push({ id: el.id, text: el.textContent, el });
      }
    });
    setSections(built);
  }, [articleSelector]);

  // Scroll-spy + progress
  React.useEffect(() => {
    if (sections.length === 0) return;
    const article = document.querySelector(articleSelector);
    const flat = [];
    sections.forEach(h2 => {
      flat.push({ kind: "h2", id: h2.id, el: h2.el });
      h2.children.forEach(h3 => flat.push({ kind: "h3", id: h3.id, el: h3.el, parent: h2.id }));
    });

    const onScroll = () => {
      const top = window.scrollY + 120;
      let curH2 = sections[0]?.id || null;
      let curH3 = null;
      flat.forEach(item => {
        const y = item.el.getBoundingClientRect().top + window.scrollY;
        if (y <= top) {
          if (item.kind === "h2") { curH2 = item.id; curH3 = null; }
          else                    { curH2 = item.parent; curH3 = item.id; }
        }
      });
      setActiveH2(curH2);
      setActiveH3(curH3);

      // Progress: how far through the article body
      if (article) {
        const rect = article.getBoundingClientRect();
        const total = article.offsetHeight - window.innerHeight;
        const passed = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        setProgress(Math.round((passed / Math.max(total, 1)) * 100));
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [sections, articleSelector]);

  const TocBody = (
    <div className={"toc" + (openMobile ? " open" : "")} id="toc-body">
      <div className="toc-eyebrow">Inhoud</div>
      <h2 className="toc-title">{title}</h2>
      <div className="toc-progress-label"><span>Voortgang</span><span>{progress}%</span></div>
      <div className="toc-progress"><div className="toc-progress-bar" style={{ width: progress + "%" }} /></div>
      <ol>
        {sections.map((h2, i) => (
          <li key={h2.id} className={"toc-h2-item" + (activeH2 === h2.id ? " active" : "")}>
            <a
              className={"toc-h2-link" + (activeH2 === h2.id ? " active" : "")}
              href={"#" + h2.id}
              onClick={() => setOpenMobile(false)}
            >
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span>{h2.text}</span>
            </a>
            {h2.children.length > 0 && (
              <ul className="toc-h3-list">
                {h2.children.map(h3 => (
                  <li key={h3.id}>
                    <a
                      className={activeH3 === h3.id ? "active" : ""}
                      href={"#" + h3.id}
                      onClick={() => setOpenMobile(false)}
                    >{h3.text}</a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <div className="toc-wrap">
      <button
        className="toc-mobile-trigger"
        aria-expanded={openMobile}
        aria-controls="toc-body"
        onClick={() => setOpenMobile(o => !o)}
      >
        <span>Inhoud · {progress}%</span>
        <svg className="chev" width="14" height="8" viewBox="0 0 14 8" fill="none">
          <path d="M1 1.5 7 6.5l6-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {TocBody}
    </div>
  );
}

window.ArticleTOC = ArticleTOC;
