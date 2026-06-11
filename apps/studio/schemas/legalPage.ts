import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";
import { bodyField } from "./blocks/bodyField";
import { seoField, seoFieldset } from "./objects/seoField";

export const legalPage = defineType({
  name: "legalPage",
  title: "Legal Page",
  type: "document",
  icon: DocumentTextIcon,
  fieldsets: [seoFieldset],
  fields: [
    defineField({
      name: "page",
      title: "Page Title",
      type: "string",
      description: "Title of the legal page (e.g., Privacy, Terms, etc.)",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "pubDate",
      title: "Last Updated",
      type: "date",
      description: "Date when this legal document was last updated",
      validation: (rule) => rule.required(),
    }),
    // Portable Text, net als post/service/workItem — de route rendert het via
    // <PortableText>. (Was eerst plain text; dat brak de rendering.)
    bodyField({ required: true }),
    seoField(),
  ],
  preview: {
    select: {
      title: "page",
      subtitle: "pubDate",
    },
  },
});
