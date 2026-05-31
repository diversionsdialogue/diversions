// FAQ accordion — small interactive component for the services page.

function FAQ({ items = [] }) {
  const [open, setOpen] = React.useState(0);
  return (
    <div className="faq">
      {items.map((it, i) => (
        <div key={i} className={"faq-item" + (open === i ? " open" : "")}>
          <button
            className="faq-q"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <span>{it.q}</span>
            <span className="plus">+</span>
          </button>
          <div className="faq-a">
            <div className="faq-a-inner">{it.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VideoBlock({ poster, label = "Bekijk de video — 2 min" }) {
  const [playing, setPlaying] = React.useState(false);
  return (
    <div className="video-block" onClick={() => setPlaying(true)}>
      {!playing && <img className="video-poster" src={poster} alt="" />}
      {!playing && (
        <div className="video-overlay">
          <span className="video-play">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor"><path d="M6 4l13 7-13 7z"/></svg>
          </span>
          <span className="video-label">{label}</span>
        </div>
      )}
      {playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--font-subtitle)", fontSize: 14, background: "var(--color-base-900)" }}>
          <span>(Video zou hier afspelen)</span>
        </div>
      )}
    </div>
  );
}

window.FAQ = FAQ;
window.VideoBlock = VideoBlock;
