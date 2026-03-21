/**
 * import-pokeapi.mjs
 * For each page in Supabase, attempts to fetch Pokémon data from PokéAPI
 * using the page slug as the Pokémon identifier. Stores structured metadata
 * in the pages.metadata jsonb column.
 *
 * Usage:
 *   node scripts/import-pokeapi.mjs
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
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.resolve(__dirname, '../../.env.local'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Clients / constants
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const DELAY_MS = 100;
const POKEAPI_BASE = 'https://pokeapi.co/api/v2/pokemon';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// 3. Fetch Pokémon from PokéAPI — returns null on 404
// ---------------------------------------------------------------------------

async function fetchPokemon(slug) {
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
  // Stats
  const statMap = {};
  for (const s of data.stats) {
    statMap[s.stat.name] = s.base_stat;
  }

  // Moves — filter to black-white version group only
  const moves = [];
  for (const m of data.moves) {
    for (const vg of m.version_group_details) {
      if (vg.version_group.name === 'black-white') {
        moves.push({
          name: m.move.name,
          method: vg.move_learn_method.name,
          level: vg.level_learned_at,
        });
        break;
      }
    }
  }

  // Sprites — generation-v black-white animated
  const bwAnimated = data.sprites?.versions?.['generation-v']?.['black-white']?.animated ?? {};
  const sprites = {
    front:        bwAnimated.front_default ?? null,
    front_shiny:  bwAnimated.front_shiny   ?? null,
    back:         bwAnimated.back_default  ?? null,
    official:     data.sprites?.other?.['official-artwork']?.front_default ?? null,
  };

  return {
    pokemon_id:      data.id,
    name:            data.name,
    types:           data.types.map((t) => t.type.name),
    abilities:       data.abilities.map((a) => ({
      name:      a.ability.name,
      is_hidden: a.is_hidden,
    })),
    stats: {
      hp:              statMap['hp']              ?? null,
      attack:          statMap['attack']          ?? null,
      defense:         statMap['defense']         ?? null,
      special_attack:  statMap['special-attack']  ?? null,
      special_defense: statMap['special-defense'] ?? null,
      speed:           statMap['speed']           ?? null,
    },
    height:     data.height,
    weight:     data.weight,
    held_items: data.held_items.map((h) => ({
      name: h.item.name,
      url:  h.item.url,
    })),
    moves,
    sprites,
  };
}

// ---------------------------------------------------------------------------
// 5. Paginate all Supabase pages, skipping already-enriched ones
// ---------------------------------------------------------------------------

const BATCH_SIZE = 1000;

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
  console.log('Fetching all pages from Supabase...');
  const allPages = await fetchAllPages();

  // Skip pages that already have pokemon_id in their metadata
  const pages = allPages.filter((p) => !p.metadata?.pokemon_id);
  const alreadyDone = allPages.length - pages.length;

  console.log(`\nTotal pages: ${allPages.length}`);
  console.log(`Already enriched (skipping): ${alreadyDone}`);
  console.log(`To process: ${pages.length}\n`);

  let matched = 0;
  let skipped = 0;
  let errors  = 0;

  for (let i = 0; i < pages.length; i++) {
    const { slug } = pages[i];

    try {
      const data = await fetchPokemon(slug);
      await delay(DELAY_MS);

      if (!data) {
        console.log(`✗ ${slug} → not a pokemon`);
        skipped++;
        continue;
      }

      const metadata = extractMetadata(data);

      const { error: upsertError } = await supabase
        .from('pages')
        .update({ metadata })
        .eq('slug', slug);

      if (upsertError) {
        console.error(`  Supabase error for "${slug}": ${upsertError.message}`);
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
