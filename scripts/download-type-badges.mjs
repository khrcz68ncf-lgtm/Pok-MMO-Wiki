import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC    = join(__dirname, '..', 'public');

const TYPE_BADGES = [
  { name: 'grass',     url: 'https://images.shoutwiki.com/pokemmo/1/14/UI_Grass_Type.png'    },
  { name: 'poison',    url: 'https://images.shoutwiki.com/pokemmo/5/5b/UI_Poison_Type.png'   },
  { name: 'fire',      url: 'https://images.shoutwiki.com/pokemmo/2/26/UI_Fire_Type.png'     },
  { name: 'flying',    url: 'https://images.shoutwiki.com/pokemmo/d/d2/UI_Flying_Type.png'   },
  { name: 'water',     url: 'https://images.shoutwiki.com/pokemmo/2/27/UI_Water_Type.png'    },
  { name: 'bug',       url: 'https://images.shoutwiki.com/pokemmo/d/df/UI_Bug_Type.png'      },
  { name: 'normal',    url: 'https://images.shoutwiki.com/pokemmo/6/6c/UI_Normal_Type.png'   },
  { name: 'electric',  url: 'https://images.shoutwiki.com/pokemmo/9/95/UI_Electric_Type.png' },
  { name: 'ground',    url: 'https://images.shoutwiki.com/pokemmo/f/fd/UI_Ground_Type.png'   },
  { name: 'fighting',  url: 'https://images.shoutwiki.com/pokemmo/6/66/UI_Fighting_Type.png' },
  { name: 'rock',      url: 'https://images.shoutwiki.com/pokemmo/1/17/UI_Rock_Type.png'     },
  { name: 'psychic',   url: 'https://images.shoutwiki.com/pokemmo/4/48/UI_Psychic_Type.png'  },
  { name: 'ice',       url: 'https://images.shoutwiki.com/pokemmo/8/82/UI_Ice_Type.png'      },
  { name: 'ghost',     url: 'https://images.shoutwiki.com/pokemmo/9/9f/UI_Ghost_Type.png'    },
  { name: 'dragon',    url: 'https://images.shoutwiki.com/pokemmo/a/a4/UI_Dragon_Type.png'   },
  { name: 'dark',      url: 'https://images.shoutwiki.com/pokemmo/2/25/UI_Dark_Type.png'     },
];

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PokéMMO-Wiki-Bot/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function run() {
  mkdirSync(join(PUBLIC, 'types'), { recursive: true });

  console.log('Downloading type badges…');
  for (const { name, url } of TYPE_BADGES) {
    const dest = join(PUBLIC, 'types', `${name}.png`);
    try {
      await download(url, dest);
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.error(`  ✗ ${name} failed — ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
