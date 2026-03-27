/**
 * seed-ev-guide.mjs
 * Upserts the "ev-training" wiki page into Supabase.
 *
 * Usage:
 *   node scripts/seed-ev-guide.mjs
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

const content = `# EV Training Guide

EV (Effort Value) training allows you to maximize your Pokémon's stats. In PokéMMO, the best method is to farm **hordes of 5 Pokémon** using Sweet Scent or Honey.

> **Tip:** Bring Leppa Berries to restore PP during long sessions.

## Best EV Spots (Recommended)

### ❤️ HP
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Marill | 10 EVs | Route 114 | Surf | Hoenn |

### ⚔️ Attack
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Rhydon | 10 EVs | Victory Road | Cave | Sinnoh |

### 🛡️ Defense
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Pelipper | 10 EVs | Undella Bay | Surf | Unova |

### ✨ Special Attack
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Golduck | 10 EVs | Cape Brink, Two Island | Surf | Kanto |

### 🌟 Special Defense
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Tentacruel | 10 EVs | Seven Island | Surf | Kanto |

### ⚡ Speed
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Rapidash | 10 EVs | Route 12 | Grass | Unova |

---

## Best EXP Spots (Leveling)

| Pokémon | EVs/Horde | Location | Method | Region | EXP/Horde |
|---|---|---|---|---|---|
| 5x Golduck | — | Cerulean Cave | Surf | Kanto | ~6,000 |
| 5x Poliwhirl | — | Mt. Silver | Surf | Johto | ~6,000 |
| 5x Tentacruel | — | Battle Frontier | Surf | Hoenn | ~6,000 |
| 5x Camerupt | — | Stark Mountain | Grass | Sinnoh | ~6,000 |
| 5x Piloswine | — | Giant Chasm (Other Side) | Dark Grass | Unova | ~6,000 |

---

## Alternative EV Spots

### ❤️ HP — Alternatives
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Dunsparce | 5 EVs | Three Isle Port, Three Island | Grass | Kanto |
| 5x Wobbuffet / 5x Lickitung | 10 EVs | Cerulean Cave Entrance | Cave | Kanto |
| 5x Lickitung | 10 EVs | Route 44 | Grass | Johto |
| 5x Loudred | 10 EVs | Desert Underpass | Cave | Hoenn |
| 5x Hariyama | 10 EVs | Victory Road | Cave | Hoenn |
| 5x Sealeo | 10 EVs | Route 230 | Surf | Sinnoh |
| 5x Stunfisk | 10 EVs | Icirrus City (Pond) | Surf | Unova |
| 5x Amoonguss | 10 EVs | Route 10 | Dark Grass | Unova |

### ⚔️ Attack — Alternatives
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 3x Paras | 3 EVs | Mt. Moon B1F | Cave | Kanto |
| 5x Nidorino | 10 EVs | Route 15 | Grass | Kanto |
| 5x Primeape / 5x Arbok | 10 EVs | Route 23 | Grass | Kanto |
| 5x Kingler / 5x Machoke | 10 EVs | Cliff Cave | Cave | Johto |
| 5x Ariados / 5x Banette | 10 EVs | Sky Pillar | Cave | Hoenn |
| 5x Bouffalant | 10 EVs | Route 10 | Grass | Unova |
| 5x Tranquill | 10 EVs | Route 12 | Dark Grass | Unova |
| 5x Bibarel | 10 EVs | Sendoff Spring | Grass | Sinnoh |
| 5x Machoke | 10 EVs | Route 211 | Grass | Sinnoh |

### 🛡️ Defense — Alternatives
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Sandslash / 5x Marowak | 10 EVs | Victory Road | Cave | Kanto |
| 5x Tangela | 5 EVs | Route 21 | Grass | Kanto |
| 5x Slowbro | 10 EVs | Cape Brink, Two Island | Grass | Kanto |
| 5x Metapod / 5x Kakuna | 10 EVs | Pattern Bush, Six Island | Grass | Kanto |
| 5x Sandslash | 10 EVs | Route 26 | Grass | Johto |
| 5x Pelipper | 10 EVs | Ever Grande City Entrance | Surf | Hoenn |
| 5x Pelipper | 10 EVs | Route 222 | Surf | Sinnoh |

### ✨ Special Attack — Alternatives
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Flaaffy / 5x Girafarig | 10 EVs | Route 43 | Grass | Johto |
| 5x Gloom | 10 EVs | Route 119 | Grass | Hoenn |
| 5x Golduck | 10 EVs | Resort Area | Surf | Sinnoh |
| 5x Duosion | 10 EVs | Route 9 | Grass | Unova |
| 5x Heatmor | 10 EVs | Victory Road (Outside) | Grass | Unova |
| 5x Litwick | 5 EVs | Celestial Tower | Cave | Unova |
| 5x Golduck | 10 EVs | Route 11 | Grass | Unova |

### 🌟 Special Defense — Alternatives
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Dewgong | 10 EVs | Icefall Cave, Four Island | Cave | Kanto |
| 5x Tentacruel | 10 EVs | Route 26 | Surf | Johto |
| 5x Tentacruel | 10 EVs | Battle Frontier | Surf | Hoenn |
| 5x Tentacruel | 10 EVs | Victory Road | Surf | Sinnoh |
| 5x Gothorita | 10 EVs | Route 9 | Dark Grass | Unova |
| 5x Mantine | 10 EVs | Undella Town | Surf | Unova |

### ⚡ Speed — Alternatives
| Pokémon | EVs/Horde | Location | Method | Region |
|---|---|---|---|---|
| 5x Pidgeotto | 10 EVs | Five Isle Meadow | Grass | Kanto |
| 5x Poliwhirl | 10 EVs | Blackthorn City | Surf | Johto |
| 5x Poliwhirl | 10 EVs | Mt. Silver | Surf | Johto |
| 5x Linoone | 10 EVs | Route 121 | Grass | Hoenn |
| 5x Raticate | 10 EVs | Dreamyard Basement | Cave | Unova |
| 5x Basculin / 5x Buizel | 10 EVs | Route 11 | Surf | Unova |
| 5x Liepard | 10 EVs | Dreamyard | Dark Grass | Unova |
| 5x Floatzel / 5x Electabuzz | 10 EVs | Route 222 | Grass | Sinnoh |

---

## EV Reduction Berries

If you overtrained a stat, use these berries to reduce EVs:

| Berry | Stat | Effect |
|---|---|---|
| Pomeg Berry | HP | -10 HP EVs |
| Kelpsy Berry | Attack | -10 ATK EVs |
| Qualot Berry | Defense | -10 DEF EVs |
| Hondew Berry | Special Attack | -10 SpATK EVs |
| Grepa Berry | Special Defense | -10 SpDEF EVs |
| Tamato Berry | Speed | -10 SPE EVs |
`;

const page = {
  slug:          'ev-training',
  title:         'EV Training Guide',
  template_type: 'free',
  content,
  category:      'Guides',
  updated_at:    new Date().toISOString(),
};

// ── Upsert ───────────────────────────────────────────────────────────────────

const { error } = await supabase
  .from('pages')
  .upsert(page, { onConflict: 'slug' });

if (error) {
  console.error('Error upserting page:', error.message);
  process.exit(1);
}

console.log('✅ Upserted page:', page.slug);
