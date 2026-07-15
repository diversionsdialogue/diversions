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
    defineField({
      name: "image",
      title: "Afbeelding (optioneel)",
      type: "image",
      description:
        "Optionele afbeelding, wordt rond (in een cirkel) rechts naast de quote getoond.",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternatieve tekst",
        },
      ],
    }),
  ],
  preview: {
    select: { title: "quote", subtitle: "author", media: "image" },
  },
});
