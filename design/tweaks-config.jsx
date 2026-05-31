// SiteTweaks — the actual tweak panel UI for the homepage.
// Uses the helpers from tweaks-panel.jsx (TweaksPanel, useTweaks, etc.)

function SiteTweaks({ tweaks, setTweaks }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === "__activate_edit_mode") setVisible(true);
      if (d.type === "__deactivate_edit_mode") setVisible(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const update = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [k]: v } }, "*");
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", right: 16, bottom: 16, width: 280, zIndex: 100,
      background: "#fff", border: "1px solid var(--border)", borderRadius: 16,
      boxShadow: "var(--shadow-lg)", padding: 18, fontFamily: "var(--font-sans)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <strong style={{ fontFamily: "var(--font-subtitle)", fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink)" }}>Tweaks</strong>
        <button
          onClick={() => { setVisible(false); window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); }}
          style={{ background: "transparent", border: 0, fontSize: 18, cursor: "pointer", color: "var(--ink-mute)" }}
          aria-label="Sluit"
        >×</button>
      </div>

      <TweakRow label="Accentkleur">
        <ChipPicker value={tweaks.accent} onChange={(v) => update("accent", v)}
          options={[
            { v: "terracotta", label: "Terracotta" },
            { v: "coral",      label: "Coral" },
            { v: "sage",       label: "Sage" },
          ]} />
      </TweakRow>

      <TweakRow label="Marquee">
        <ChipPicker value={tweaks.marqueeTone} onChange={(v) => update("marqueeTone", v)}
          options={[
            { v: "peach", label: "Peach" },
            { v: "ink",   label: "Ink" },
            { v: "coral", label: "Coral" },
          ]} />
      </TweakRow>

      <TweakToggleRow label="Marquee tonen" value={tweaks.marqueeOn} onChange={(v) => update("marqueeOn", v)} />
      <TweakToggleRow label="Quote sectie" value={tweaks.showQuote} onChange={(v) => update("showQuote", v)} />
      <TweakToggleRow label="Donkere CTA" value={tweaks.darkCTA} onChange={(v) => update("darkCTA", v)} />
    </div>
  );
}

function TweakRow({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: "var(--font-subtitle)", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function TweakToggleRow({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", cursor: "pointer", fontFamily: "var(--font-subtitle)", fontSize: 14, color: "var(--ink)" }}>
      <span>{label}</span>
      <span
        onClick={() => onChange(!value)}
        style={{
          width: 36, height: 20, borderRadius: 999,
          background: value ? "var(--color-yellow-500)" : "var(--color-accent-300)",
          position: "relative", transition: "background 200ms",
        }}>
        <span style={{
          position: "absolute", top: 2, left: value ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          transition: "left 200ms"
        }} />
      </span>
    </label>
  );
}

function ChipPicker({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          style={{
            padding: "6px 12px", borderRadius: 999, fontSize: 13,
            fontFamily: "var(--font-subtitle)", fontWeight: 500,
            border: "1px solid " + (value === o.v ? "var(--ink)" : "var(--border)"),
            background: value === o.v ? "var(--ink)" : "#fff",
            color: value === o.v ? "#fff" : "var(--ink)", cursor: "pointer"
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

window.SiteTweaks = SiteTweaks;
