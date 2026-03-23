/**
 * seed-berries.mjs
 * Seeds the berries table in Supabase with all 65 PokéMMO berries.
 *
 * Usage:
 *   node scripts/seed-berries.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * in .env.local (or set as shell env vars).
 */

import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const require = createRequire(import.meta.url);
  const dotenv  = require('dotenv');
  dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
} catch { /* dotenv optional */ }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const BERRIES = [
  { name_fr: 'Baie Ceriz',  name_en: 'Cheri Berry',  growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'spicy',amount:3,type:'plain'}] },
  { name_fr: 'Baie Maron',  name_en: 'Chesto Berry', growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'dry',amount:3,type:'plain'}] },
  { name_fr: 'Baie Pêcha',  name_en: 'Pecha Berry',  growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'sweet',amount:3,type:'plain'}] },
  { name_fr: 'Baie Fraive', name_en: 'Rawst Berry',  growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'bitter',amount:3,type:'plain'}] },
  { name_fr: 'Baie Willia', name_en: 'Aspear Berry', growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'sour',amount:3,type:'plain'}] },
  { name_fr: 'Baie Mepo',   name_en: 'Leppa Berry',  growth_time: 20, min_yield: 5,  max_yield: 7,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Oran',   name_en: 'Oran Berry',   growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'bitter',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Kika',   name_en: 'Persim Berry', growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'dry',amount:1,type:'plain'},{color:'spicy',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Prine',  name_en: 'Lum Berry',    growth_time: 44, min_yield: 7,  max_yield: 10, seeds: [{color:'spicy',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Sitrus', name_en: 'Sitrus Berry', growth_time: 44, min_yield: 7,  max_yield: 10, seeds: [{color:'sweet',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Figuy',  name_en: 'Figy Berry',   growth_time: 20, min_yield: 4,  max_yield: 7,  seeds: [{color:'spicy',amount:2,type:'plain'},{color:'spicy',amount:1,type:'plain'}] },
  { name_fr: 'Baie Wiki',   name_en: 'Wiki Berry',   growth_time: 20, min_yield: 4,  max_yield: 7,  seeds: [{color:'dry',amount:2,type:'plain'}] },
  { name_fr: 'Baie Mago',   name_en: 'Mago Berry',   growth_time: 20, min_yield: 4,  max_yield: 7,  seeds: [{color:'sweet',amount:2,type:'plain'}] },
  { name_fr: 'Baie Gowav',  name_en: 'Aguav Berry',  growth_time: 20, min_yield: 4,  max_yield: 7,  seeds: [{color:'bitter',amount:2,type:'plain'}] },
  { name_fr: 'Baie Papaya', name_en: 'Iapapa Berry', growth_time: 20, min_yield: 4,  max_yield: 7,  seeds: [{color:'sour',amount:2,type:'plain'}] },
  { name_fr: 'Baie Framby', name_en: 'Razz Berry',   growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Remu',   name_en: 'Bluk Berry',   growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'sweet',amount:2,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Nanab',  name_en: 'Nanab Berry',  growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'sweet',amount:2,type:'plain'},{color:'bitter',amount:1,type:'plain'}] },
  { name_fr: 'Baie Repoi',  name_en: 'Wepear Berry', growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'sour',amount:2,type:'plain'},{color:'bitter',amount:1,type:'plain'}] },
  { name_fr: 'Baie Nanana', name_en: 'Pinap Berry',  growth_time: 16, min_yield: 3,  max_yield: 6,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'sour',amount:2,type:'plain'}] },
  { name_fr: 'Baie Grena',  name_en: 'Pomeg Berry',  growth_time: 44, min_yield: 7,  max_yield: 9,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Alga',   name_en: 'Kelpsy Berry', growth_time: 44, min_yield: 7,  max_yield: 9,  seeds: [{color:'dry',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Qualot', name_en: 'Qualot Berry', growth_time: 44, min_yield: 7,  max_yield: 9,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Lonme',  name_en: 'Hondew Berry', growth_time: 44, min_yield: 7,  max_yield: 9,  seeds: [{color:'dry',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'}] },
  { name_fr: 'Baie Resin',  name_en: 'Grepa Berry',  growth_time: 44, min_yield: 7,  max_yield: 9,  seeds: [{color:'sweet',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Tamato', name_en: 'Tamato Berry', growth_time: 44, min_yield: 7,  max_yield: 9,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Siam',   name_en: 'Cornn Berry',  growth_time: 20, min_yield: 4,  max_yield: 7,  seeds: [{color:'dry',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Mangou', name_en: 'Magost Berry', growth_time: 20, min_yield: 4,  max_yield: 7,  seeds: [{color:'sweet',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Rabuta', name_en: 'Rabuta Berry', growth_time: 20, min_yield: 4,  max_yield: 7,  seeds: [{color:'bitter',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Tronci', name_en: 'Nomel Berry',  growth_time: 20, min_yield: 4,  max_yield: 7,  seeds: [{color:'sour',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Kiwan',  name_en: 'Spelon Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'spicy',amount:2,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Palma',  name_en: 'Pamtre Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'dry',amount:2,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Stekpa', name_en: 'Watmel Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'sweet',amount:2,type:'plain'},{color:'bitter',amount:1,type:'plain'}] },
  { name_fr: 'Baie Durin',  name_en: 'Durin Berry',  growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'bitter',amount:2,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Myrte',  name_en: 'Belue Berry',  growth_time: 20, min_yield: 7,  max_yield: 9,  seeds: [{color:'sour',amount:1,type:'plain'},{color:'spicy',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Chocco', name_en: 'Occa Berry',   growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Pocpoc', name_en: 'Passho Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'dry',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Parma',  name_en: 'Wacan Berry',  growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'sweet',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Ratam',  name_en: 'Rindo Berry',  growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'bitter',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'spicy',amount:1,type:'plain'}] },
  { name_fr: 'Baie Nanone', name_en: 'Yache Berry',  growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'sour',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Pomroz', name_en: 'Chople Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'}] },
  { name_fr: 'Baie Kébia',  name_en: 'Kebia Berry',  growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'bitter',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Jouca',  name_en: 'Shuca Berry',  growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'sweet',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'},{color:'spicy',amount:1,type:'plain'}] },
  { name_fr: 'Baie Cobaba', name_en: 'Coba Berry',   growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'bitter',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Yapap',  name_en: 'Payapa Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'sour',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Panga',  name_en: 'Tanga Berry',  growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'spicy',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Charti', name_en: 'Charti Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'dry',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'spicy',amount:1,type:'plain'}] },
  { name_fr: 'Baie Sédra',  name_en: 'Kasib Berry',  growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'sweet',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Fraiga', name_en: 'Haban Berry',  growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'bitter',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Lampou', name_en: 'Colbur Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'sour',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'},{color:'spicy',amount:1,type:'plain'}] },
  { name_fr: 'Baie Babiri', name_en: 'Babiri Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'spicy',amount:1,type:'plain'},{color:'spicy',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Zalis',  name_en: 'Chilan Berry', growth_time: 42, min_yield: 7,  max_yield: 9,  seeds: [{color:'dry',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Lichii', name_en: 'Liechi Berry', growth_time: 67, min_yield: 10, max_yield: 13, seeds: [{color:'spicy',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Lingan', name_en: 'Ganlon Berry', growth_time: 67, min_yield: 10, max_yield: 13, seeds: [{color:'dry',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'}] },
  { name_fr: 'Baie Sailak', name_en: 'Salac Berry',  growth_time: 67, min_yield: 10, max_yield: 13, seeds: [{color:'sweet',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Pitaya', name_en: 'Petaya Berry', growth_time: 67, min_yield: 10, max_yield: 13, seeds: [{color:'spicy',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Abriko', name_en: 'Apicot Berry', growth_time: 67, min_yield: 10, max_yield: 13, seeds: [{color:'spicy',amount:1,type:'plain'},{color:'dry',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Lansat', name_en: 'Lansat Berry', growth_time: 67, min_yield: 11, max_yield: 13, seeds: [{color:'spicy',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Frista', name_en: 'Starf Berry',  growth_time: 67, min_yield: 11, max_yield: 13, seeds: [{color:'dry',amount:1,type:'plain'},{color:'sweet',amount:1,type:'plain'},{color:'bitter',amount:1,type:'plain'}] },
  { name_fr: 'Baie Enigma', name_en: 'Enigma Berry', growth_time: 42, min_yield: 7,  max_yield: 10, seeds: [{color:'spicy',amount:2,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
  { name_fr: 'Baie Micle',  name_en: 'Micle Berry',  growth_time: 44, min_yield: 7,  max_yield: 10, seeds: [{color:'dry',amount:2,type:'plain'},{color:'sweet',amount:1,type:'plain'}] },
  { name_fr: 'Baie Chérim', name_en: 'Custap Berry', growth_time: 44, min_yield: 7,  max_yield: 10, seeds: [{color:'sweet',amount:2,type:'plain'},{color:'bitter',amount:1,type:'plain'}] },
  { name_fr: 'Baie Jacoba', name_en: 'Jaboca Berry', growth_time: 44, min_yield: 7,  max_yield: 10, seeds: [{color:'bitter',amount:2,type:'plain'},{color:'sour',amount:1,type:'plain'}] },
  { name_fr: 'Baie Pommo',  name_en: 'Rowap Berry',  growth_time: 44, min_yield: 7,  max_yield: 10, seeds: [{color:'sour',amount:2,type:'plain'},{color:'dry',amount:1,type:'plain'}] },
];

// Only seed if the table is empty
const { count, error: countErr } = await supabase
  .from('berries')
  .select('*', { count: 'exact', head: true });

if (countErr) {
  console.error('❌ Could not check table:', countErr.message);
  process.exit(1);
}

if (count && count > 0) {
  console.log(`ℹ Table already has ${count} berries — skipping seed. Delete rows first to re-seed.`);
  process.exit(0);
}

const { error } = await supabase.from('berries').insert(BERRIES);

if (error) {
  if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
    console.error('❌ Table "berries" not found. Run the CREATE TABLE SQL in Supabase first:');
    console.error(`
CREATE TABLE IF NOT EXISTS berries (
  id uuid default gen_random_uuid() primary key,
  name_fr text not null,
  name_en text not null,
  growth_time int not null,
  min_yield int not null,
  max_yield int not null,
  seeds jsonb default '[]',
  effect text,
  updated_at timestamp default now()
);
ALTER TABLE berries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view berries" ON berries FOR SELECT USING (true);
CREATE POLICY "Only admins can modify berries" ON berries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
    `.trim());
  } else {
    console.error('❌ Seed failed:', error.message);
  }
  process.exit(1);
} else {
  console.log(`✓ Seeded ${BERRIES.length} berries successfully.`);
}
