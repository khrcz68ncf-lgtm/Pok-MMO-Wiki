import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import TypeBadge from '@/app/components/TypeBadge';
import CategoryBadge from '@/app/components/CategoryBadge';

// ─── Types ───────────────────────────────────────────────────────────────────

type MoveMeta = {
  move_id?:  number;
  name?:     string;
  type?:     string | null;
  category?: string | null;   // 'physical' | 'special' | 'status'
  power?:    number | null;
  accuracy?: number | null;
  pp?:       number | null;
  effect?:   string | null;
  priority?: number;
  target?:   string | null;
};

type PageData = {
  title:     string;
  content:   string;
  metadata:  MoveMeta;
};

type PokemonMove = { name: string; method: string; level: number };

type PokemonPage = {
  title:    string;
  slug:     string;
  metadata: {
    pokemon_id: number;
    name:       string;
    types:      string[];
    sprites:    { front?: string };
    moves?:     PokemonMove[];
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 py-2 border-b border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-widest w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-200">{children}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default async function MoveTemplate({
  page,
  slug,
}: {
  page: PageData;
  slug: string;
}) {
  const meta = page.metadata;
  const moveName = meta.name || page.title;
  const displayName = moveName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Fetch all Pokémon that learn this move
  const { data: allPokemon } = await supabase
    .from('pages')
    .select('title, slug, metadata')
    .eq('template_type', 'pokemon')
    .not('metadata', 'is', null);

  const learners = ((allPokemon ?? []) as PokemonPage[])
    .filter(
      (p) =>
        Array.isArray(p.metadata?.moves) &&
        p.metadata.moves.some((m) => m.name === slug)
    )
    .sort((a, b) => (a.metadata.pokemon_id ?? 0) - (b.metadata.pokemon_id ?? 0));

  return (
    <div className="flex gap-10">
      {/* ── Main column ──────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0">
        {/* Title + type badge */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">{displayName}</h1>
          {meta.type && <TypeBadge type={meta.type} className="h-9" />}
          {meta.category && <CategoryBadge category={meta.category} className="h-7" />}
        </div>

        {/* Effect description */}
        {meta.effect && (
          <div className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4 mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Effect</p>
            <p className="text-sm text-gray-300 leading-relaxed">{meta.effect}</p>
          </div>
        )}

        {/* Wiki content */}
        {page.content?.trim() && (
          <div className="text-sm text-gray-300 leading-relaxed mb-10">
            {page.content}
          </div>
        )}

        {/* ── Pokémon that learn this move ─────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold mb-5 pb-2 border-b border-gray-800">
            Pokémon that learn {displayName} ({learners.length})
          </h2>

          {learners.length === 0 ? (
            <p className="text-gray-500 text-sm">No Pokémon found.</p>
          ) : (
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">No.</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Sprite</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Type(s)</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Method</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((p, i) => {
                    const m   = p.metadata;
                    const num = String(m.pokemon_id).padStart(3, '0');
                    const name = m.name
                      ? m.name.charAt(0).toUpperCase() + m.name.slice(1)
                      : p.title;
                    // find the specific move entry(ies)
                    const moveEntries = m.moves?.filter((mv) => mv.name === slug) ?? [];

                    return moveEntries.map((mv, mi) => (
                      <tr
                        key={`${p.slug}-${mi}`}
                        className={`border-b border-gray-800 last:border-0 ${i % 2 === 1 ? 'bg-gray-900/20' : ''}`}
                      >
                        {mi === 0 && (
                          <>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-500" rowSpan={moveEntries.length}>
                              #{num}
                            </td>
                            <td className="px-4 py-2.5" rowSpan={moveEntries.length}>
                              {m.sprites?.front ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.sprites.front}
                                  alt={name}
                                  className="w-9 h-9 object-contain"
                                  style={{ imageRendering: 'pixelated' }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded bg-gray-800" />
                              )}
                            </td>
                            <td className="px-4 py-2.5" rowSpan={moveEntries.length}>
                              <Link
                                href={`/wiki/${p.slug}`}
                                className="font-medium text-gray-200 hover:text-red-400 capitalize transition-colors"
                              >
                                {name}
                              </Link>
                            </td>
                            <td className="px-4 py-2.5" rowSpan={moveEntries.length}>
                              <div className="flex gap-1 flex-wrap">
                                {m.types?.map((t) => (
                                  <TypeBadge key={t} type={t} className="h-5" />
                                ))}
                              </div>
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2.5 text-gray-400 capitalize text-xs">
                          {mv.method.replace(/-/g, ' ')}
                        </td>
                        <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">
                          {mv.method === 'level-up' ? (mv.level === 0 ? '—' : mv.level) : '—'}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ── Infobox ──────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="sticky top-6 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 bg-gray-800/50 px-5 py-6">
            <p className="text-lg font-bold capitalize text-white">{displayName}</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {meta.type && <TypeBadge type={meta.type} className="h-7" />}
              {meta.category && <CategoryBadge category={meta.category} className="h-6" />}
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 py-4">
            <InfoRow label="Power">
              {meta.power != null ? meta.power : <span className="text-gray-600">—</span>}
            </InfoRow>
            <InfoRow label="Accuracy">
              {meta.accuracy != null ? `${meta.accuracy}%` : <span className="text-gray-600">—</span>}
            </InfoRow>
            <InfoRow label="PP">
              {meta.pp != null ? meta.pp : <span className="text-gray-600">—</span>}
            </InfoRow>
            <InfoRow label="Priority">
              {meta.priority != null ? (meta.priority > 0 ? `+${meta.priority}` : meta.priority) : <span className="text-gray-600">0</span>}
            </InfoRow>
            <InfoRow label="Target">
              {meta.target
                ? meta.target.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                : <span className="text-gray-600">—</span>}
            </InfoRow>
          </div>
        </div>
      </aside>
    </div>
  );
}
