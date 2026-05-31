// Blog template helpers — minimal header, related grid, newsletter form.

function BlogHeader() {
  return (
    <header className="site-header">
      <a href="index.html" className="back-link" aria-label="Terug naar Diversions">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11.5 4.5 7 9 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Terug naar Diversions
      </a>
      <a href="index.html" className="brand" aria-label="Diversions home">
        <img src="assets/diversions-logo.svg" alt="Diversions" />
      </a>
      <div className="header-actions">
        <a href="contact.html" className="icon-btn" aria-label="Contact">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="m3 7 9 6 9-6"/>
          </svg>
        </a>
      </div>
    </header>
  );
}

function ShareRail() {
  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
  };
  return (
    <div className="post-share">
      <span className="label">Delen</span>
      <a href="#" className="icon-btn" aria-label="Twitter / X">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.51 7.44L22 22h-6.94l-4.84-6.32L4.6 22H2l6.97-7.96L1.5 2h7.07l4.38 5.79L18.244 2Zm-1.22 18h1.65L7.05 4H5.32l11.7 16Z"/></svg>
      </a>
      <a href="#" className="icon-btn" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 13v4"/></svg>
      </a>
      <button className="icon-btn" aria-label="Kopieer link" onClick={copy}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>
      </button>
    </div>
  );
}

function AuthorCard({ initials, name, role, bio }) {
  return (
    <div className="author-card">
      <span className="avatar-lg">{initials}</span>
      <div>
        <div className="author-meta-eyebrow">Geschreven door</div>
        <h4>{name}</h4>
        <p>{bio}</p>
      </div>
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const submit = (e) => { e.preventDefault(); if (/^\S+@\S+\.\S+$/.test(email)) setSent(true); };
  return (
    <div className="newsletter">
      <h3>Nieuwsbrief — éénmaal per maand</h3>
      <p>Korte updates over wat we maken, lezen en denken. Geen marketing-spam.</p>
      {sent ? (
        <p style={{ color: "var(--color-yellow-700)", fontWeight: 600 }}>Bedankt — bevestiging is onderweg.</p>
      ) : (
        <form onSubmit={submit}>
          <input type="email" placeholder="jij@bedrijf.nl" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit" className="btn btn-primary">Aanmelden</button>
        </form>
      )}
    </div>
  );
}

function RelatedPosts({ items = [] }) {
  return (
    <section className="related">
      <div className="related-inner">
        <div className="related-head">
          <h2>Lees ook</h2>
          <a href="#">Alle artikelen →</a>
        </div>
        <div className="related-grid">
          {items.map((p, i) => (
            <a key={i} href="#" className="related-card">
              <div className="img"><img src={p.img} alt="" /></div>
              <div className="body">
                <span className="meta">{p.tag} · {p.read}</span>
                <h3>{p.title}</h3>
                <p className="excerpt">{p.excerpt}</p>
                <div className="read-more"><span>{p.date}</span><span>Lees →</span></div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { BlogHeader, ShareRail, AuthorCard, Newsletter, RelatedPosts });
