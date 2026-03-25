/**
 * update-berry-seeds.mjs
 * Updates all 65 berries in the Supabase berries table with correct seed recipes.
 *
 * Usage: node scripts/update-berry-seeds.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import { fileURLToPath }  from 'url';
import path               from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const dotenv = createRequire(import.meta.url)('dotenv');
  dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
} catch { /* dotenv optional */ }

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// ─── Seed data ────────────────────────────────────────────────────────────────
// name_en must match exactly what's stored in the berries table.
// Seeds: [{ color, type, amount }]

const BERRY_DATA = [
  { name_en: 'Aguav',   seeds: [{ color:'bitter', type:'very',  amount:2 }] },
  { name_en: 'Apicot',  seeds: [{ color:'spicy',  type:'plain', amount:1 }, { color:'dry',    type:'very',  amount:1 }, { color:'sour',   type:'very',  amount:1 }] },
  { name_en: 'Aspear',  seeds: [{ color:'sour',   type:'plain', amount:3 }] },
  { name_en: 'Babiri',  seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'spicy',  type:'plain', amount:1 }, { color:'dry',    type:'very',  amount:1 }] },
  { name_en: 'Belue',   seeds: [{ color:'sour',   type:'very',  amount:1 }, { color:'spicy',  type:'plain', amount:1 }, { color:'sour',   type:'plain', amount:1 }] },
  { name_en: 'Bluk',    seeds: [{ color:'sweet',  type:'plain', amount:2 }, { color:'dry',    type:'plain', amount:1 }] },
  { name_en: 'Charti',  seeds: [{ color:'dry',    type:'very',  amount:1 }, { color:'dry',    type:'plain', amount:1 }, { color:'spicy',  type:'very',  amount:1 }] },
  { name_en: 'Chilan',  seeds: [{ color:'dry',    type:'very',  amount:1 }, { color:'dry',    type:'plain', amount:1 }, { color:'sweet',  type:'very',  amount:1 }] },
  { name_en: 'Chople',  seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'spicy',  type:'plain', amount:1 }, { color:'bitter', type:'very',  amount:1 }] },
  { name_en: 'Coba',    seeds: [{ color:'bitter', type:'very',  amount:1 }, { color:'bitter', type:'plain', amount:1 }, { color:'dry',    type:'very',  amount:1 }] },
  { name_en: 'Colbur',  seeds: [{ color:'sour',   type:'very',  amount:1 }, { color:'sour',   type:'plain', amount:1 }, { color:'spicy',  type:'very',  amount:1 }] },
  { name_en: 'Custap',  seeds: [{ color:'sweet',  type:'very',  amount:2 }, { color:'bitter', type:'very',  amount:1 }] },
  { name_en: 'Cheri',   seeds: [{ color:'spicy',  type:'plain', amount:3 }] },
  { name_en: 'Chesto',  seeds: [{ color:'dry',    type:'plain', amount:3 }] },
  { name_en: 'Cornn',   seeds: [{ color:'dry',    type:'very',  amount:1 }, { color:'sweet',  type:'plain', amount:1 }, { color:'dry',    type:'plain', amount:1 }] },
  { name_en: 'Durin',   seeds: [{ color:'bitter', type:'very',  amount:2 }, { color:'sour',   type:'plain', amount:1 }] },
  { name_en: 'Enigma',  seeds: [{ color:'spicy',  type:'very',  amount:2 }, { color:'dry',    type:'very',  amount:1 }] },
  { name_en: 'Figy',    seeds: [{ color:'spicy',  type:'plain', amount:2 }, { color:'spicy',  type:'very',  amount:1 }] },
  { name_en: 'Ganlon',  seeds: [{ color:'dry',    type:'very',  amount:1 }, { color:'sweet',  type:'plain', amount:1 }, { color:'bitter', type:'very',  amount:1 }] },
  { name_en: 'Grepa',   seeds: [{ color:'sweet',  type:'plain', amount:1 }, { color:'sour',   type:'very',  amount:1 }, { color:'sour',   type:'plain', amount:1 }] },
  { name_en: 'Haban',   seeds: [{ color:'bitter', type:'very',  amount:1 }, { color:'bitter', type:'plain', amount:1 }, { color:'sweet',  type:'very',  amount:1 }] },
  { name_en: 'Hondew',  seeds: [{ color:'dry',    type:'plain', amount:1 }, { color:'bitter', type:'very',  amount:1 }, { color:'bitter', type:'plain', amount:1 }] },
  { name_en: 'Iapapa',  seeds: [{ color:'sour',   type:'very',  amount:2 }] },
  { name_en: 'Jaboca',  seeds: [{ color:'bitter', type:'very',  amount:2 }, { color:'sour',   type:'very',  amount:1 }] },
  { name_en: 'Kasib',   seeds: [{ color:'sweet',  type:'very',  amount:1 }, { color:'sweet',  type:'plain', amount:1 }, { color:'dry',    type:'very',  amount:1 }] },
  { name_en: 'Kebia',   seeds: [{ color:'dry',    type:'very',  amount:1 }, { color:'dry',    type:'plain', amount:1 }, { color:'sour',   type:'very',  amount:1 }] },
  { name_en: 'Kelpsy',  seeds: [{ color:'dry',    type:'very',  amount:1 }, { color:'sour',   type:'plain', amount:1 }, { color:'dry',    type:'plain', amount:1 }] },
  { name_en: 'Lansat',  seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'sweet',  type:'very',  amount:1 }, { color:'sour',   type:'very',  amount:1 }] },
  { name_en: 'Leppa',   seeds: [{ color:'sweet',  type:'plain', amount:1 }, { color:'spicy',  type:'very',  amount:1 }, { color:'bitter', type:'plain', amount:1 }] },
  { name_en: 'Liechi',  seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'dry',    type:'plain', amount:1 }, { color:'sweet',  type:'very',  amount:1 }] },
  { name_en: 'Lum',     seeds: [{ color:'dry',    type:'very',  amount:1 }, { color:'spicy',  type:'very',  amount:1 }, { color:'sweet',  type:'very',  amount:1 }] },
  { name_en: 'Mago',    seeds: [{ color:'sweet',  type:'very',  amount:2 }] },
  { name_en: 'Magost',  seeds: [{ color:'sweet',  type:'very',  amount:1 }, { color:'bitter', type:'plain', amount:1 }, { color:'sweet',  type:'plain', amount:1 }] },
  { name_en: 'Micle',   seeds: [{ color:'dry',    type:'very',  amount:2 }, { color:'sweet',  type:'very',  amount:1 }] },
  { name_en: 'Nanab',   seeds: [{ color:'sweet',  type:'plain', amount:2 }, { color:'bitter', type:'plain', amount:1 }] },
  { name_en: 'Nomel',   seeds: [{ color:'sour',   type:'very',  amount:1 }, { color:'sour',   type:'plain', amount:1 }, { color:'spicy',  type:'plain', amount:1 }] },
  { name_en: 'Occa',    seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'spicy',  type:'plain', amount:1 }, { color:'sweet',  type:'very',  amount:1 }] },
  { name_en: 'Oran',    seeds: [{ color:'bitter', type:'plain', amount:1 }, { color:'sour',   type:'plain', amount:1 }, { color:'dry',    type:'plain', amount:1 }] },
  { name_en: 'Pamtre',  seeds: [{ color:'dry',    type:'very',  amount:2 }, { color:'sweet',  type:'plain', amount:1 }] },
  { name_en: 'Passho',  seeds: [{ color:'dry',    type:'very',  amount:1 }, { color:'bitter', type:'very',  amount:1 }, { color:'dry',    type:'plain', amount:1 }] },
  { name_en: 'Payapa',  seeds: [{ color:'sour',   type:'very',  amount:1 }, { color:'sour',   type:'plain', amount:1 }, { color:'sweet',  type:'very',  amount:1 }] },
  { name_en: 'Pecha',   seeds: [{ color:'sweet',  type:'plain', amount:3 }] },
  { name_en: 'Persim',  seeds: [{ color:'dry',    type:'plain', amount:1 }, { color:'spicy',  type:'plain', amount:1 }, { color:'sweet',  type:'plain', amount:1 }] },
  { name_en: 'Petaya',  seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'bitter', type:'very',  amount:1 }, { color:'sour',   type:'plain', amount:1 }] },
  { name_en: 'Pinap',   seeds: [{ color:'spicy',  type:'plain', amount:1 }, { color:'sour',   type:'plain', amount:2 }] },
  { name_en: 'Pomeg',   seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'bitter', type:'plain', amount:1 }, { color:'spicy',  type:'plain', amount:1 }] },
  { name_en: 'Qualot',  seeds: [{ color:'spicy',  type:'plain', amount:1 }, { color:'sweet',  type:'very',  amount:1 }, { color:'sweet',  type:'plain', amount:1 }] },
  { name_en: 'Rabuta',  seeds: [{ color:'bitter', type:'very',  amount:1 }, { color:'bitter', type:'plain', amount:1 }, { color:'sour',   type:'plain', amount:1 }] },
  { name_en: 'Rawst',   seeds: [{ color:'bitter', type:'plain', amount:3 }] },
  { name_en: 'Razz',    seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'dry',    type:'plain', amount:1 }] },
  { name_en: 'Rindo',   seeds: [{ color:'bitter', type:'very',  amount:1 }, { color:'bitter', type:'plain', amount:1 }, { color:'spicy',  type:'very',  amount:1 }] },
  { name_en: 'Rowap',   seeds: [{ color:'sour',   type:'very',  amount:2 }, { color:'spicy',  type:'very',  amount:1 }] },
  { name_en: 'Salac',   seeds: [{ color:'sweet',  type:'very',  amount:1 }, { color:'bitter', type:'plain', amount:1 }, { color:'sour',   type:'very',  amount:1 }] },
  { name_en: 'Shuca',   seeds: [{ color:'sweet',  type:'very',  amount:1 }, { color:'sweet',  type:'plain', amount:1 }, { color:'spicy',  type:'very',  amount:1 }] },
  { name_en: 'Sitrus',  seeds: [{ color:'sweet',  type:'very',  amount:1 }, { color:'bitter', type:'very',  amount:1 }, { color:'sour',   type:'very',  amount:1 }] },
  { name_en: 'Spelon',  seeds: [{ color:'spicy',  type:'very',  amount:2 }, { color:'dry',    type:'plain', amount:1 }] },
  { name_en: 'Starf',   seeds: [{ color:'dry',    type:'very',  amount:1 }, { color:'sweet',  type:'very',  amount:1 }, { color:'bitter', type:'very',  amount:1 }] },
  { name_en: 'Tamato',  seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'dry',    type:'plain', amount:1 }, { color:'spicy',  type:'plain', amount:1 }] },
  { name_en: 'Tanga',   seeds: [{ color:'spicy',  type:'very',  amount:1 }, { color:'spicy',  type:'plain', amount:1 }, { color:'sour',   type:'very',  amount:1 }] },
  { name_en: 'Wacan',   seeds: [{ color:'sweet',  type:'very',  amount:1 }, { color:'sweet',  type:'plain', amount:1 }, { color:'sour',   type:'very',  amount:1 }] },
  { name_en: 'Watmel',  seeds: [{ color:'sweet',  type:'very',  amount:2 }, { color:'bitter', type:'plain', amount:1 }] },
  { name_en: 'Wepear',  seeds: [{ color:'sour',   type:'plain', amount:2 }, { color:'bitter', type:'very',  amount:1 }] },
  { name_en: 'Wiki',    seeds: [{ color:'dry',    type:'very',  amount:2 }] },
  { name_en: 'Yache',   seeds: [{ color:'sour',   type:'very',  amount:1 }, { color:'sour',   type:'plain', amount:1 }, { color:'dry',    type:'very',  amount:1 }] },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`Updating ${BERRY_DATA.length} berries…\n`);

let ok = 0, notFound = 0, failed = 0;

for (const { name_en, seeds } of BERRY_DATA) {
  const { error } = await db
    .from('berries')
    .update({ seeds })
    .ilike('name_en', name_en);   // case-insensitive match

  if (error) {
    console.error(`  ✗ ${name_en}: ${error.message}`);
    failed++;
  } else {
    console.log(`  ✓ ${name_en}`);
    ok++;
  }
}

console.log(`\n── Summary ──────────────────`);
console.log(`  ✓ Updated:   ${ok}`);
if (notFound) console.log(`  ? Not found: ${notFound}`);
if (failed)   console.log(`  ✗ Failed:    ${failed}`);
