import { defineType, defineField } from "sanity";
import { RocketIcon } from "@sanity/icons";
import { bodyField } from "./blocks/bodyField";
import { seoField, seoFieldset } from "./objects/seoField";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  icon: RocketIcon,
  fieldsets: [seoFieldset],
  fields: [
    defineField({
      name: "service",
      title: "Service Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL segment under /services/",
      options: { source: "service", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Brief description of the service",
      validation: (rule) => rule.required(),
    }),
    bodyField({ required: true }),
    seoField(),
  ],
  preview: {
    select: {
      title: "service",
      subtitle: "description",
    },
  },
});
