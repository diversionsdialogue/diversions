/**
 * "Lees ook"-schema voor dienstpagina's (onderzoeken + methodes).
 *
 * Per slug staan hier de VIJF logisch gerelateerde diensten, in weergavevolgorde.
 * De ZESDE kaart is op iedere pagina gereserveerd voor de kostenpagina
 * (/kosten-marktonderzoek) en staat vast als laatste — zie KOSTEN_ITEM.
 *
 * Redactionele logica:
 * - Onderzoeken linken naar de methodes waarmee ze worden uitgevoerd én naar
 *   aangrenzende onderzoeken (bv. customer journey ↔ patient journey).
 * - Methodes linken naar verwante methodes én naar onderzoeken waarin ze
 *   worden toegepast.
 * - Branchepagina's krijgen (bewust) géén Lees ook-blok.
 *
 * Onderhoud: nieuwe dienst in Sanity? Voeg hier een key toe én neem de slug op
 * in een paar bestaande lijsten, anders wordt de nieuwe pagina nergens genoemd.
 */

/** Vaste zesde kaart: de kostenpagina. */
export const KOSTEN_ITEM = {
  href: "/kosten-marktonderzoek",
  title: "Wat kost marktonderzoek?",
  description:
    "Ontdek direct wat de mogelijkheden en kosten van onderzoek zijn, met richtprijzen per onderzoekstype.",
  meta: "Kosten",
} as const;

/** Per dienst-slug: vijf gerelateerde dienst-slugs, in weergavevolgorde. */
export const LEES_OOK: Record<string, string[]> = {
  // --- Onderzoeken ----------------------------------------------------------
  "campagne-effectonderzoek": [
    "pretest",
    "doelgroeponderzoek",
    "kwantitatief-onderzoek",
    "eyetracking-simulatie",
    "waardepropositie",
  ],
  "customer-journey": [
    "patient-journey",
    "micro-journey-de-waardevolle-verdieping-op-customer-journeys",
    "klanttevredenheidsonderzoek",
    "diepte-interviews",
    "diary-study",
  ],
  doelgroeponderzoek: [
    "kwantitatief-onderzoek",
    "kwalitatief-onderzoek",
    "groepsdiscussies",
    "waardepropositie",
    "campagne-effectonderzoek",
  ],
  klanttevredenheidsonderzoek: [
    "nps-enquete",
    "customer-journey",
    "kwantitatief-onderzoek",
    "diepte-interviews",
    "doelgroeponderzoek",
  ],
  "micro-journey-de-waardevolle-verdieping-op-customer-journeys": [
    "customer-journey",
    "patient-journey",
    "diary-study",
    "diepte-interviews",
    "gebruikerstesten",
  ],
  "patient-journey": [
    "customer-journey",
    "micro-journey-de-waardevolle-verdieping-op-customer-journeys",
    "diepte-interviews",
    "diary-study",
    "klanttevredenheidsonderzoek",
  ],
  pretest: [
    "campagne-effectonderzoek",
    "eyetracking-simulatie",
    "groepsdiscussies",
    "kwalitatief-onderzoek",
    "doelgroeponderzoek",
  ],
  waardepropositie: [
    "doelgroeponderzoek",
    "pretest",
    "diepte-interviews",
    "groepsdiscussies",
    "kwalitatief-onderzoek",
  ],

  // --- Methodes --------------------------------------------------------------
  "ai-onderzoek": [
    "kwalitatief-onderzoek",
    "kwantitatief-onderzoek",
    "diepte-interviews",
    "doelgroeponderzoek",
    "customer-journey",
  ],
  "diary-study": [
    "customer-journey",
    "micro-journey-de-waardevolle-verdieping-op-customer-journeys",
    "patient-journey",
    "kwalitatief-onderzoek",
    "gebruikerstesten",
  ],
  "diepte-interviews": [
    "kwalitatief-onderzoek",
    "groepsdiscussies",
    "ai-onderzoek",
    "doelgroeponderzoek",
    "customer-journey",
  ],
  "eyetracking-simulatie": [
    "pretest",
    "gebruikerstesten",
    "campagne-effectonderzoek",
    "kwalitatief-onderzoek",
    "ai-onderzoek",
  ],
  gebruikerstesten: [
    "eyetracking-simulatie",
    "customer-journey",
    "diepte-interviews",
    "diary-study",
    "kwalitatief-onderzoek",
  ],
  groepsdiscussies: [
    "diepte-interviews",
    "kwalitatief-onderzoek",
    "pretest",
    "doelgroeponderzoek",
    "waardepropositie",
  ],
  "kwalitatief-onderzoek": [
    "kwantitatief-onderzoek",
    "diepte-interviews",
    "groepsdiscussies",
    "ai-onderzoek",
    "doelgroeponderzoek",
  ],
  "kwantitatief-onderzoek": [
    "kwalitatief-onderzoek",
    "doelgroeponderzoek",
    "klanttevredenheidsonderzoek",
    "nps-enquete",
    "campagne-effectonderzoek",
  ],
  "nps-enquete": [
    "klanttevredenheidsonderzoek",
    "kwantitatief-onderzoek",
    "customer-journey",
    "diepte-interviews",
    "doelgroeponderzoek",
  ],
};
