/**
 * import-pokeapi-full.mjs
 *
 * Comprehensive PokeAPI → Supabase import for all Gen 1-5 data.
 *
 * Usage:
 *   node scripts/import-pokeapi-full.mjs [--part=1,2,3,4,5,6]
 *
 * Flags:
 *   --part=1,3,5   Run only specified parts (comma-separated, no spaces)
 *   --force        Re-process entries that already have data
 *
 * Parts:
 *   1 — Enrich Pokémon pages
 *   2 — Enrich Move pages
 *   3 — Import Items
 *   4 — Import Evolution Chains (requires table, see SQL below)
 *   5 — Import Abilities
 *   6 — Import Egg Groups (requires table, see SQL below)
 *
 * Required Supabase tables (run in Supabase SQL editor before Parts 4 & 6):
 *
 *   CREATE TABLE IF NOT EXISTS evolution_chains (
 *     id          int primary key,
 *     chain       jsonb not null,
 *     updated_at  timestamp default now()
 *   );
 *
 *   CREATE TABLE IF NOT EXISTS egg_groups (
 *     id               int primary key,
 *     name             text not null,
 *     pokemon_species  jsonb default '[]'
 *   );
 *
 * Env vars needed: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY)
 */

import { createClient }  from '@supabase/supabase-js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path              from 'path';

// ── Env loading ───────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const dotenv = createRequire(import.meta.url)('dotenv');
  dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
} catch { /* dotenv optional */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CLI flags ─────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2);
const FORCE  = args.includes('--force');
const partArg = args.find(a => a.startsWith('--part='));
const RUN_PARTS = partArg
  ? new Set(partArg.replace('--part=', '').split(',').map(Number))
  : new Set([1, 2, 3, 4, 5, 6]);

// ── Constants ─────────────────────────────────────────────────────────────────

