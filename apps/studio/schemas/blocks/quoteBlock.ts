import { defineType, defineField } from "sanity";
import { BlockquoteIcon } from "@sanity/icons";

// Shared block: pull quote. Fields follow the block API in CLAUDE.md §4.
export const quoteBlock = defineType({
  name: "quoteBlock",
  title: "Quote",
  type: "object",
  icon: BlockquoteIcon,
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "text",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "quote", subtitle: "author" },
  },
});
