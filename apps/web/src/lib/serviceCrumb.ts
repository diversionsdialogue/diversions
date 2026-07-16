/**
 * Kruimelpad-ouder voor een dienstpagina, afgeleid uit de Sanity-categorieën.
 * Zelfde driedeling als de hoofdnavigatie: onderzoeken -> Onderzoek
 * (/onze-diensten), methodes + oplossingen -> Methodes (/methodes),
 * branches -> Branches (/branches). Gedeeld door ServicesLayout (artikel-hero)
 * en ServicePitch (calculator-hero) zodat de mapping op één plek staat.
 */
export interface ServiceCrumb {
  label: string;
  href: string;
}

export function crumbForCategories(
  categories?: string[] | null
): ServiceCrumb | undefined {
  const cats = categories ?? [];
  if (cats.includes("onderzoeken"))
    return { label: "Onderzoek", href: "/onze-diensten" };
  if (cats.includes("methodes") || cats.includes("oplossingen"))
    return { label: "Methodes", href: "/methodes" };
  if (cats.includes("branches"))
    return { label: "Branches", href: "/branches" };
  return undefined;
}
