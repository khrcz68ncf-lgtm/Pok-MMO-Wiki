/**
 * fix-getting-started-npc.mjs
 * Patches the "getting-started" page in Supabase:
 *   - Replaces [Pirate NPC](/wiki/pirate-npc)
 *     with    [Region Changer NPC](/wiki/region-changer-npc)
 *   - Verifies [level caps](/wiki/level-caps) links are already correct.
 *
 * Usage:
 *   node scripts/fix-getting-started-npc.mjs
 */

import fs   from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// ── Load .env.local ──────────────────────────────────────────────────────────

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) throw new Error(`Missing: ${envPath}`);
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv(path.join(process.cwd(), '.env.local'));

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

let { content } = page;
let changed = false;

// ── Patch 1: Pirate NPC → Region Changer NPC ─────────────────────────────────

const FROM_NPC = '[Pirate NPC](/wiki/pirate-npc)';
const TO_NPC   = '[Region Changer NPC](/wiki/region-changer-npc)';

if (content.includes(FROM_NPC)) {
  content = content.replaceAll(FROM_NPC, TO_NPC);
  console.log(`✓ Replaced: ${FROM_NPC}`);
  console.log(`       → ${TO_NPC}`);
  changed = true;
} else {
  console.log(`  (already fixed or not found): ${FROM_NPC}`);
}

// ── Check: level-caps links ───────────────────────────────────────────────────

const levelCapCount = (content.match(/\[level cap[s]?\]\(\/wiki\/level-caps\)/gi) ?? []).length;
if (levelCapCount > 0) {
  console.log(`✓ Verified: ${levelCapCount} level-caps link(s) already point to /wiki/level-caps`);
} else {
  console.warn('  Warning: no [level cap(s)](/wiki/level-caps) links found');
}

// ── Update ────────────────────────────────────────────────────────────────────

if (!changed) {
  console.log('No changes needed.');
  process.exit(0);
}

const { error: updateErr } = await supabase
  .from('pages')
  .update({ content, updated_at: new Date().toISOString() })
  .eq('slug', 'getting-started');

if (updateErr) {
  console.error('Update failed:', updateErr.message);
  process.exit(1);
}

console.log('✓ Page "getting-started" updated successfully.');
