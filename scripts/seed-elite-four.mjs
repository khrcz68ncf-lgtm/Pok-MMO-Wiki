/**
 * seed-elite-four.mjs
 * Upserts the Elite Four hub page + 25 individual member pages into Supabase.
 *
 * Usage:
 *   node scripts/seed-elite-four.mjs
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

// ── Data ─────────────────────────────────────────────────────────────────────

const REGIONS = [
  {
    name: 'Kanto',
    members: [
      { slug: 'lorelei',     title: 'Lorelei', type: 'Ice',      role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/d/db/Spr_FRLG_Lorelei.png' },
      { slug: 'bruno-kanto', title: 'Bruno',   type: 'Fighting', role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/f/f7/Spr_FRLG_Bruno.png'   },
      { slug: 'agatha',      title: 'Agatha',  type: 'Ghost',    role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/5/56/Spr_FRLG_Agatha.png'  },
      { slug: 'lance-kanto', title: 'Lance',   type: 'Dragon',   role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/f/fb/Spr_FRLG_Lance.png'   },
      { slug: 'blue',        title: 'Blue',    type: 'Normal',   role: 'Champion',   sprite: 'https://images.shoutwiki.com/pokemmo/e/e2/Spr_FRLG_Blue_2.png'  },
    ],
  },
  {
    name: 'Johto',
    members: [
      { slug: 'will',        title: 'Will',  type: 'Psychic',  role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/3/3d/Spr_Johto_Will.png'  },
      { slug: 'koga-johto',  title: 'Koga',  type: 'Poison',   role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/d/d9/Spr_Johto_Koga.png'  },
      { slug: 'bruno-johto', title: 'Bruno', type: 'Fighting', role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/6/6d/Spr_Johto_Bruno.png' },
      { slug: 'karen',       title: 'Karen', type: 'Dark',     role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/f/f9/Spr_Johto_Karen.png' },
      { slug: 'lance-johto', title: 'Lance', type: 'Dragon',   role: 'Champion',   sprite: 'https://images.shoutwiki.com/pokemmo/d/d9/Spr_Johto_Lance.png' },
    ],
  },
  {
    name: 'Hoenn',
    members: [
      { slug: 'sidney',  title: 'Sidney',  type: 'Dark',   role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/8/86/Spr_RS_Sidney.png' },
      { slug: 'phoebe',  title: 'Phoebe',  type: 'Ghost',  role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/e/e6/Spr_RS_Phoebe.png' },
      { slug: 'glacia',  title: 'Glacia',  type: 'Ice',    role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/7/71/Spr_RS_Glacia.png' },
      { slug: 'drake',   title: 'Drake',   type: 'Dragon', role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/0/04/Spr_RS_Drake.png'  },
      { slug: 'wallace', title: 'Wallace', type: 'Water',  role: 'Champion',   sprite: 'https://images.shoutwiki.com/pokemmo/c/cc/Spr_E_Wallace.png' },
    ],
  },
  {
    name: 'Sinnoh',
    members: [
      { slug: 'aaron',   title: 'Aaron',   type: 'Bug',     role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/1/1a/Spr_DP_Aaron.png'  },
      { slug: 'bertha',  title: 'Bertha',  type: 'Ground',  role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/f/f7/Spr_DP_Bertha.png' },
      { slug: 'flint',   title: 'Flint',   type: 'Fire',    role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/c/cb/Spr_DP_Flint.png'  },
      { slug: 'lucian',  title: 'Lucian',  type: 'Psychic', role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/7/74/Spr_DP_Lucian.png' },
      { slug: 'cynthia', title: 'Cynthia', type: 'Dragon',  role: 'Champion',   sprite: 'https://images.shoutwiki.com/pokemmo/2/2f/Spr_DP_Cynthia.png' },
    ],
  },
  {
    name: 'Unova',
    members: [
      { slug: 'shauntal', title: 'Shauntal', type: 'Ghost',    role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/2/28/Spr_BW_Shauntal.png' },
      { slug: 'marshal',  title: 'Marshal',  type: 'Fighting', role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/2/2e/Spr_BW_Marshal.png'  },
      { slug: 'grimsley', title: 'Grimsley', type: 'Dark',     role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/b/bf/Spr_BW_Grimsley.png' },
      { slug: 'caitlin',  title: 'Caitlin',  type: 'Psychic',  role: 'Elite Four', sprite: 'https://images.shoutwiki.com/pokemmo/8/86/Spr_BW_Caitlin.png'  },
      { slug: 'alder',    title: 'Alder',    type: 'Bug',      role: 'Champion',   sprite: 'https://images.shoutwiki.com/pokemmo/3/3f/Spr_BW_Alder.png'    },
    ],
  },
];

// ── Hub page content ──────────────────────────────────────────────────────────

const hubContent = `# Elite Four

The Elite Four are four exceptionally skilled Pokémon Trainers who must be defeated consecutively before you can challenge the Champion of each region. They represent the pinnacle of Pokémon training in their respective regions.

## Kanto
| # | Member | Type |
|---|---|---|
| Elite Four 1 | [Lorelei](/wiki/lorelei) | Ice |
| Elite Four 2 | [Bruno](/wiki/bruno-kanto) | Fighting |
| Elite Four 3 | [Agatha](/wiki/agatha) | Ghost |
| Elite Four 4 | [Lance](/wiki/lance-kanto) | Dragon |
| Champion | [Blue](/wiki/blue) | Normal |

## Johto
| # | Member | Type |
|---|---|---|
| Elite Four 1 | [Will](/wiki/will) | Psychic |
| Elite Four 2 | [Koga](/wiki/koga-johto) | Poison |
| Elite Four 3 | [Bruno](/wiki/bruno-johto) | Fighting |
| Elite Four 4 | [Karen](/wiki/karen) | Dark |
| Champion | [Lance](/wiki/lance-johto) | Dragon |

## Hoenn
| # | Member | Type |
|---|---|---|
| Elite Four 1 | [Sidney](/wiki/sidney) | Dark |
| Elite Four 2 | [Phoebe](/wiki/phoebe) | Ghost |
| Elite Four 3 | [Glacia](/wiki/glacia) | Ice |
| Elite Four 4 | [Drake](/wiki/drake) | Dragon |
| Champion | [Wallace](/wiki/wallace) | Water |

## Sinnoh
| # | Member | Type |
|---|---|---|
| Elite Four 1 | [Aaron](/wiki/aaron) | Bug |
| Elite Four 2 | [Bertha](/wiki/bertha) | Ground |
| Elite Four 3 | [Flint](/wiki/flint) | Fire |
| Elite Four 4 | [Lucian](/wiki/lucian) | Psychic |
| Champion | [Cynthia](/wiki/cynthia) | Dragon |

## Unova
| # | Member | Type |
|---|---|---|
| Elite Four 1 | [Shauntal](/wiki/shauntal) | Ghost |
| Elite Four 2 | [Marshal](/wiki/marshal) | Fighting |
| Elite Four 3 | [Grimsley](/wiki/grimsley) | Dark |
| Elite Four 4 | [Caitlin](/wiki/caitlin) | Psychic |
| Champion | [Alder](/wiki/alder) | Bug |`;

// ── Build all pages ───────────────────────────────────────────────────────────

const pages = [];

// Hub page
pages.push({
  slug:          'elite-four',
  title:         'Elite Four',
  content:       hubContent,
  template_type: 'free',
  category:      'Guides',
  updated_at:    new Date().toISOString(),
});

// Individual member pages
for (const region of REGIONS) {
  for (const m of region.members) {
    const roleLabel = m.role === 'Champion'
      ? `Champion of ${region.name}`
      : `${m.type}-type Elite Four member of ${region.name}`;

    const content = `# ${m.title}

![${m.title}](${m.sprite})

**${m.title}** is the ${roleLabel}.

## Details
- **Region:** [${region.name}](/wiki/${region.name.toLowerCase()})
- **Specialty:** ${m.type}
- **Role:** ${m.role}`;

    pages.push({
      slug:          m.slug,
      title:         m.title,
      content,
      template_type: 'free',
      category:      'Elite Four',
      updated_at:    new Date().toISOString(),
    });
  }
}

// ── Upsert ────────────────────────────────────────────────────────────────────

console.log(`Upserting ${pages.length} pages…`);

const { error } = await supabase
  .from('pages')
  .upsert(pages, { onConflict: 'slug' });

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log(`✓ Upserted ${pages.length} pages:`);
console.log('  • elite-four (hub)');
for (const region of REGIONS) {
  const names = region.members.map(m => m.slug).join(', ');
  console.log(`  • ${region.name}: ${names}`);
}
