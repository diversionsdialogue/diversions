// Import all schemas generated from PROJECT_CONTENT_MODEL
import { teamMember } from "./teamMember";
import { workItem } from "./workItem";
import { service } from "./service";
import { post } from "./post";
import { legalPage } from "./legalPage";
// Shared block object-types used inside the Portable Text `body` of
// post / service / workItem (CLAUDE.md §4).
import { blockTypes } from "./blocks";
// Shared reusable object-types (not documents). The `seo` object is referenced
// as an optional `seo` field on the public-page document types.
import { seo } from "./objects/seo";

// Export schema types array
// CRITICAL: 5 document types match the 5 collections in apps/web/src/content/.
// The block object-types are NOT documents/collections — they are reusable
// objects that live inside the `body` Portable Text array.
export const schemaTypes = [
  // Documents (5 collections)
  teamMember,
  workItem,
  service,
  post,
  legalPage,
  // Shared blocks (object types)
  ...blockTypes,
  // Shared reusable objects (referenced as named fields)
  seo,
];
