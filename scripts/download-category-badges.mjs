/**
 * download-category-badges.mjs
 * Downloads move category badge images from the PokéMMO wiki.
 *
 * Usage:
 *   node scripts/download-category-badges.mjs
 */

import fs   from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir    = path.join(__dirname, '..', 'public', 'categories');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const badges = [
  { url: 'https://images.shoutwiki.com/pokemmo/8/85/UI_Physical.png', file: 'physical.png' },
  { url: 'https://images.shoutwiki.com/pokemmo/7/75/UI_Special.png',  file: 'special.png'  },
  { url: 'https://images.shoutwiki.com/pokemmo/b/b4/UI_Status.png',   file: 'status.png'   },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    function get(u) {
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.destroy();
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.destroy();
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      }).on('error', reject);
    }
    get(url);
  });
}

for (const { url, file } of badges) {
  const dest = path.join(outDir, file);
  process.stdout.write(`Downloading ${file}… `);
  try {
    await download(url, dest);
    console.log('done');
  } catch (err) {
    console.error(`FAILED: ${err.message}`);
  }
}
