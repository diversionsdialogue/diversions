import { defineType, defineField } from "sanity";
import { OlistIcon } from "@sanity/icons";

// Shared block: numbered list (werkwijze/stappen and stats grids). The optional
// `number` lets it cover both numbered steps and a stats/number grid (CLAUDE.md §4
// open point). Fields follow the block API in CLAUDE.md §4.
export const numberedList = defineType({
  name: "numberedList",
  title: "Numbered List",
  type: "object",
  icon: OlistIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      validation: (rule) => rule.min(1),
      of: [
        {
          type: "object",
          fields: [
            {
              name: "number",
              type: "string",
              title: "Number",
              description: "Optional explicit number/stat (e.g. 1, 95%)",
            },
            {
              name: "label",
              type: "string",
              title: "Label",
              validation: (rule) => rule.required(),
            },
            {
              name: "text",
              type: "text",
              title: "Text",
            },
          ],
          preview: {
            select: { title: "label", subtitle: "text", number: "number" },
            prepare({ title, subtitle, number }) {
              return { title: number ? `${number}. ${title}` : title, subtitle };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "title", items: "items" },
    prepare({ title, items }) {
      const count = Array.isArray(items) ? items.length : 0;
      return { title: title || "Numbered List", subtitle: `${count} item${count === 1 ? "" : "s"}` };
    },
  },
});
