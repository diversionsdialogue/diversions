/**
 * slugify — stabiele, herbruikbare slug voor kop-id's en anchors.
 * Gebruikt door PortableText (id's op koppen) én de servicepagina (anchor naar
 * de "Wat is…"-kop). Beide MOETEN dezelfde functie gebruiken zodat de anchor matcht.
 */
export function slugify(input: string): string {
  return (input || "")
    .toString()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // diacrieten weg
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