const API       = 'https://pokeapi.co/api/v2';
const DELAY_MS  = 110;   // stay well under rate limit
const GEN5_MAX  = 649;   // last Gen 5 Pokémon national dex number
const ITEM_MAX  = 640;   // approximate Gen 5 item ceiling

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Fetch JSON from PokeAPI with retry on rate-limit / transient errors. */
async function pokeGet(url, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (res.status === 429 || res.status >= 500) {
        const wait = attempt * 2000;
        console.warn(`  ⚠ HTTP ${res.status} on ${url} — retry ${attempt}/${retries} in ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(attempt * 1000);
    }
  }
  return null;
}

/** Get all rows from a Supabase query in batches of 1000. */
async function paginate(builder) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await builder(from, from + 999);
    if (error) { console.error('Supabase paginate error:', error.message); break; }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

/** Extract numeric ID from a PokeAPI resource URL. */
function idFromUrl(url) {
  return url ? parseInt(url.replace(/\/$/, '').split('/').pop(), 10) : null;
}

/** First English entry matching optional version name(s). */
function enText(entries, versionNames) {
  if (!entries?.length) return null;
  const filtered = versionNames
    ? entries.filter(e =>
        (e.language?.name === 'en') &&
        versionNames.some(v => (e.version?.name === v) || (e.version_group?.name === v))
      )
    : entries.filter(e => e.language?.name === 'en');
  return (filtered[0] ?? entries.find(e => e.language?.name === 'en'))
    ?.flavor_text?.replace(/\s+/g, ' ').trim() ?? null;
}

/** Flatten an evolution chain node into a flat array of step objects. */
function flattenChain(node, result = []) {
  for (const next of (node.evolves_to ?? [])) {
    for (const detail of (next.evolution_details ?? [])) {
      const conds = [];
      if (detail.happiness)            conds.push(`happiness ≥ ${detail.happiness}`);
      if (detail.held_item?.name)      conds.push(`holding ${detail.held_item.name}`);
      if (detail.known_move?.name)     conds.push(`knows ${detail.known_move.name}`);
      if (detail.known_move_type?.name) conds.push(`knows ${detail.known_move_type.name}-type move`);
      if (detail.time_of_day)          conds.push(`at ${detail.time_of_day}`);
      if (detail.location?.name)       conds.push(`at ${detail.location.name}`);
      if (detail.min_beauty)           conds.push(`beauty ≥ ${detail.min_beauty}`);
      if (detail.min_affection)        conds.push(`affection ≥ ${detail.min_affection}`);
      if (detail.party_species?.name)  conds.push(`with ${detail.party_species.name} in party`);
      if (detail.trade_species?.name)  conds.push(`trade for ${detail.trade_species.name}`);
      if (detail.needs_overworld_rain)  conds.push('while raining');
      if (detail.turn_upside_down)     conds.push('hold console upside down');
      if (detail.relative_physical_stats != null) {
        conds.push({ 1: 'ATK > DEF', '-1': 'DEF > ATK', 0: 'ATK = DEF' }[detail.relative_physical_stats] ?? '');
      }
      result.push({
        from_pokemon: node.species.name,
        to_pokemon:   next.species.name,
        min_level:    detail.min_level || null,
        item:         detail.item?.name ?? null,
        trigger:      detail.trigger?.name ?? 'level-up',
        condition:    conds.filter(Boolean).join(', ') || null,
      });
    }
    if (!next.evolution_details?.length) {
      result.push({ from_pokemon: node.species.name, to_pokemon: next.species.name, min_level: null, item: null, trigger: 'unknown', condition: null });
    }
    flattenChain(next, result);
  }
  return result;
}

/** Log progress every N items. */
function progress(i, total, label) {
  if (i % 50 === 0 || i === total) console.log(`  ${label}: ${i}/${total}`);
}

// ── Evolution chain cache (shared across parts) ────────────────────────────

const chainCache = new Map(); // chainId → flattened evolutions array

async function fetchChain(chainId) {
  if (chainCache.has(chainId)) return chainCache.get(chainId);
  await sleep(DELAY_MS);
  const data = await pokeGet(`${API}/evolution-chain/${chainId}/`);
  if (!data) { chainCache.set(chainId, []); return []; }
  const flat = flattenChain(data.chain);
  chainCache.set(chainId, { flat, raw: data.chain });
  return { flat, raw: data.chain };
}

// ── PART 1 — Enrich Pokémon pages ────────────────────────────────────────────

async function enrichPokemon() {
  console.log('\n══ PART 1: Enrich Pokémon ══');

  const pages = await paginate((from, to) =>
    db.from('pages')
      .select('id, slug, metadata')
      .eq('template_type', 'pokemon')
      .not('metadata->pokemon_id', 'is', null)
      .range(from, to)
  );

  const toProcess = FORCE
    ? pages
    : pages.filter(p => !p.metadata?.flavor_text);

  console.log(`  ${pages.length} Pokémon pages found, ${toProcess.length} to enrich`);

  let done = 0, skipped = 0;

  for (const page of toProcess) {
    const pokemonId = page.metadata?.pokemon_id;
    if (!pokemonId) { skipped++; continue; }

    await sleep(DELAY_MS);
    const [pkData, spData] = await Promise.all([
      pokeGet(`${API}/pokemon/${pokemonId}/`),
      pokeGet(`${API}/pokemon-species/${pokemonId}/`),
    ]);

    if (!pkData || !spData) { skipped++; continue; }

    // Egg moves (black-white, learn method = egg)
    const eggMoves = (pkData.moves ?? [])
      .filter(m => m.version_group_details?.some(
        vg => vg.version_group?.name === 'black-white' && vg.move_learn_method?.name === 'egg'
      ))
      .map(m => m.move.name);

    // Flavor text (black or white version)
    const flavorText = enText(spData.flavor_text_entries, ['black', 'white']);

    // Genus (English)
    const genus = spData.genera?.find(g => g.language?.name === 'en')?.genus ?? null;

    // Evolution chain
    const chainUrl = spData.evolution_chain?.url ?? null;
    const chainId  = idFromUrl(chainUrl);
    let evolutions = [];
    if (chainId) {
      const chain = await fetchChain(chainId);
      evolutions = chain?.flat ?? [];
    }

    const enriched = {
      ...page.metadata,
      gender_ratio:      spData.gender_rate,            // -1 genderless, 0 male only, 8 female only
      catch_rate:        spData.capture_rate,
      base_happiness:    spData.base_happiness,
      base_experience:   pkData.base_experience,
      egg_groups:        (spData.egg_groups ?? []).map(g => g.name),
      egg_moves:         eggMoves,
      evolution_chain_id: chainId,
      evolutions,
      flavor_text:       flavorText,
      genus,
      shape:             spData.shape?.name ?? null,
      growth_rate:       spData.growth_rate?.name ?? null,
      hatch_counter:     spData.hatch_counter,
    };

    const { error } = await db.from('pages')
      .update({ metadata: enriched })
      .eq('id', page.id);

    if (error) { console.error(`  ✗ ${page.slug}: ${error.message}`); }

    done++;
    progress(done, toProcess.length, 'Pokémon');
  }

  console.log(`  ✓ ${done} enriched, ${skipped} skipped`);
  return done;
}

// ── PART 2 — Enrich Move pages ────────────────────────────────────────────────

async function enrichMoves() {
  console.log('\n══ PART 2: Enrich Moves ══');

  const pages = await paginate((from, to) =>
    db.from('pages')
      .select('id, slug, metadata')
      .eq('template_type', 'move')
      .range(from, to)
  );

  const toProcess = FORCE
    ? pages.filter(p => p.metadata?.move_id)
    : pages.filter(p => p.metadata?.move_id && !p.metadata?.flavor_text);

  console.log(`  ${pages.length} move pages found, ${toProcess.length} to enrich`);

  let done = 0, skipped = 0;

  for (const page of toProcess) {
    const moveId = page.metadata?.move_id;
    await sleep(DELAY_MS);
    const data = await pokeGet(`${API}/move/${moveId}/`);
    if (!data) { skipped++; continue; }

    const flavorText = enText(data.flavor_text_entries, ['black-white']);
    const shortEffect = data.effect_entries?.find(e => e.language?.name === 'en')?.short_effect ?? null;

    const learnedBy = (data.learned_by_pokemon ?? [])
      .map(p => ({ name: p.name, id: idFromUrl(p.url) }))
      .filter(p => p.id !== null && p.id <= GEN5_MAX)
      .map(p => p.name);

    const enriched = {
      ...page.metadata,
      ailment:          data.meta?.ailment?.name ?? null,
      ailment_chance:   data.meta?.ailment_chance ?? null,
      flinch_chance:    data.meta?.flinch_chance ?? null,
      crit_rate:        data.meta?.crit_rate ?? null,
      drain:            data.meta?.drain ?? null,
      recoil:           data.meta?.recoil ?? null,
      min_hits:         data.meta?.min_hits ?? null,
      max_hits:         data.meta?.max_hits ?? null,
      effect:           shortEffect,
      flavor_text:      flavorText,
      learned_by_pokemon: learnedBy,
    };

    const { error } = await db.from('pages').update({ metadata: enriched }).eq('id', page.id);
    if (error) { console.error(`  ✗ ${page.slug}: ${error.message}`); }

    done++;
    progress(done, toProcess.length, 'Moves');
  }

  console.log(`  ✓ ${done} enriched, ${skipped} skipped`);
  return done;
}

// ── PART 3 — Import Items ─────────────────────────────────────────────────────

async function importItems() {
  console.log('\n══ PART 3: Import Items ══');

  // Get existing item slugs to skip
  const existing = await paginate((from, to) =>
    db.from('pages').select('slug').eq('template_type', 'item').range(from, to)
  );
  const existingSlugs = new Set(existing.map(p => p.slug));

  // Fetch item list from PokeAPI
  await sleep(DELAY_MS);
  const listData = await pokeGet(`${API}/item?limit=700&offset=0`);
  if (!listData) { console.error('  ✗ Could not fetch item list'); return 0; }

  const items = listData.results.filter((_, i) => {
    // Filter by roughly Gen 1-5 range; we'll double-check with ID after fetching
    return true;
  });

  console.log(`  ${items.length} items in list, ${existingSlugs.size} already imported`);

  let done = 0, skipped = 0;

  for (const item of items) {
    const itemId = idFromUrl(item.url);
    if (itemId > ITEM_MAX) { skipped++; continue; }
    if (!FORCE && existingSlugs.has(item.name)) { skipped++; continue; }

    await sleep(DELAY_MS);
    const data = await pokeGet(item.url);
    if (!data) { skipped++; continue; }

    const englishName   = data.names?.find(n => n.language?.name === 'en')?.name ?? data.name;
    const shortEffect   = data.effect_entries?.find(e => e.language?.name === 'en')?.short_effect ?? null;
    const flavorText    = enText(data.flavor_text_entries, ['black', 'white']);

    const heldBy = (data.held_by_pokemon ?? [])
      .map(h => ({ pokemon_name: h.pokemon.name, id: idFromUrl(h.pokemon.url), rarity: h.version_details?.[0]?.rarity ?? null }))
      .filter(h => h.id !== null && h.id <= GEN5_MAX)
      .map(({ pokemon_name, rarity }) => ({ pokemon_name, rarity }));

    const { error } = await db.from('pages').upsert({
      slug:          data.name,
      title:         englishName,
      template_type: 'item',
      category:      'item',
      content:       shortEffect ?? '',
      metadata: {
        item_id:      data.id,
        name:         data.name,
        category:     data.category?.name ?? null,
        attributes:   (data.attributes ?? []).map(a => a.name),
        cost:         data.cost,
        effect:       shortEffect,
        flavor_text:  flavorText,
        sprite:       data.sprites?.default ?? null,
        held_by_pokemon: heldBy,
        fling_power:  data.fling_power ?? null,
        fling_effect: data.fling_effect?.name ?? null,
      },
    }, { onConflict: 'slug' });

    if (error) { console.error(`  ✗ item/${data.name}: ${error.message}`); }

    done++;
    progress(done, items.filter(i => idFromUrl(i.url) <= ITEM_MAX).length, 'Items');
  }

  console.log(`  ✓ ${done} items imported, ${skipped} skipped`);
  return done;
}

// ── PART 4 — Import Evolution Chains ─────────────────────────────────────────

async function importEvolutionChains() {
  console.log('\n══ PART 4: Import Evolution Chains ══');

  // Check if table exists
  const { error: tableCheck } = await db.from('evolution_chains').select('id').limit(1);
  if (tableCheck) {
    console.log('  ⚠ Table evolution_chains not found. Create it first:');
    console.log(`
    CREATE TABLE IF NOT EXISTS evolution_chains (
      id         int primary key,
      chain      jsonb not null,
      updated_at timestamp default now()
    );
    `);
    return 0;
  }

  // Get existing chain IDs
  const existing = await paginate((from, to) =>
    db.from('evolution_chains').select('id').range(from, to)
  );
  const existingIds = new Set(existing.map(r => r.id));

  // Collect chain IDs from all Gen 1-5 pokemon pages
  const pages = await paginate((from, to) =>
    db.from('pages')
      .select('metadata')
      .eq('template_type', 'pokemon')
      .not('metadata->evolution_chain_id', 'is', null)
      .range(from, to)
  );

  const chainIds = new Set(
    pages.map(p => p.metadata?.evolution_chain_id).filter(id => id && typeof id === 'number')
  );

  const toFetch = [...chainIds].filter(id => FORCE || !existingIds.has(id));
  console.log(`  ${chainIds.size} unique chains, ${toFetch.length} to import`);

  let done = 0;

  for (const chainId of toFetch) {
    const chain = await fetchChain(chainId);
    if (!chain?.raw) { continue; }

    const { error } = await db.from('evolution_chains').upsert({
      id:         chainId,
      chain:      chain.raw,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) { console.error(`  ✗ chain/${chainId}: ${error.message}`); }
    done++;
    progress(done, toFetch.length, 'Chains');
  }

  console.log(`  ✓ ${done} chains imported`);
  return done;
}

// ── PART 5 — Import Abilities ─────────────────────────────────────────────────

async function importAbilities() {
  console.log('\n══ PART 5: Import Abilities ══');

  // Existing ability pages
  const existing = await paginate((from, to) =>
    db.from('pages').select('slug, metadata').eq('template_type', 'ability').range(from, to)
  );
  const existingMap = new Map(existing.map(p => [p.slug, p]));

  // Collect ability slugs from all pokemon pages
  const pokemonPages = await paginate((from, to) =>
    db.from('pages')
      .select('metadata')
      .eq('template_type', 'pokemon')
      .range(from, to)
  );

  const abilitySlugs = new Set();
  for (const p of pokemonPages) {
    for (const ab of (p.metadata?.abilities ?? [])) {
      if (ab?.name) abilitySlugs.add(ab.name);
    }
  }

  // Also fetch the full ability list to catch any we might have missed
  await sleep(DELAY_MS);
  const listData = await pokeGet(`${API}/ability?limit=300&offset=0`);
  if (listData) {
    for (const a of listData.results) {
      const id = idFromUrl(a.url);
      // Abilities are numbered; Gen 1-5 abilities have ID roughly <= 188
      if (id <= 188) abilitySlugs.add(a.name);
    }
  }

  const toProcess = [...abilitySlugs].filter(slug =>
    FORCE || !existingMap.has(slug) || !existingMap.get(slug)?.metadata?.effect
  );

  console.log(`  ${abilitySlugs.size} abilities found, ${toProcess.length} to import`);

  let done = 0, skipped = 0;

  for (const slug of toProcess) {
    await sleep(DELAY_MS);
    const data = await pokeGet(`${API}/ability/${slug}/`);
    if (!data) { skipped++; continue; }

    // Filter to Gen 1-5 pokemon
    const pokemon = (data.pokemon ?? [])
      .map(p => ({ name: p.pokemon.name, id: idFromUrl(p.pokemon.url), is_hidden: p.is_hidden }))
      .filter(p => p.id !== null && p.id <= GEN5_MAX)
      .map(({ name, is_hidden }) => ({ name, is_hidden }));

    const shortEffect = data.effect_entries?.find(e => e.language?.name === 'en')?.short_effect ?? null;
    const flavorText  = enText(data.flavor_text_entries, ['black-white']);
    const englishName = data.names?.find(n => n.language?.name === 'en')?.name ?? data.name;

    const { error } = await db.from('pages').upsert({
      slug,
      title:         englishName,
      template_type: 'ability',
      category:      'ability',
      content:       shortEffect ?? '',
      metadata: {
        ability_id:  data.id,
        name:        data.name,
        effect:      shortEffect,
        flavor_text: flavorText,
        pokemon,
      },
    }, { onConflict: 'slug' });

    if (error) { console.error(`  ✗ ability/${slug}: ${error.message}`); }

    done++;
    progress(done, toProcess.length, 'Abilities');
  }

  console.log(`  ✓ ${done} abilities imported, ${skipped} skipped`);
  return done;
}

// ── PART 6 — Import Egg Groups ────────────────────────────────────────────────

async function importEggGroups() {
  console.log('\n══ PART 6: Import Egg Groups ══');

  const { error: tableCheck } = await db.from('egg_groups').select('id').limit(1);
  if (tableCheck) {
    console.log('  ⚠ Table egg_groups not found. Create it first:');
    console.log(`
    CREATE TABLE IF NOT EXISTS egg_groups (
      id               int primary key,
      name             text not null,
      pokemon_species  jsonb default '[]'
    );
    `);
    return 0;
  }

  const existing = await paginate((from, to) =>
    db.from('egg_groups').select('id').range(from, to)
  );
  const existingIds = new Set(existing.map(r => r.id));

  await sleep(DELAY_MS);
  const listData = await pokeGet(`${API}/egg-group?limit=100`);
  if (!listData) { console.error('  ✗ Could not fetch egg group list'); return 0; }

  const toProcess = FORCE
    ? listData.results
    : listData.results.filter(eg => !existingIds.has(idFromUrl(eg.url)));

  console.log(`  ${listData.results.length} egg groups, ${toProcess.length} to import`);

  let done = 0;

  for (const eg of toProcess) {
    await sleep(DELAY_MS);
    const data = await pokeGet(eg.url);
    if (!data) continue;

    const pokemon = (data.pokemon_species ?? [])
      .map(p => ({ name: p.name, id: idFromUrl(p.url) }))
      .filter(p => p.id !== null && p.id <= GEN5_MAX)
      .map(p => p.name);

    const { error } = await db.from('egg_groups').upsert({
      id:              data.id,
      name:            data.name,
      pokemon_species: pokemon,
    }, { onConflict: 'id' });

    if (error) { console.error(`  ✗ egg-group/${data.name}: ${error.message}`); }
    done++;
    progress(done, toProcess.length, 'Egg Groups');
  }

  console.log(`  ✓ ${done} egg groups imported`);
  return done;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  PokéMMO Wiki — Full PokeAPI Import          ║');
  console.log(`║  Parts: ${[...RUN_PARTS].join(', ')}${' '.repeat(39 - [...RUN_PARTS].join(', ').length)}║`);
  console.log(`║  Force: ${FORCE}${' '.repeat(FORCE ? 38 : 37)}║`);
  console.log('╚══════════════════════════════════════════════╝');

  const summary = {};
  const t0 = Date.now();

  if (RUN_PARTS.has(1)) summary.pokemon  = await enrichPokemon();
  if (RUN_PARTS.has(2)) summary.moves    = await enrichMoves();
  if (RUN_PARTS.has(3)) summary.items    = await importItems();
  if (RUN_PARTS.has(4)) summary.chains   = await importEvolutionChains();
  if (RUN_PARTS.has(5)) summary.abilities = await importAbilities();
  if (RUN_PARTS.has(6)) summary.eggGroups = await importEggGroups();

  const elapsed = Math.round((Date.now() - t0) / 1000);
  const mins    = Math.floor(elapsed / 60);
  const secs    = elapsed % 60;

  console.log('\n══════════════ SUMMARY ══════════════');
  if (summary.pokemon   != null) console.log(`  ✓ Pokémon enriched:      ${summary.pokemon}`);
  if (summary.moves     != null) console.log(`  ✓ Moves enriched:        ${summary.moves}`);
  if (summary.items     != null) console.log(`  ✓ Items imported:        ${summary.items}`);
  if (summary.chains    != null) console.log(`  ✓ Evolution chains:      ${summary.chains}`);
  if (summary.abilities != null) console.log(`  ✓ Abilities imported:    ${summary.abilities}`);
  if (summary.eggGroups != null) console.log(`  ✓ Egg groups imported:   ${summary.eggGroups}`);
  console.log(`  ⏱ Total time: ${mins}m ${secs}s`);
  console.log('═════════════════════════════════════');
}

main().catch(err => { console.error(err); process.exit(1); });
