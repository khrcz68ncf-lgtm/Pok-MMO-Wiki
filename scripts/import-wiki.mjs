/**
 * import-wiki.mjs
 * Fetches all pages from the PokéMMO ShoutWiki, converts wikitext to
 * markdown, and upserts them into Supabase.
 *
 * Usage:
 *   node scripts/import-wiki.mjs
 *
 * Reads credentials from .env.local (two directories up from this file).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// 1. Load .env.local
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Could not find .env.local at: ${envPath}`);
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

// .env.local lives two levels up: pokemmo-wiki/ (root) → pokemmo-wiki/scripts/
loadEnv(path.resolve(__dirname, '../../.env.local'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Supabase client
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------

const BASE = 'https://pokemmo.shoutwiki.com/w/api.php';
const DELAY_MS = 50;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function apiFetch(params) {
  const url = new URL(BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'PokéMMO-Wiki-Importer/1.0 (educational project)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// 4. Wikitext → Markdown conversion
// ---------------------------------------------------------------------------

function wikitextToMarkdown(wikitext) {
  let md = wikitext;

  // Remove noinclude/includeonly blocks
  md = md.replace(/<noinclude>[\s\S]*?<\/noinclude>/gi, '');
  md = md.replace(/<includeonly>[\s\S]*?<\/includeonly>/gi, '');

  // Remove <ref> citations
  md = md.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  md = md.replace(/<ref[^>]*\/>/gi, '');

  // Remove HTML comments
  md = md.replace(/<!--[\s\S]*?-->/g, '');

  // Remove {{DEFAULTSORT:...}}, {{TOC}}, and other metadata templates on their own line
  md = md.replace(/^\{\{[A-Z][^}]*\}\}\s*$/gim, '');

  // Remove [[Category:...]] links
  md = md.replace(/\[\[Category:[^\]]*\]\]/gi, '');

  // Remove [[File:...]] and [[Image:...]] embeds
  md = md.replace(/\[\[(File|Image):[^\]]*\]\]/gi, '');

  // Strip remaining templates: {{template|arg|arg}} — simple single-level removal
  // Run twice to catch nested templates like {{outer|{{inner}}}}
  const stripTemplate = (s) =>
    s.replace(/\{\{[^{}]*\}\}/g, '');
  md = stripTemplate(stripTemplate(md));

  // Tables — remove entirely (wikitext tables are complex)
  md = md.replace(/\{\|[\s\S]*?\|\}/g, '');

  // Headings: == Heading == → ## Heading (levels 2–6)
  md = md.replace(/^======\s*(.+?)\s*======\s*$/gm, '###### $1');
  md = md.replace(/^=====\s*(.+?)\s*=====\s*$/gm, '##### $1');
  md = md.replace(/^====\s*(.+?)\s*====\s*$/gm, '#### $1');
  md = md.replace(/^===\s*(.+?)\s*===\s*$/gm, '### $1');
  md = md.replace(/^==\s*(.+?)\s*==\s*$/gm, '## $1');
  md = md.replace(/^=\s*(.+?)\s*=\s*$/gm, '# $1');

  // Bold + italic: '''''text''''' → ***text***
  md = md.replace(/'''''(.+?)'''''/g, '***$1***');
  // Bold: '''text''' → **text**
  md = md.replace(/'''(.+?)'''/g, '**$1**');
  // Italic: ''text'' → *text*
  md = md.replace(/''(.+?)''/g, '*$1*');

  // Internal links: [[Page|Display]] → [Display](/wiki/page)
  md = md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, target, display) => {
    const slug = target.trim().toLowerCase().replace(/\s+/g, '-');
    return `[${display.trim()}](/wiki/${slug})`;
  });
  // Internal links: [[Page]] → [Page](/wiki/page)
  md = md.replace(/\[\[([^\]]+)\]\]/g, (_, target) => {
    const slug = target.trim().toLowerCase().replace(/\s+/g, '-');
    return `[${target.trim()}](/wiki/${slug})`;
  });

  // External links: [https://example.com Display] → [Display](https://example.com)
  md = md.replace(/\[(\S+)\s+([^\]]+)\]/g, '[$2]($1)');
  // Bare external links: [https://example.com] → <https://example.com>
  md = md.replace(/\[(\S+)\]/g, '<$1>');

  // Definition lists: ;term → **term**  and :definition → &nbsp;&nbsp;definition
  md = md.replace(/^;\s*(.+)$/gm, '**$1**');
  md = md.replace(/^:\s*(.+)$/gm, '  $1');

  // Unordered lists: lines starting with * (preserve nesting with spaces)
  md = md.replace(/^(\*+)\s*(.+)$/gm, (_, stars, content) => {
    const indent = '  '.repeat(stars.length - 1);
    return `${indent}- ${content}`;
  });

  // Ordered lists: lines starting with #
  md = md.replace(/^(#+)\s*(.+)$/gm, (_, hashes, content) => {
    const indent = '  '.repeat(hashes.length - 1);
    return `${indent}1. ${content}`;
  });

  // Horizontal rule
  md = md.replace(/^----+\s*$/gm, '---');

  // HTML tags: strip common ones
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/?(?:div|span|p|center|small|big|sup|sub|tt|code|pre|nowiki|s|u|del|ins|blockquote)[^>]*>/gi, '');

  // Condense 3+ consecutive blank lines → 2
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

// ---------------------------------------------------------------------------
// 5. Slug helper
// ---------------------------------------------------------------------------

function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// 6. Fetch all page titles (with pagination)
// ---------------------------------------------------------------------------

async function fetchAllTitles() {
  const titles = [];
  let continueParam = {};
  let page = 1;

  console.log('Fetching page list...');

  while (true) {
    const data = await apiFetch({
      action: 'query',
      list: 'allpages',
      aplimit: '500',
      format: 'json',
      ...continueParam,
    });

    const batch = data?.query?.allpages ?? [];
    titles.push(...batch.map((p) => p.title));
    console.log(`  Page ${page}: fetched ${batch.length} titles (total so far: ${titles.length})`);

    if (!data.continue) break;
    continueParam = data.continue;
    page++;
    await delay(DELAY_MS);
  }

  console.log(`Done. Total pages to import: ${titles.length}\n`);
  return titles;
}

// ---------------------------------------------------------------------------
// 7. Fetch wikitext for a single title
// ---------------------------------------------------------------------------

async function fetchWikitext(title) {
  const data = await apiFetch({
    action: 'query',
    titles: title,
    prop: 'revisions',
    rvprop: 'content',
    format: 'json',
  });

  const pages = data?.query?.pages ?? {};
  const pageData = Object.values(pages)[0];
  return pageData?.revisions?.[0]?.['*'] ?? '';
}

// ---------------------------------------------------------------------------
// 8. Main import loop
// ---------------------------------------------------------------------------

async function main() {
  const titles = await fetchAllTitles();
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const slug = titleToSlug(title);

    if (!slug) {
      console.warn(`[${i + 1}/${titles.length}] Skipping — empty slug for: "${title}"`);
      skipped++;
      continue;
    }

    try {
      const wikitext = await fetchWikitext(title);
      await delay(DELAY_MS);

      if (!wikitext) {
        console.warn(`[${i + 1}/${titles.length}] Skipping — no content for: "${title}"`);
        skipped++;
        continue;
      }

      const content = wikitextToMarkdown(wikitext);

      const { error } = await supabase.from('pages').upsert(
        {
          slug,
          title,
          content,
          category: 'imported',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      );

      if (error) {
        console.error(`[${i + 1}/${titles.length}] Supabase error for "${title}":`, error.message);
        errors++;
      } else {
        console.log(`[${i + 1}/${titles.length}] ✓ ${title}`);
        imported++;
      }
    } catch (err) {
      console.error(`[${i + 1}/${titles.length}] Failed for "${title}":`, err.message);
      errors++;
      await delay(DELAY_MS);
    }
  }

  console.log('\n=== Import complete ===');
  console.log(`  Imported : ${imported}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Errors   : ${errors}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
