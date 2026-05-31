import { defineType, defineField } from "sanity";
import { InfoOutlineIcon } from "@sanity/icons";

// Shared block: notice / callout ("Onze regel"). Fields follow CLAUDE.md §4.
export const noticeBlock = defineType({
  name: "noticeBlock",
  title: "Notice",
  type: "object",
  icon: InfoOutlineIcon,
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: 'e.g. "Onze regel"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "text",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "text" },
  },
});
