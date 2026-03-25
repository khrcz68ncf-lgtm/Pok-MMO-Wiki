/**
 * download-seeds.mjs
 * Downloads seed images from Gyazo and saves them to public/seeds/
 *
 * Usage: node scripts/download-seeds.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = path.join(__dirname, '..', 'public', 'seeds');

const SEEDS = [
  { url: 'https://i.gyazo.com/8713f84be72b64e577858643f2d96117.png', file: 'plain-spicy.png'  },
  { url: 'https://i.gyazo.com/691436c46e9ba9acfed6360eebe07a84.png', file: 'very-spicy.png'   },
  { url: 'https://i.gyazo.com/b22e37fe2b7171c5fee182fb972176c7.png', file: 'plain-sweet.png'  },
  { url: 'https://i.gyazo.com/f70d89f083af4c291de2e846da89340e.png', file: 'very-sweet.png'   },
  { url: 'https://i.gyazo.com/b30a01c7737c2f2c9c0da57fb5ddb4be.png', file: 'plain-bitter.png' },
  { url: 'https://i.gyazo.com/6ee34b5419876c7f7d71b617bcb4ebdf.png', file: 'very-bitter.png'  },
  { url: 'https://i.gyazo.com/a9f85ce618b8ff6f3339a1c944bf2fe6.png', file: 'plain-sour.png'   },
  { url: 'https://i.gyazo.com/36afcc141c8a18152ae45d2d360157f6.png', file: 'very-sour.png'    },
  { url: 'https://i.gyazo.com/745043c2d166fb12329753f9e5bbb82e.png', file: 'plain-dry.png'    },
  { url: 'https://i.gyazo.com/0095770fac72dd182a720fbb7fedd28d.png', file: 'very-dry.png'     },
];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let ok = 0, fail = 0;

for (const { url, file } of SEEDS) {
  const dest = path.join(OUT_DIR, file);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`  ✓ ${file}  (${buf.length} bytes)`);
    ok++;
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} downloaded, ${fail} failed → public/seeds/`);
