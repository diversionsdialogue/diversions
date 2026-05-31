/**
 * Migration Script: Content Collections → Sanity
 *
 * This script reads your existing markdown content and uploads it to Sanity,
 * including images.
 *
 * Usage:
 *   cd scripts
 *   SANITY_TOKEN=your-token npx tsx migrate-to-sanity.ts
 *
 * The script automatically reads SANITY_PROJECT_ID from apps/web/.env
 */

import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { PROJECT_COLLECTIONS } from "./PROJECT_CONTENT_MODEL";
import { markdownToPortableText, type PtNode } from "./markdown-to-portable-text";

// fileURLToPath i.p.v. new URL(...).pathname: op Windows levert .pathname een
// ongeldig pad op (/C:/...), waardoor apps/web/.env nooit geladen werd.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from apps/web/.env
const webEnvPath = path.join(__dirname, "../apps/web/.env");
if (fs.existsSync(webEnvPath)) {
  config({ path: webEnvPath });
}

// Sanity client configuration
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || "production";

if (!projectId) {
  console.error("\n❌ Error: SANITY_PROJECT_ID is missing.");
  console.log("\nMake sure apps/web/.env exists with:");
  console.log("  SANITY_PROJECT_ID=your-project-id");
  console.log("\nOr pass it directly:");
  console.log(
    "  SANITY_PROJECT_ID=your-project-id SANITY_TOKEN=your-token npx tsx migrate-to-sanity.ts"
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN, // You need to set this
  useCdn: false,
});

const WEB_PATH = path.join(__dirname, "../apps/web/src");
const CONTENT_PATH = path.join(WEB_PATH, "content");
const IMAGES_PATH = path.join(WEB_PATH, "images");

// Validation flags
const DRY_RUN = process.argv.includes("--dry-run");
const VALIDATE_ONLY = process.argv.includes("--validate");
const SEED_ALL = process.argv.includes("--seed-all");

// Document IDs that will be created from the single content file per collection (for id-based cleanup)
const SEED_DOCUMENT_IDS = [
  "teamMember-1",
  "workItem-1",
  "service-web-develpment",
  "post-1",
  "legalPage-privacy",
] as const;

const BATCH_SIZE = 25;
const DELAY_AFTER_DELETE_MS = 2500;

// Helper to read markdown files from a directory
function readMarkdownFiles(dir: string) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data, content: body } = matter(content);
    const slug = path.basename(file, ".md");
    return { slug, frontmatter: data, body, filename: file };
  });
}

// Upload an image to Sanity and return the asset reference
async function uploadImage(imagePath: string, altText: string = "") {
  // Handle both /src/images/... and direct paths
  let fullPath = imagePath;

  if (imagePath.startsWith("/src/images/")) {
    const relativePath = imagePath.replace(/^\/src\/images\//, "");
    fullPath = path.join(IMAGES_PATH, relativePath);
  } else if (imagePath.startsWith("http")) {
    // External URL - skip upload
    console.warn(`    ⚠️  External image URL detected: ${imagePath} - cannot upload to Sanity`);
    return null;
  }

  if (!fs.existsSync(fullPath)) {
    console.warn(`    ⚠️  Image not found: ${fullPath}`);
    return null;
  }

  try {
    const imageBuffer = fs.readFileSync(fullPath);
    const asset = await client.assets.upload("image", imageBuffer, {
      filename: path.basename(fullPath),
    });

    return {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: asset._id,
      },
      alt: altText,
    };
  } catch (error) {
    console.error(`    ❌ Failed to upload image: ${fullPath}`, error);
    return null;
  }
}

/**
 * Convert a markdown body to a Sanity Portable Text array.
 *
 * The body field (apps/studio/schemas/blocks/bodyField.ts) is a Portable Text
 * array, NOT a plain string. This delegates to the offline, dependency-free
 * converter in markdown-to-portable-text.ts, which also recognises the Fase-0b
 * markers (:::faq, :::cta, :::accordion, [EMBED ...], HERBRUIKBAAR-BLOK) and
 * emits the real Sanity block-type objects (faqBlock, ctaBlock, videoBlock, ...).
 *
 * Conversion notes (suspicious residue, dropped items, missing alt) are collected
 * per document and printed so the human can review them in Studio.
 */
const conversionLog: string[] = [];

function markdownToText(markdown: string, label = ""): PtNode[] {
  const { blocks, log } = markdownToPortableText(markdown ?? "");
  if (log.length) {
    for (const entry of log) {
      conversionLog.push(`${label ? `[${label}] ` : ""}${entry}`);
    }
  }
  return blocks;
}

