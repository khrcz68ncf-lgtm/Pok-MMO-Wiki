/**
 * generate-og-image.mjs
 * Generates a simple public/og-image.png (1200×630) using SVG + sharp.
 *
 * Usage:
 *   npm install sharp --save-dev
 *   node scripts/generate-og-image.mjs
 *
 * If sharp is unavailable, save the SVG below manually as an SVG and
 * convert it using any tool (e.g. Figma, Canva, or rsvg-convert).
 */

import { createRequire } from 'module';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath   = path.join(__dirname, '..', 'public', 'og-image.png');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#030712"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%"   stop-color="#ef444420"/>
      <stop offset="100%" stop-color="#03071200"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Border -->
  <rect x="20" y="20" width="1160" height="590" rx="24"
        fill="none" stroke="#1f2937" stroke-width="2"/>

  <!-- Red accent bar -->
  <rect x="80" y="200" width="6" height="120" rx="3" fill="#ef4444"/>

  <!-- Title -->
  <text x="110" y="268" font-family="system-ui, -apple-system, sans-serif"
        font-size="72" font-weight="800" fill="white" letter-spacing="-2">
    PokéMMO
    <tspan fill="#ef4444">Wiki</tspan>
  </text>

  <!-- Subtitle -->
  <text x="110" y="330" font-family="system-ui, -apple-system, sans-serif"
        font-size="28" fill="#9ca3af" font-weight="400">
    Community-driven knowledge base for everything PokéMMO
  </text>

  <!-- Tags -->
  <g transform="translate(110, 390)">
    <rect width="110" height="36" rx="18" fill="#1f2937" stroke="#374151" stroke-width="1"/>
    <text x="55" y="24" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#9ca3af">Pokédex</text>
  </g>
  <g transform="translate(234, 390)">
    <rect width="90" height="36" rx="18" fill="#1f2937" stroke="#374151" stroke-width="1"/>
    <text x="45" y="24" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#9ca3af">Guides</text>
  </g>
  <g transform="translate(338, 390)">
    <rect width="60" height="36" rx="18" fill="#1f2937" stroke="#374151" stroke-width="1"/>
    <text x="30" y="24" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#9ca3af">PvP</text>
  </g>
  <g transform="translate(412, 390)">
    <rect width="120" height="36" rx="18" fill="#1f2937" stroke="#374151" stroke-width="1"/>
    <text x="60" y="24" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#9ca3af">Team Builder</text>
  </g>
  <g transform="translate(546, 390)">
    <rect width="130" height="36" rx="18" fill="#1f2937" stroke="#374151" stroke-width="1"/>
    <text x="65" y="24" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#9ca3af">Damage Calc</text>
  </g>
</svg>
`.trim();

// Try sharp first
try {
  const require = createRequire(import.meta.url);
  const sharp   = require('sharp');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ Generated ${outPath}`);
} catch {
  // Fallback: write the SVG so the user can convert it manually
  const svgPath = outPath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg);
  console.log(`sharp not installed — SVG written to ${svgPath}`);
  console.log('Convert it to PNG with: npx @resvg/resvg-js or any image tool.');
}
