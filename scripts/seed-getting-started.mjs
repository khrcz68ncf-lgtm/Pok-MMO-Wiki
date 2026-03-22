/**
 * seed-getting-started.mjs
 * Upserts the "getting-started" wiki page into Supabase.
 *
 * Usage:
 *   node scripts/seed-getting-started.mjs
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

const content = `# Getting Started

The Getting Started guide will walk you through all the steps required to get you started on your new adventure in the Pokémon world.

## Installing the Game

1. Go to the [official website](https://pokemmo.com) and make an account.
2. Download the game client that matches your specific [platform](#supported-platforms).
3. You will need ROMs for [Fire Red or Leaf Green](/wiki/kanto), [Heart Gold or Soul Silver](/wiki/johto), [Emerald](/wiki/hoenn), [Platinum](/wiki/sinnoh), and [Black or White](/wiki/unova). You will have to obtain those ROMs on your own.
4. Install PokeMMO.
5. Start the PokeMMO game client and select the ROMs you obtained in step 3.
6. Log in, create and customize your own character, and select the region you want to start in.
7. Begin your adventure and most importantly — have fun!

## Starting a New Region

So now you have completed a region (or gotten bored and decided to start a new one) and you don't want to do the EXP, EV, or breeding grind all over again. How do you cut down on those boring tasks?

1. Check out the region's [level caps](/wiki/level-caps). Go back to previous cities and catch Pokémon that are at the level cap (or 1-2 levels lower). If you have stuff in your PC already that is better.
2. Find your region's [Pirate NPC](/wiki/pirate-npc).
3. Go to the new region. Choose your starter which is level 5. It should be able to defeat any Pokémon until you get to the first PC. Get the Pokémon that you stored from previous regions and use them. Make sure you keep track of your current [level cap](/wiki/level-caps). Each region has its own level cap progression.
4. When it's time for the [Elite Four](/wiki/elite-four), use your team from the previous region if they are within the region's current level cap.
5. You should be able to finish the region quickly. Collect any items and Pokémon you missed later.

## Supported Platforms {#supported-platforms}

PokeMMO officially supports **Windows**, **macOS 10.11.6+**, **Linux**, **Android 5.0+**, and **iOS 11+**.`;

const page = {
  slug:          'getting-started',
  title:         'Getting Started',
  content,
  template_type: 'free',
  category:      'Guides',
  updated_at:    new Date().toISOString(),
};

// ── Upsert ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Upserting "getting-started" page…');

  const { error } = await supabase
    .from('pages')
    .upsert(page, { onConflict: 'slug' });

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('Done — page upserted successfully.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
