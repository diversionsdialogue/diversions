import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/web/.env') });

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function cleanup() {
  console.log('🗑️  Deleting ALL existing documents...\n');
  
  const types = ['teamMember', 'workItem', 'service', 'post', 'legalPage'];
  
  for (const type of types) {
    const docs = await client.fetch(`*[_type == "${type}"]`);
    console.log(`Found ${docs.length} ${type} documents`);
    
    for (const doc of docs) {
      await client.delete(doc._id);
      console.log(`  ✓ Deleted ${doc._id}`);
    }
  }
  
  console.log('\n✅ All documents deleted!\n');
}

cleanup().catch(console.error);
