// Import all schemas generated from PROJECT_CONTENT_MODEL
import { teamMember } from "./teamMember";
import { workItem } from "./workItem";
import { service } from "./service";
import { post } from "./post";
import { legalPage } from "./legalPage";
import { page } from "./page";
// Shared block object-types used inside the Portable Text `body` of
// post / service / workItem (CLAUDE.md §4).
import { blockTypes } from "./blocks";
// Shared reusable object-types (not documents). The `seo` object is referenced
// as an optional `seo` field on the public-page document types.
import { seo } from "./objects/seo";

// Export schema types array
// 5 document types matchen de 5 content-collecties; `page` is een extra,
// Sanity-only documenttype voor losse pagina's (bv. Wij zijn Diversions).
// The block object-types are NOT documents/collections — they are reusable
// objects that live inside the `body` Portable Text array.
export const schemaTypes = [
  // Documents
  teamMember,
  workItem,
  service,
  post,
  legalPage,
  page,
  // Shared blocks (object types)
  ...blockTypes,
  // Shared reusable objects (referenced as named fields)
  seo,
];
