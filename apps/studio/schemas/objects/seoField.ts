import { defineField } from "sanity";

/**
 * Shared, optional `seo` field, reused by the public-page document types
 * (post / service / workItem / legalPage) so they stay in parity.
 *
 * References the reusable `seo` object-type (see ./seo.ts). It is grouped under
 * a collapsible "SEO" fieldset that renders at the bottom of each document, so
 * existing fields keep their order and behaviour. Fully optional and additive.
 */
export function seoField() {
  return defineField({
    name: "seo",
    title: "SEO",
    type: "seo",
    fieldset: "seo",
  });
}

/**
 * The fieldset definition to add to each document that uses `seoField()`.
 * Collapsed by default so it stays out of the way unless an editor opens it.
 */
export const seoFieldset = {
  name: "seo",
  title: "SEO",
  options: { collapsible: true, collapsed: true },
};
