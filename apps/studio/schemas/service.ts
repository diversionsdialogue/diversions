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
    // Optionele, korte varianten voor de kaart op het diensten-overzicht.
    // Additief: leeg gelaten valt de site terug op Service Name / Description.
    defineField({
      name: "overviewTitle",
      title: "Titel overzichtspagina",
      type: "string",
      description:
        "Korte naam van het onderzoek, getoond op het diensten-overzicht. Leeg = Service Name.",
    }),
    defineField({
      name: "overviewIntro",
      title: "Inleidingstekst overzichtspagina",
      type: "text",
      rows: 3,
      description:
        "Korte inleiding, getoond op het diensten-overzicht. Leeg = Description.",
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
