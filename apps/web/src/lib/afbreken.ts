/**
 * Zachte afbreekpunten (soft hyphen, U+00AD) op samenstellingsgrenzen.
 *
 * De automatische woordafbreking van de browser (hyphens: auto) kent
 * Nederlandse samenstellingen niet en breekt op lettergrepen: "Doelgroep-
 * onderzoek" wordt "Doelgroe-ponderzoek". Een soft hyphen vóór "onderzoek"
 * stuurt het afbreekpunt naar de samenstellingsgrens. Per CSS-spec schakelt
 * een soft hyphen bovendien de automatische afbreekpunten in dat woord uit,
 * dus de foute varianten verdwijnen vanzelf. Het streepje is onzichtbaar
 * zolang het woord gewoon past.
 *
 * Alleen directe samenstellingen worden geraakt ("Doelgroeponderzoek");
 * losse woorden ("Kwalitatief onderzoek") en al-afgebroken titels
 * ("Waardepropositie-onderzoek") blijven ongemoeid.
 */
export function zachtAfbreken(tekst: string): string {
  // Let op: tussen "$1" en "$2" staat een LETTERLIJK soft hyphen (U+00AD,
  // bytes C2 AD). Het teken is onzichtbaar in de meeste editors; niet
  // "opschonen" en niet hertypen, dan verdwijnt het.
  return tekst.replace(/([a-zà-öø-ü])(onderzoek)/g, "$1­$2");
}
