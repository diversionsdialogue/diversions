/**
 * submitCalculatorLead — gedeelde submit-fetch voor de offerte-starter
 * rekenmodules (stap 3). Zelfde logica als het contactformulier
 * (apps/web/src/pages/contact.astro), maar generiek gemaakt zodat de 4
 * calculators 'm kunnen hergebruiken i.p.v. de fetch/foutafhandeling 4×
 * te dupliceren. Honeypot-check en button-state blijven per component
 * (die kennen hun eigen DOM), dit bestand doet alleen de POST.
 */
export async function submitCalculatorLead(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; message: string }> {
  if (!webhookUrl) {
    return {
      ok: false,
      message:
        "Verzenden is nog niet geconfigureerd. Mail ons direct op info@diversions.nl.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return {
      ok: true,
      message: "Bedankt! We hebben je aanvraag ontvangen en nemen snel contact met je op.",
    };
  } catch (err) {
    console.error("Offerteaanvraag verzenden mislukt:", err);
    return {
      ok: false,
      message:
        "Er ging iets mis bij het verzenden. Probeer het later opnieuw of mail ons op info@diversions.nl.",
    };
  }
}
