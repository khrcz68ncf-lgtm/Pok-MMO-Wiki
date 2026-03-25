/**
 * seed-level-caps.mjs
 * Upserts the "level-caps" wiki page into Supabase.
 *
 * Usage:
 *   node scripts/seed-level-caps.mjs
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

const content = `# Level Caps

In PokéMMO, each region has a level cap system. Your Pokémon cannot gain experience beyond the current level cap until you defeat the next Gym Leader or progress through the story.

## Kanto
| Gym Leader | Location | Type | Level Cap |
|---|---|---|---|
| Brock | Pewter City | Rock | 20 |
| Misty | Cerulean City | Water | 26 |
| Lt. Surge | Vermilion City | Electric | 32 |
| Erika | Celadon City | Grass | 37 |
| Koga | Fuchsia City | Poison | 46 |
| Sabrina | Saffron City | Psychic | 47 |
| Blaine | Cinnabar Island | Fire | 50 |
| Giovanni | Viridian City | Ground | 55 |

## Johto
| Gym Leader | Location | Type | Level Cap |
|---|---|---|---|
| Falkner | Violet City | Flying | 24 |
| Bugsy | Azalea Town | Bug | 29 |
| Whitney | Goldenrod City | Normal | 32 |
| Morty | Ecruteak City | Ghost | 37 |
| Chuck | Cianwood City | Fighting | 39 |
| Jasmine | Olivine City | Steel | 41 |
| Pryce | Mahogany Town | Ice | 46 |
| Clair | Blackthorn City | Dragon | 48 |

## Hoenn
| Gym Leader | Location | Type | Level Cap |
|---|---|---|---|
| Roxanne | Rustboro City | Rock | 24 |
| Brawly | Dewford Town | Fighting | 28 |
| Wattson | Mauville City | Electric | 33 |
| Flannery | Lavaridge Town | Fire | 35 |
| Norman | Petalburg City | Normal | 38 |
| Winona | Fortree City | Flying | 44 |
| Tate & Liza | Mossdeep City | Psychic | 48 |
| Juan | Sootopolis City | Water | 58 |

## Sinnoh
| Gym Leader | Location | Type | Level Cap |
|---|---|---|---|
| Roark | Oreburgh City | Rock | 27 |
| Gardenia | Eterna City | Grass | 29 |
| Fantina | Hearthome City | Ghost | 34 |
| Maylene | Veilstone City | Fighting | 37 |
| Crasher Wake | Pastoria City | Water | 43 |
| Byron | Canalave City | Steel | 46 |
| Candice | Snowpoint City | Ice | 52 |
| Volkner | Sunyshore City | Electric | 60 |

## Unova
| Gym Leader | Location | Type | Level Cap |
|---|---|---|---|
| Cilan / Chili / Cress | Striaton City | Grass/Fire/Water | 24 |
| Lenora | Nacrene City | Normal | 27 |
| Burgh | Castelia City | Bug | 31 |
| Elesa | Nimbasa City | Electric | 35 |
| Clay | Driftveil City | Ground | 38 |
| Skyla | Mistralton City | Flying | 43 |
| Brycen | Icirrus City | Ice | 46 |
| Iris | Opelucid City | Dragon | 56 |`;

const page = {
  slug:          'level-caps',
  title:         'Level Caps',
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

console.log('✓ Upserted "level-caps" page.');
