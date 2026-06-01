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
    // Optionele velden voor de diensten-overzichtspagina (kaart + tag-filter).
    // Additief: bestaande services zonder deze velden blijven geldig.
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      description: "Miniatuur voor het diensten-overzicht.",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative text",
        },
      ],
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      description: "Filtercategorieën voor het diensten-overzicht.",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
        list: [
          { value: "onderzoeken", title: "Onderzoeken" },
          { value: "methodes", title: "Methodes" },
          { value: "oplossingen", title: "Oplossingen" },
          { value: "branches", title: "Branches" },
        ],
      },
    }),
    seoField(),
  ],
  preview: {
    select: {
      title: "service",
      subtitle: "description",
      media: "thumbnail",
    },
  },
});
