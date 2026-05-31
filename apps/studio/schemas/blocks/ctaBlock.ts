import { defineType, defineField } from "sanity";
import { RocketIcon } from "@sanity/icons";

// Shared block: Call-to-action. Lives inside the Portable Text `body` array.
// Fields follow the block API in CLAUDE.md §4 (proposal until Fase 1 finalises it).
export const ctaBlock = defineType({
  name: "ctaBlock",
  title: "CTA",
  type: "object",
  icon: RocketIcon,
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "text",
    }),
    defineField({
      name: "buttonLabel",
      title: "Button Label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "buttonHref",
      title: "Button Href",
      type: "string",
      description: "Internal path (e.g. /contact) or external URL",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "variant",
      title: "Variant",
      type: "string",
      options: {
        list: [
          { title: "Default", value: "default" },
          { title: "Sage", value: "sage" },
        ],
        layout: "radio",
      },
      initialValue: "default",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative text",
        },
      ],
    }),
  ],
  preview: {
    select: { title: "heading", subtitle: "buttonLabel", media: "image" },
    prepare({ title, subtitle, media }) {
      return { title: title || "CTA", subtitle: subtitle ? `Button: ${subtitle}` : undefined, media };
    },
  },
});
