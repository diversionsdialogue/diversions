// Homepage sections — Hero, Services, Work, Quote
// Each component is small enough to keep this file readable.

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-grid">
        <h1 className="hero-title">
          Web&shy;development<br />en <em>creatieve</em> studio.
        </h1>
        <div>
          <p className="hero-intro">
            We zijn een team van <strong>ontwerpers en developers</strong> dat samenwerkt aan unieke, betekenisvolle ervaringen — van merk tot product, van eerste schets tot live release.
          </p>
          <div className="hero-cta-row">
            <a href="contact.html" className="btn btn-primary btn-arrow">Start een project</a>
            <a href="#work" className="btn btn-outline">Bekijk werk</a>
          </div>
        </div>
      </div>

      <div className="hero-image">
        <img src="assets/hero.png" alt="Studiowerkplek met sculpturale staande lamp en grote ramen" />
      </div>

      <div className="hero-meta">
        <div className="hero-meta-item">
          <div className="label">Studio</div>
          <div className="value">Amsterdam, NL</div>
        </div>
        <div className="hero-meta-item">
          <div className="label">Sinds</div>
          <div className="value">2018</div>
        </div>
        <div className="hero-meta-item">
          <div className="label">Specialisatie</div>
          <div className="value">Merk · Web · Product</div>
        </div>
        <div className="hero-meta-item">
          <div className="label">Beschikbaar</div>
          <div className="value" style={{ color: "var(--color-yellow-600)" }}>● voor zomer 2026</div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const items = [
    { n: "01", title: "Merkstrategie",      desc: "Positionering, naamgeving en een visuele taal die jaren meegaat — geen mood-board, wel een fundament." },
    { n: "02", title: "Webdevelopment",     desc: "Schone, snelle sites en webapps. Astro, React, Tailwind. Goed gebouwd, prettig te onderhouden." },
    { n: "03", title: "Productontwerp",     desc: "Van flow tot pixel. We ontwerpen met code in gedachten, zodat het werk soepel landt in productie." },
    { n: "04", title: "Content & redactie", desc: "Korte zinnen, geen jargon. Copy die het werk laat zien, niet zichzelf op de voorgrond drukt." },
  ];
  return (
    <section className="section" id="services">
      <div className="section-head">
        <div>
          <span className="eyebrow">Wat we doen</span>
          <h2 className="section-title">Eén team, één toon, <em>één resultaat</em>.</h2>
        </div>
        <p className="section-lead">
          We werken in kleine teams van twee tot vier mensen — strategie, ontwerp en development zitten dicht op elkaar. Geen handover-cultuur, wel snelle iteraties.
        </p>
      </div>

      <div className="services-list">
        {items.map(it => (
          <div className="service-row" key={it.n}>
            <span className="service-num">{it.n}</span>
            <h3 className="service-title">{it.title}</h3>
            <p className="service-desc">{it.desc}</p>
            <span className="service-arrow">→</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Work() {
  const cases = [
    { tag: "Case study", title: "Atelier Noord — merkidentiteit & site", desc: "Een nieuwe huisstijl en headless CMS-site voor een meubelmaker uit Groningen.", year: "2025", img: "assets/work1.png" },
    { tag: "Case study", title: "Hof & Co — productontwerp",            desc: "Van eerste flow tot productieklaar design system voor een B2B-portaal.",        year: "2025", img: "assets/about.jpeg" },
    { tag: "Blog",       title: "Gereedschap dient het werk",            desc: "Een korte notitie over waarom we onze stack klein en saai houden.",                year: "2024", img: "assets/blog1.jpeg" },
    { tag: "Case study", title: "Veld — campagnesite in vier weken",     desc: "Snel ontwerp en bouw van een campagnesite met een strakke tijdlijn.",              year: "2024", img: "assets/hero.png" },
  ];
  return (
    <section className="section" id="work" style={{ background: "var(--color-accent-100)" }}>
      <div className="section-head">
        <div>
          <span className="eyebrow">Geselecteerd werk</span>
          <h2 className="section-title">Recent gemaakt — met aandacht.</h2>
        </div>
        <p className="section-lead">
          Een klein deel van wat we de afgelopen jaren maakten. Vraag gerust naar de rest — niet alles staat online.
        </p>
      </div>

      <div className="work-grid">
        {cases.map((c, i) => (
          <a className="work-card" href="#" key={i}>
            <div className="img-wrap">
              <img src={c.img} alt="" />
            </div>
            <div className="body">
              <span className="work-tag">{c.tag}</span>
              <h3 className="work-title">{c.title}</h3>
              <p className="work-desc">{c.desc}</p>
              <div className="work-meta">
                <span>{c.year}</span>
                <span>Lees verder →</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Quote() {
  return (
    <section className="section" id="about">
      <div className="quote-block">
        <span className="quote-mark">"</span>
        <p className="quote-text">
          Een goed ontwerp is onzichtbaar — het laat het werk doen wat het moet doen, zonder zichzelf op de voorgrond te dringen.
        </p>
        <div className="quote-attr">
          <span className="avatar">MV</span>
          <div>
            <div className="quote-who">Marieke van der Velde</div>
            <div className="quote-role">Creative director, Diversions</div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Hero, Services, Work, Quote });
