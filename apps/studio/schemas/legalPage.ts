import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";
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
    defineField({
      name: "body",
      title: "Body Content",
      type: "text",
      description: "Legal content in markdown format",
      validation: (rule) => rule.required(),
    }),
    seoField(),
  ],
  preview: {
    select: {
      title: "page",
      subtitle: "pubDate",
    },
  },
});
