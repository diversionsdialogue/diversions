import { defineType, defineField } from "sanity";
import { UlistIcon } from "@sanity/icons";

// Shared block: bullet list (bullets / venn cells). `columns` supports the
// 2-column (venn) layout. Fields follow the block API in CLAUDE.md §4.
export const bulletList = defineType({
  name: "bulletList",
  title: "Bullet List",
  type: "object",
  icon: UlistIcon,
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
      of: [{ type: "string" }],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "columns",
      title: "Columns",
      type: "number",
      description: "1 (default) or 2 for the venn-style two-column layout",
      options: {
        list: [
          { title: "1 column", value: 1 },
          { title: "2 columns", value: 2 },
        ],
        layout: "radio",
      },
      initialValue: 1,
    }),
  ],
  preview: {
    select: { title: "title", items: "items" },
    prepare({ title, items }) {
      const count = Array.isArray(items) ? items.length : 0;
      return { title: title || "Bullet List", subtitle: `${count} item${count === 1 ? "" : "s"}` };
    },
  },
});
