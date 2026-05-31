// Shared site components — Header, Footer, Marquee.
// Exposes them on window so the page entry script can use them.

const { useState, useEffect } = React;

function Header({ active = "home" }) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "index.html",   label: "Home",     key: "home" },
    { href: "werk.html",     label: "Werk",     key: "work" },
    { href: "services.html", label: "Services", key: "services" },
    { href: "doelgroepen.html", label: "Doelgroepen", key: "audiences" },
    { href: "blog.html", label: "Blog", key: "blog" },
    { href: "index.html#about",    label: "Over ons", key: "about" },
    { href: "contact.html", label: "Contact",  key: "contact" },
  ];
  return (
    <>
      <header className="site-header">
        <a href="index.html" className="brand" aria-label="Diversions home">
          <img src="assets/diversions-logo.svg" alt="Diversions" />
        </a>
        <nav className="nav-desktop" aria-label="Hoofdnavigatie">
          {links.map(l => (
            <a key={l.key} href={l.href} className={l.key === active ? "active" : ""}>{l.label}</a>
          ))}
        </nav>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Zoeken">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
          <a href="contact.html" className="btn btn-primary btn-arrow" style={{ display: "none" }} id="header-cta">
            Start een project
          </a>
          <a href="contact.html" className="btn btn-primary btn-arrow header-cta-desktop">
            Start een project
          </a>
          <button
            className="icon-btn menu-btn"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open
                ? <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>
                : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>
              }
            </svg>
          </button>
        </div>
      </header>
      <div className={"mobile-menu" + (open ? " open" : "")}>
        {links.map(l => (
          <a key={l.key} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
        ))}
      </div>
    </>
  );
}

function Marquee({ tone = "peach", items = [], speed = 40 }) {
  const cls = "marquee marquee-" + tone;
  // Duplicate the list so the loop is seamless.
  const renderRow = () => (
    <span>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <span style={{ display: "inline-flex", alignItems: "center" }}>{it}</span>
          <span className="dot" />
        </React.Fragment>
      ))}
    </span>
  );
  return (
    <div className={cls}>
      <div className="marquee-track" style={{ animationDuration: speed + "s" }}>
        {renderRow()}
        {renderRow()}
      </div>
    </div>
  );
}

function ContactCTA() {
  return (
    <section className="contact-cta" id="contact-cta">
      <div>
        <span className="eyebrow">Klaar om te beginnen</span>
        <h2 className="contact-cta-title">
          Laten we iets <em>moois</em> bouwen.
        </h2>
      </div>
      <div>
        <p className="contact-cta-text">
          Vertel ons over je project — een kort bericht is genoeg om te starten. We reageren binnen één werkdag.
        </p>
        <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="contact.html" className="btn btn-primary btn-arrow">Stuur een bericht</a>
          <a href="mailto:hallo@diversions.nl" className="btn" style={{ background: "transparent", color: "#fff", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)" }}>hallo@diversions.nl</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col footer-brand">
          <img src="assets/diversions-logo.svg" alt="Diversions" />
          <p className="footer-tagline">
            Een klein, ambitieus studio uit Nederland. We maken merken, sites en producten die werken — voor mensen, niet voor algoritmes.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="#" className="icon-btn" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg>
            </a>
            <a href="#" className="icon-btn" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 13v4"/></svg>
            </a>
            <a href="#" className="icon-btn" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 19c-4 1.5-4-2-6-2m12 4v-3.5a3 3 0 0 0-.8-2.2c2.6-.3 5.3-1.3 5.3-5.7a4.4 4.4 0 0 0-1.2-3 4 4 0 0 0-.1-3s-1-.3-3.3 1.2a11.5 11.5 0 0 0-6 0C6.6 3.3 5.6 3.6 5.6 3.6a4 4 0 0 0-.1 3 4.4 4.4 0 0 0-1.2 3c0 4.3 2.7 5.4 5.3 5.7-.3.4-.6 1-.7 1.7-.6.3-2.2 0-3-2"/></svg>
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Studio</h4>
          <a href="index.html#about">Over ons</a>
          <a href="#">Team</a>
          <a href="#">Vacatures</a>
          <a href="#">Pers</a>
        </div>
        <div className="footer-col">
          <h4>Werk</h4>
          <a href="index.html#work">Cases</a>
          <a href="index.html#services">Services</a>
          <a href="#">Proces</a>
          <a href="blog-post.html">Blog</a>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <a href="mailto:hallo@diversions.nl">hallo@diversions.nl</a>
          <a href="tel:+31201234567">+31 (0)20 123 4567</a>
          <a href="#">Amsterdam, NL</a>
          <a href="contact.html">Start een project →</a>
        </div>
      </div>
      <div className="footer-base">
        <span>© {new Date().getFullYear()} Diversions. Gemaakt in Amsterdam.</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="#">Privacy</a>
          <a href="#">Voorwaarden</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Header, Marquee, Footer, ContactCTA });
