import { defineType, defineField } from "sanity";
import { DocumentsIcon } from "@sanity/icons";
import { bodyField } from "./blocks/bodyField";
import { seoField, seoFieldset } from "./objects/seoField";

// Losse, beheerbare pagina (bv. "Wij zijn Diversions"). Body = Portable Text met
// de gedeelde blokken (CLAUDE.md §4); de route rendert het via <PortableText>.
export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: DocumentsIcon,
  fieldsets: [seoFieldset],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL-segment (bv. wij-zijn-diversions)",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      description: "Kleine bovenkop boven de titel (optioneel).",
    }),
    defineField({
      name: "image",
      title: "Uitgelichte afbeelding",
      type: "image",
      description:
        "Optionele afbeelding in de header van de pagina (zoals bij blogartikelen).",
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
    bodyField({ required: true }),
    seoField(),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
  },
});
