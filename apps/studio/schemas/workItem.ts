import { defineType, defineField } from "sanity";
import { CaseIcon } from "@sanity/icons";
import { bodyField } from "./blocks/bodyField";
import { seoField, seoFieldset } from "./objects/seoField";

export const workItem = defineType({
  name: "workItem",
  title: "Work Item",
  type: "document",
  icon: CaseIcon,
  fieldsets: [seoFieldset],
  fields: [
    defineField({
      name: "work",
      title: "Work Description",
      type: "string",
      description: "Brief description of the work",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL segment under /work/",
      options: { source: "work", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "url",
      description: "External link to the project (optional)",
    }),
    defineField({
      name: "company",
      title: "Company",
      type: "string",
      description: "Company name (optional)",
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "string",
      description: "Year of the project (optional)",
    }),
    defineField({
      name: "client",
      title: "Client",
      type: "string",
      description: "Client name (optional)",
    }),
    defineField({
      name: "credits",
      title: "Credits",
      type: "array",
      description: "Team members who worked on this project (optional)",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "name",
              type: "string",
              title: "Name",
              validation: (rule) => rule.required(),
            },
            {
              name: "role",
              type: "string",
              title: "Role",
              validation: (rule) => rule.required(),
            },
          ],
          preview: {
            select: {
              title: "name",
              subtitle: "role",
            },
          },
        },
      ],
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative text",
          validation: (rule) => rule.required(),
        },
      ],
      validation: (rule) => rule.required(),
    }),
    bodyField(),
    seoField(),
  ],
  preview: {
    select: {
      title: "work",
      subtitle: "company",
      media: "thumbnail",
    },
  },
});
