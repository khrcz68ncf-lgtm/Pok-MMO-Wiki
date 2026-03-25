/**
 * seed-region-changer.mjs
 * Upserts the "region-changer-npc" wiki page into Supabase.
 *
 * Usage:
 *   node scripts/seed-region-changer.mjs
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

// ── Page data ────────────────────────────────────────────────────────────────

const content = `# Region Changer NPC

The Region Changer NPC allows you to travel between the 5 regions of PokéMMO. You can find them in each region's starting town.

## Locations
| Region | Location | NPC Name |
|---|---|---|
| Kanto | Pallet Town | — |
| Johto | New Bark Town | — |
| Hoenn | Littleroot Town | — |
| Sinnoh | Twinleaf Town | — |
| Unova | Nuvema Town | — |

> **Note:** You must have completed the main story of a region before you can travel there.`;

const page = {
  slug:          'region-changer-npc',
  title:         'Region Changer NPC',
  content,
  template_type: 'free',
  category:      'Guides',
  updated_at:    new Date().toISOString(),
};

// ── Upsert ───────────────────────────────────────────────────────────────────

const { error } = await supabase
  .from('pages')
  .upsert(page, { onConflict: 'slug' });

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log('✓ Upserted "region-changer-npc" page.');