// Migration statistics
interface MigrationStats {
  collection: string;
  filesFound: number;
  documentsCreated: number;
  imagesUploaded: number;
  errors: string[];
}

const stats: MigrationStats[] = [];

/**
 * Delete all documents of a given type (batched for reliability)
 */
async function deleteAllByType(type: string): Promise<number> {
  const ids = await client.fetch<string[]>(`*[_type == $type]._id`, { type });
  if (ids.length === 0) return 0;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const tx = client.transaction();
    for (const id of batch) {
      tx.delete(id);
      deleted++;
    }
    await tx.commit();
  }
  return deleted;
}

/**
 * Delete documents by exact IDs (removes leftovers with same id but wrong _type)
 */
async function deleteByIds(ids: readonly string[]): Promise<void> {
  const tx = client.transaction();
  for (const id of ids) {
    tx.delete(id);
  }
  if (ids.length > 0) await tx.commit();
}

/**
 * Full seed: delete all by type, then by exact ids, wait, then migrate
 */
async function runSeedAll() {
  const sanityTypes = Object.values(PROJECT_COLLECTIONS).map((c) => c.sanityType);
  console.log("\n🗑️  Deleting all existing documents by type (batched)...");
  for (const type of sanityTypes) {
    const count = await deleteAllByType(type);
    if (count > 0) console.log(`  Deleted ${count} document(s) of type "${type}"`);
  }
  console.log("\n🗑️  Deleting by exact document IDs (cleanup)...");
  await deleteByIds(SEED_DOCUMENT_IDS);
  console.log(`  Requested delete for IDs: ${SEED_DOCUMENT_IDS.join(", ")}`);
  console.log(`\n⏳ Waiting ${DELAY_AFTER_DELETE_MS}ms for mutations to apply...`);
  await new Promise((r) => setTimeout(r, DELAY_AFTER_DELETE_MS));
  console.log("  Done.\n");
}

/**
 * Migrate Team Members
 */
async function migrateTeamMembers() {
  console.log("\n👥 Migrating Team Members...");
  const collectionName = "team";
  const config = PROJECT_COLLECTIONS[collectionName];
  const teamMembers = readMarkdownFiles(path.join(CONTENT_PATH, collectionName));

  const collectionStats: MigrationStats = {
    collection: collectionName,
    filesFound: teamMembers.length,
    documentsCreated: 0,
    imagesUploaded: 0,
    errors: [],
  };

  for (const member of teamMembers) {
    const { slug, frontmatter, body, filename } = member;
    console.log(`  - ${frontmatter.name} (${filename})`);

    try {
      // Upload avatar image
      let avatar = null;
      if (frontmatter.avatar?.url) {
        avatar = await uploadImage(frontmatter.avatar.url, frontmatter.avatar.alt);
        if (avatar) collectionStats.imagesUploaded++;
      }

      const doc = {
        _type: config.sanityType,
        _id: `${config.sanityType}-${slug}`,
        name: frontmatter.name,
        role: frontmatter.role,
        intro: frontmatter.intro,
        education: frontmatter.education || [],
        experience: frontmatter.experience || [],
        avatar,
        body: markdownToText(body, filename),
      };

      if (!DRY_RUN && !VALIDATE_ONLY) {
        await client.createOrReplace(doc);
        collectionStats.documentsCreated++;
        console.log(`    ✅ Created: ${frontmatter.name}`);
      } else {
        console.log(`    ✓ Validated: ${frontmatter.name}`);
      }
    } catch (error) {
      const errorMsg = `${filename}: ${error}`;
      collectionStats.errors.push(errorMsg);
      console.error(`    ❌ Error: ${errorMsg}`);
    }
  }

  stats.push(collectionStats);
}

/**
 * Migrate Work Items
 */
