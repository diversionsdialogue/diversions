import { defineType, defineField } from "sanity";
import { PlayIcon } from "@sanity/icons";

// Shared block: video embed. AVG/consent on the embed is handled in the Astro
// component (Fase 6). Fields follow the block API in CLAUDE.md §4.
export const videoBlock = defineType({
  name: "videoBlock",
  title: "Video",
  type: "object",
  icon: PlayIcon,
  fields: [
    defineField({
      name: "videoUrl",
      title: "Video URL / Embed",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "poster",
      title: "Poster",
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
    defineField({
      name: "label",
      title: "Label",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "videoUrl", media: "poster" },
    prepare({ title, subtitle, media }) {
      return { title: title || "Video", subtitle, media };
    },
  },
});
