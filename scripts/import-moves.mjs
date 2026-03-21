/**
 * import-moves.mjs
 * For each page in Supabase, attempts to fetch move data from PokéAPI
 * using the page slug as the move identifier. Stores structured metadata
 * in the pages.metadata jsonb column and sets template_type = 'move'.
 *
 * Usage:
 *   node scripts/import-moves.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// 1. Load .env.local
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Could not find .env.local at: ${envPath}`);
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key   = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(process.cwd(), '.env.local'));

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Clients / constants
// ---------------------------------------------------------------------------

const supabase    = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const DELAY_MS    = 100;
const BATCH_SIZE  = 1000;
const POKEAPI_BASE = 'https://pokeapi.co/api/v2/move';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// 3. Fetch move from PokéAPI — returns null on 404
// ---------------------------------------------------------------------------

async function fetchMove(slug) {
  const res = await fetch(`${POKEAPI_BASE}/${slug}`, {
    headers: { 'User-Agent': 'PokéMMO-Wiki-Importer/1.0 (educational project)' },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${slug}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// 4. Extract the fields we care about
// ---------------------------------------------------------------------------

function extractMetadata(data) {
  const englishEffect = data.effect_entries?.find((e) => e.language.name === 'en');

  return {
    move_id:  data.id,
    name:     data.name,
    type:     data.type?.name ?? null,
    category: data.damage_class?.name ?? null,   // 'physical' | 'special' | 'status'
    power:    data.power    ?? null,
    accuracy: data.accuracy ?? null,
    pp:       data.pp       ?? null,
    effect:   englishEffect?.effect ?? null,
    priority: data.priority ?? 0,
    target:   data.target?.name ?? null,
  };
}

// ---------------------------------------------------------------------------
// 5. Paginate all Supabase pages
// ---------------------------------------------------------------------------

async function fetchAllPages() {
  const pages = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('pages')
      .select('slug, metadata')
      .order('slug', { ascending: true })
      .range(from, from + BATCH_SIZE - 1);

    if (error) {
      console.error('Failed to fetch pages from Supabase:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    pages.push(...data);
    console.log(`  Fetched rows ${from}–${from + data.length - 1} (${pages.length} total so far)`);

    if (data.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }

  return pages;
}

// ---------------------------------------------------------------------------
// 6. Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Fetching all pages from Supabase…');
  const allPages = await fetchAllPages();

  // Skip pages that already have move_id in their metadata
  const pages      = allPages.filter((p) => !p.metadata?.move_id);
  const alreadyDone = allPages.length - pages.length;

  console.log(`\nTotal pages    : ${allPages.length}`);
  console.log(`Already imported (skipping): ${alreadyDone}`);
  console.log(`To process     : ${pages.length}\n`);

  let matched = 0;
  let skipped = 0;
  let errors  = 0;

  for (const { slug } of pages) {
    try {
      const data = await fetchMove(slug);
      await delay(DELAY_MS);

      if (!data) {
        console.log(`✗ ${slug} → not a move`);
        skipped++;
        continue;
      }

      const metadata = extractMetadata(data);

      const { error: updateError } = await supabase
        .from('pages')
        .update({ metadata, template_type: 'move' })
        .eq('slug', slug);

      if (updateError) {
        console.error(`  Supabase error for "${slug}": ${updateError.message}`);
        errors++;
      } else {
        console.log(`✓ ${data.name} (id: ${data.id})`);
        matched++;
      }
    } catch (err) {
      console.error(`  Error processing "${slug}": ${err.message}`);
      errors++;
      await delay(DELAY_MS);
    }
  }

  console.log('\n=== Done ===');
  console.log(`  Matched : ${matched}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Errors  : ${errors}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