async function migrateWorkItems() {
  console.log("\n💼 Migrating Work Items...");
  const collectionName = "work";
  const config = PROJECT_COLLECTIONS[collectionName];
  const workItems = readMarkdownFiles(path.join(CONTENT_PATH, collectionName));

  const collectionStats: MigrationStats = {
    collection: collectionName,
    filesFound: workItems.length,
    documentsCreated: 0,
    imagesUploaded: 0,
    errors: [],
  };

  for (const item of workItems) {
    const { slug, frontmatter, body, filename } = item;
    console.log(`  - ${frontmatter.work} (${filename})`);

    try {
      // Upload thumbnail image
      let thumbnail = null;
      if (frontmatter.thumbnail?.url) {
        thumbnail = await uploadImage(frontmatter.thumbnail.url, frontmatter.thumbnail.alt);
        if (thumbnail) collectionStats.imagesUploaded++;
      }

      const doc = {
        _type: config.sanityType,
        _id: `${config.sanityType}-${slug}`,
        link: frontmatter.link,
        company: frontmatter.company,
        year: frontmatter.year,
        client: frontmatter.client,
        work: frontmatter.work,
        credits: frontmatter.credits || [],
        thumbnail,
        body: body ? markdownToText(body, filename) : undefined,
      };

      if (!DRY_RUN && !VALIDATE_ONLY) {
        await client.createOrReplace(doc);
        collectionStats.documentsCreated++;
        console.log(`    ✅ Created: ${frontmatter.work}`);
      } else {
        console.log(`    ✓ Validated: ${frontmatter.work}`);
      }
    } catch (error) {
      const errorMsg = `${filename}: ${error}`;
      collectionStats.errors.push(errorMsg);
      console.error(`    ❌ Error: ${errorMsg}`);
    }
  }

  stats.push(collectionStats);
}

/**
 * Migrate Services
 */
async function migrateServices() {
  console.log("\n🚀 Migrating Services...");
  const collectionName = "services";
  const config = PROJECT_COLLECTIONS[collectionName];
  const services = readMarkdownFiles(path.join(CONTENT_PATH, collectionName));

  const collectionStats: MigrationStats = {
    collection: collectionName,
    filesFound: services.length,
    documentsCreated: 0,
    imagesUploaded: 0,
    errors: [],
  };

  for (const service of services) {
    const { slug, frontmatter, body, filename } = service;
    console.log(`  - ${frontmatter.service} (${filename})`);

    try {
      const doc = {
        _type: config.sanityType,
        _id: `${config.sanityType}-${slug}`,
        service: frontmatter.service,
        description: frontmatter.description,
        body: markdownToText(body, filename),
      };

      if (!DRY_RUN && !VALIDATE_ONLY) {
        await client.createOrReplace(doc);
        collectionStats.documentsCreated++;
        console.log(`    ✅ Created: ${frontmatter.service}`);
      } else {
        console.log(`    ✓ Validated: ${frontmatter.service}`);
      }
    } catch (error) {
      const errorMsg = `${filename}: ${error}`;
      collectionStats.errors.push(errorMsg);
      console.error(`    ❌ Error: ${errorMsg}`);
    }
  }

  stats.push(collectionStats);
}

/**
 * Migrate Posts
 */
