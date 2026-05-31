// Contact form — controlled inputs, validation, success state.

function ContactForm() {
  const [data, setData] = React.useState({
    name: "", email: "", company: "", projectType: "Web", budget: "10–25k", message: "",
  });
  const [errors, setErrors] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);

  const set = (k) => (e) => setData(d => ({ ...d, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!data.name.trim()) e.name = "Vul je naam in";
    if (!/^\S+@\S+\.\S+$/.test(data.email)) e.email = "Geen geldig e-mailadres";
    if (!data.message.trim() || data.message.trim().length < 10) e.message = "Schrijf even iets meer (min. 10 tekens)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (validate()) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="contact-form-card">
        <div className="thanks reveal">
          <div className="thanks-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4 4 10-10" />
            </svg>
          </div>
          <h2 className="section-title" style={{ fontSize: 36, margin: "0 0 12px" }}>Bedankt — we lezen het.</h2>
          <p style={{ maxWidth: "32ch", margin: "0 auto" }}>
            Je bericht is binnen. We reageren binnen één werkdag, meestal sneller. Tot snel.
          </p>
          <button className="btn btn-outline" style={{ marginTop: 24 }} onClick={() => { setSubmitted(false); setData({ name: "", email: "", company: "", projectType: "Web", budget: "10–25k", message: "" }); }}>
            Nog een bericht
          </button>
        </div>
      </div>
    );
  }

  const projectTypes = ["Web", "Merk", "Product", "Anders"];
  const budgets = ["< 10k", "10–25k", "25–50k", "50k+"];

  return (
    <form className="contact-form-card" onSubmit={submit} noValidate>
      <div className="form-grid two-col">
        <div className="field">
          <label htmlFor="name">Naam <span className="req">*</span></label>
          <input id="name" className={"input" + (errors.name ? " has-error" : "")} type="text" value={data.name} onChange={set("name")} placeholder="Voor- en achternaam" />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="email">E-mail <span className="req">*</span></label>
          <input id="email" className={"input" + (errors.email ? " has-error" : "")} type="email" value={data.email} onChange={set("email")} placeholder="jij@bedrijf.nl" />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="field full">
          <label htmlFor="company">Bedrijf</label>
          <input id="company" className="input" type="text" value={data.company} onChange={set("company")} placeholder="Optioneel" />
        </div>

        <div className="field full">
          <label>Type project</label>
          <div className="chip-row" role="radiogroup" aria-label="Type project">
            {projectTypes.map(t => (
              <label key={t} className={"chip" + (data.projectType === t ? " checked" : "")}>
                <input type="radio" name="projectType" value={t} checked={data.projectType === t} onChange={set("projectType")} />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div className="field full">
          <label>Budget-indicatie</label>
          <div className="chip-row" role="radiogroup" aria-label="Budget">
            {budgets.map(b => (
              <label key={b} className={"chip" + (data.budget === b ? " checked" : "")}>
                <input type="radio" name="budget" value={b} checked={data.budget === b} onChange={set("budget")} />
                {b}
              </label>
            ))}
          </div>
        </div>

        <div className="field full">
          <label htmlFor="message">Vertel iets over je project <span className="req">*</span></label>
          <textarea id="message" className={"textarea" + (errors.message ? " has-error" : "")} value={data.message} onChange={set("message")} placeholder="Wat ga je maken? Wat is de aanleiding? Een paar zinnen is genoeg." />
          {errors.message && <span className="field-error">{errors.message}</span>}
        </div>

        <div className="field full" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <small style={{ color: "var(--ink-mute)" }}>We reageren binnen één werkdag.</small>
          <button type="submit" className="btn btn-primary btn-arrow">Verstuur bericht</button>
        </div>
      </div>
    </form>
  );
}

function ContactInfo() {
  return (
    <aside className="contact-info">
      <div className="contact-info-block">
        <h4>E-mail</h4>
        <p><a href="mailto:hallo@diversions.nl">hallo@diversions.nl</a></p>
      </div>
      <div className="contact-info-block">
        <h4>Bellen</h4>
        <p><a href="tel:+31201234567">+31 (0)20 123 4567</a></p>
      </div>
      <div className="contact-info-block">
        <h4>Studio</h4>
        <p>Keizersgracht 123<br/>1015 CJ Amsterdam<br/>Nederland</p>
      </div>
      <div className="contact-info-block">
        <h4>Openingstijden</h4>
        <p>Maandag – vrijdag<br/>09:00 – 18:00 CET</p>
      </div>
      <div className="contact-info-block" style={{ background: "var(--color-pink-200)", padding: 24, borderRadius: 16, border: "1px solid color-mix(in oklch, var(--color-pink-400) 50%, transparent)" }}>
        <h4 style={{ color: "var(--color-yellow-700)" }}>Liever even bellen?</h4>
        <p style={{ fontSize: 15, color: "var(--ink-soft)", fontFamily: "var(--font-sans)", fontWeight: 400 }}>
          Plan een vrijblijvend kennismakingsgesprek van dertig minuten. We luisteren — geen verkooppraatje.
        </p>
        <a href="#" className="btn btn-dark" style={{ marginTop: 12 }}>Plan een gesprek →</a>
      </div>
    </aside>
  );
}

Object.assign(window, { ContactForm, ContactInfo });
