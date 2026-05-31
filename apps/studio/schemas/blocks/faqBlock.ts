import { defineType, defineField } from "sanity";
import { HelpCircleIcon } from "@sanity/icons";

// Shared block: FAQ accordion. The schema only delivers the data (items[] with
// question/answer). Accessibility (aria-expanded, keyboard) and the FAQPage
// Schema.org structured data are handled in the Astro component (theme/quality agent).
// Fields follow the block API in CLAUDE.md §4.
export const faqBlock = defineType({
  name: "faqBlock",
  title: "FAQ",
  type: "object",
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: "items",
      title: "Questions",
      type: "array",
      validation: (rule) => rule.min(1),
      of: [
        {
          type: "object",
          fields: [
            {
              name: "question",
              type: "string",
              title: "Question",
              validation: (rule) => rule.required(),
            },
            {
              name: "answer",
              type: "text",
              title: "Answer",
              validation: (rule) => rule.required(),
            },
          ],
          preview: {
            select: { title: "question", subtitle: "answer" },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare({ items }) {
      const count = Array.isArray(items) ? items.length : 0;
      return { title: "FAQ", subtitle: `${count} question${count === 1 ? "" : "s"}` };
    },
  },
});