async function migratePosts() {
  console.log("\n📝 Migrating Posts...");
  const collectionName = "posts";
  const config = PROJECT_COLLECTIONS[collectionName];
  const posts = readMarkdownFiles(path.join(CONTENT_PATH, collectionName));

  const collectionStats: MigrationStats = {
    collection: collectionName,
    filesFound: posts.length,
    documentsCreated: 0,
    imagesUploaded: 0,
    errors: [],
  };

  for (const post of posts) {
    const { slug, frontmatter, body, filename } = post;
    console.log(`  - ${frontmatter.title} (${filename})`);

    try {
      // Upload featured image
      let image = null;
      if (frontmatter.image?.url) {
        image = await uploadImage(frontmatter.image.url, frontmatter.image.alt);
        if (image) collectionStats.imagesUploaded++;
      }

      const doc = {
        _type: config.sanityType,
        _id: `${config.sanityType}-${slug}`,
        title: frontmatter.title,
        pubDate: frontmatter.pubDate
          ? new Date(frontmatter.pubDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        description: frontmatter.description,
        author: frontmatter.author,
        image,
        tags: frontmatter.tags || [],
        body: markdownToText(body, filename),
      };

      if (!DRY_RUN && !VALIDATE_ONLY) {
        await client.createOrReplace(doc);
        collectionStats.documentsCreated++;
        console.log(`    ✅ Created: ${frontmatter.title}`);
      } else {
        console.log(`    ✓ Validated: ${frontmatter.title}`);
      }
    } catch (error) {
      const errorMsg = `${filename}: ${error}`;
      collectionStats.errors.push(errorMsg);
      console.error(`    ❌ Error: ${errorMsg}`);
    }
  }

  stats.push(collectionStats);
}

/**
 * Migrate Legal Pages
 */
async function migrateLegalPages() {
  console.log("\n⚖️  Migrating Legal Pages...");
  const collectionName = "legal";
  const config = PROJECT_COLLECTIONS[collectionName];
  const legalPages = readMarkdownFiles(path.join(CONTENT_PATH, collectionName));

  const collectionStats: MigrationStats = {
    collection: collectionName,
    filesFound: legalPages.length,
    documentsCreated: 0,
    imagesUploaded: 0,
    errors: [],
  };

  for (const page of legalPages) {
    const { slug, frontmatter, body, filename } = page;
    console.log(`  - ${frontmatter.page} (${filename})`);

    try {
      const doc = {
        _type: config.sanityType,
        _id: `${config.sanityType}-${slug}`,
        page: frontmatter.page,
        pubDate: frontmatter.pubDate
          ? new Date(frontmatter.pubDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        body: markdownToText(body, filename),
      };

      if (!DRY_RUN && !VALIDATE_ONLY) {
        await client.createOrReplace(doc);
        collectionStats.documentsCreated++;
        console.log(`    ✅ Created: ${frontmatter.page}`);
      } else {
        console.log(`    ✓ Validated: ${frontmatter.page}`);
      }
    } catch (error) {
      const errorMsg = `${filename}: ${error}`;
      collectionStats.errors.push(errorMsg);
      console.error(`    ❌ Error: ${errorMsg}`);
    }
  }

  stats.push(collectionStats);
}

// Main migration function
async function migrate() {
  console.log("🚀 Starting migration to Sanity...\n");
  console.log("Project ID:", projectId);
  console.log("Dataset:", dataset);
  console.log(
    `Mode: ${SEED_ALL ? "SEED ALL (clear then seed)" : VALIDATE_ONLY ? "VALIDATE ONLY" : DRY_RUN ? "DRY RUN" : "LIVE MIGRATION"}\n`
  );

  if (!VALIDATE_ONLY && !DRY_RUN && !process.env.SANITY_TOKEN) {
    console.error("\n❌ Error: SANITY_TOKEN environment variable is required for migration.");
    console.log("\nTo get a token:");
    console.log("1. Go to https://www.sanity.io/manage → Your Project → API");
    console.log("2. Create a new token with 'Editor' permissions");
    console.log(
      "3. Run: SANITY_TOKEN=your-token npx tsx migrate-to-sanity.ts"
    );
    process.exit(1);
  }

  try {
    if (SEED_ALL && !DRY_RUN && !VALIDATE_ONLY) {
      await runSeedAll();
    }

    // Migrate all collections based on PROJECT_CONTENT_MODEL
    await migrateTeamMembers();
    await migrateWorkItems();
    await migrateServices();
    await migratePosts();
    await migrateLegalPages();

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));

    let totalFiles = 0;
    let totalCreated = 0;
    let totalImages = 0;
    let totalErrors = 0;

    for (const stat of stats) {
      totalFiles += stat.filesFound;
      totalCreated += stat.documentsCreated;
      totalImages += stat.imagesUploaded;
      totalErrors += stat.errors.length;

      console.log(`\n${stat.collection}:`);
      console.log(`  Files found: ${stat.filesFound}`);
      console.log(`  Documents created: ${stat.documentsCreated}`);
      console.log(`  Images uploaded: ${stat.imagesUploaded}`);
      console.log(`  Errors: ${stat.errors.length}`);

      if (stat.errors.length > 0) {
        stat.errors.forEach((err) => console.log(`    ❌ ${err}`));
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`Total documents created: ${totalCreated}`);
    console.log(`Total images uploaded: ${totalImages}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log("=".repeat(60));

    // Surface the Portable Text conversion notes (suspicious residue, dropped
    // FAQ items, missing alt, reusable-block placeholders) for human review.
    if (conversionLog.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log(`📝 CONVERSIELOG (${conversionLog.length} aandachtspunten)`);
      console.log("=".repeat(60));
      conversionLog.forEach((entry) => console.log(`  • ${entry}`));
    }

    if (!VALIDATE_ONLY && !DRY_RUN) {
      console.log("\n✅ Migration complete!");
      console.log("\nYou can now:");
      console.log("1. Open Sanity Studio: cd apps/studio && pnpm dev");
      console.log("2. View your content at http://localhost:3333");
      console.log("3. Enable Sanity in apps/web/src/lib/data.ts: USE_SANITY = true");
      console.log("4. Run the site: cd apps/web && pnpm dev");
    }

    if (totalErrors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
