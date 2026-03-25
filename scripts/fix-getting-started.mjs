/**
 * fix-getting-started.mjs
 * Fetches the "getting-started" page and applies broad replacements.
 *
 * Replacements:
 *   (#supported-platforms)  →  (https://pokemmo.com/fr/downloads/)
 *   /wiki/pirate-npc        →  /wiki/region-changer-npc
 *   Pirate NPC              →  Region Changer NPC
 *
 * Usage:
 *   node scripts/fix-getting-started.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ── Load .env.local ──────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) throw new Error(`Missing: ${envPath}`);
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnv(path.join(__dirname, '../.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                 ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Fetch ─────────────────────────────────────────────────────────────────────

const { data: page, error: fetchErr } = await supabase
  .from('pages')
  .select('content')
  .eq('slug', 'getting-started')
  .single();

if (fetchErr || !page) {
  console.error('Could not fetch page:', fetchErr?.message ?? 'not found');
  process.exit(1);
}

console.log('── Fetched content ──────────────────────────────────────────────');
console.log(page.content);
console.log('─────────────────────────────────────────────────────────────────\n');

// ── Replacements ──────────────────────────────────────────────────────────────

const REPLACEMENTS = [
  { from: '(#supported-platforms)',  to: '(https://pokemmo.com/fr/downloads/)' },
  { from: '/wiki/pirate-npc',        to: '/wiki/region-changer-npc'            },
  { from: 'Pirate NPC',              to: 'Region Changer NPC'                  },
];

let content = page.content;
let totalChanges = 0;

for (const { from, to } of REPLACEMENTS) {
  const count = (content.split(from).length - 1);
  if (count > 0) {
    content = content.split(from).join(to);
    console.log(`✓ Replaced ${count}x: "${from}" → "${to}"`);
    totalChanges += count;
  } else {
    console.log(`  (not found): "${from}"`);
  }
}

if (totalChanges === 0) {
  console.log('\nNothing to change — page content already up to date.');
  process.exit(0);
}

// ── Update ────────────────────────────────────────────────────────────────────

const { error: updateErr } = await supabase
  .from('pages')
  .update({ content, updated_at: new Date().toISOString() })
  .eq('slug', 'getting-started');

if (updateErr) {
  console.error('Update failed:', updateErr.message);
  process.exit(1);
}

console.log(`\n✓ Page updated (${totalChanges} change(s) applied).`);
