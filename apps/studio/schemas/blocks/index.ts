// Shared block object-types (live inside the Portable Text `body` array).
import { ctaBlock } from "./ctaBlock";
import { faqBlock } from "./faqBlock";
import { quoteBlock } from "./quoteBlock";
import { noticeBlock } from "./noticeBlock";
import { videoBlock } from "./videoBlock";
import { numberedList } from "./numberedList";
import { bulletList } from "./bulletList";

export const blockTypes = [
  ctaBlock,
  faqBlock,
  quoteBlock,
  noticeBlock,
  videoBlock,
  numberedList,
  bulletList,
];

// Names of the custom blocks, reused by the shared `body` Portable Text field.
export const customBlockNames = [
  "ctaBlock",
  "faqBlock",
  "quoteBlock",
  "noticeBlock",
  "videoBlock",
  "numberedList",
  "bulletList",
] as const;
