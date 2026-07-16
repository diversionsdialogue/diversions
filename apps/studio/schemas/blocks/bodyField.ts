import { defineField } from "sanity";
import { customBlockNames } from "./index";

/**
 * Shared Portable Text `body` field, reused by post / service / workItem so the
 * three types stay in parity. Contains:
 *  - a standard `block` (H2/H3, normal, quote style, bullet/number lists, marks)
 *    — these are normal Portable Text styles, NOT separate block types;
 *  - inline images;
 *  - the custom shared block object-types (CTA, FAQ, quote, notice, video,
 *    numberedList, bulletList).
 *
 * Pass { required: true } for types where body is mandatory (post, service);
 * leave it off for workItem where body is optional.
 */
export function bodyField(opts: { required?: boolean } = {}) {
  return defineField({
    name: "body",
    title: "Body Content",
    type: "array",
    description: "Main content. Mix rich text with shared blocks.",
    of: [
      {
        type: "block",
        styles: [
          { title: "Normal", value: "normal" },
          { title: "Heading 2", value: "h2" },
          { title: "Heading 3", value: "h3" },
          { title: "Quote", value: "blockquote" },
        ],
        lists: [
          { title: "Bullet", value: "bullet" },
          { title: "Numbered", value: "number" },
        ],
        marks: {
          decorators: [
            { title: "Strong", value: "strong" },
            { title: "Emphasis", value: "em" },
          ],
          annotations: [
            {
              name: "link",
              type: "object",
              title: "Link",
              fields: [
                {
                  name: "href",
                  type: "url",
                  title: "URL",
                  validation: (rule) =>
                    rule.uri({ scheme: ["http", "https", "mailto", "tel"], allowRelative: true }),
                },
              ],
            },
          ],
        },
      },
      {
        type: "image",
        options: { hotspot: true },
        fields: [
          { name: "alt", type: "string", title: "Alternative text" },
          {
            name: "caption",
            type: "string",
            title: "Bijschrift",
            description:
              "Optioneel. Met bijschrift krijgt de afbeelding automatisch het " +
              "kader met bijschriftbalk (design 'Afbeelding in context', 1c). " +
              "Tip: 'Figuur 5 — omschrijving' maakt het deel vóór het " +
              "gedachtestreepje vet.",
          },
        ],
      },
      ...customBlockNames.map((name) => ({ type: name })),
    ],
    ...(opts.required ? { validation: (rule: any) => rule.required() } : {}),
  });
}
