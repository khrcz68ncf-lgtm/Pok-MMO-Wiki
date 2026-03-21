import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navbar from '@/app/components/Navbar';
import TypeBadge from '@/app/components/TypeBadge';
import CategoryBadge from '@/app/components/CategoryBadge';
import { ALL_TYPES, TYPE_COLORS, calcOffensive, calcDefensive } from '@/lib/type-chart';

// ─── Types ────────────────────────────────────────────────────────────────────

type Move = {
  name: string;
  type?: string;
  damage_class?: string;
  power?: number | null;
  accuracy?: number | null;
};

type PokemonMeta = {
  pokemon_id: number;
  name: string;
  types: string[];
  sprites: { front?: string; front_shiny?: string };
  moves?: Move[];
};

type Page = {
  title: string;
  slug: string;
  metadata: PokemonMeta;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-white mb-5 pb-2 border-b border-gray-800">
      {children}
    </h2>
  );
}

function TypeRow({
  label,
  types,
  labelClass,
}: {
  label: string;
  types: string[];
  labelClass: string;
}) {
  if (types.length === 0) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-800/50 last:border-0">
      <span className={`text-xs font-semibold w-36 shrink-0 ${labelClass}`}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {types.map((t) => (
          <TypeBadge key={t} type={t} className="h-6" />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: rawType } = await params;
  const typeName = rawType.toLowerCase();

  if (!ALL_TYPES.includes(typeName)) notFound();

  // Fetch all Pokémon pages in one query, filter in JS
  const { data: allPages } = await supabase
    .from('pages')
    .select('title, slug, metadata')
    .eq('template_type', 'pokemon')
    .not('metadata', 'is', null);

  const pages = (allPages ?? []) as Page[];

  // Section 2: Pokémon of this type (sorted by pokemon_id)
  const pokemonOfType = pages
    .filter((p) => Array.isArray(p.metadata?.types) && p.metadata.types.includes(typeName))
    .sort((a, b) => (a.metadata.pokemon_id ?? 0) - (b.metadata.pokemon_id ?? 0));

  // Section 3: Moves of this type (deduplicated by name)
  const movesMap = new Map<string, Move>();
  for (const p of pages) {
    for (const move of p.metadata?.moves ?? []) {
      if (move.type === typeName && !movesMap.has(move.name)) {
        movesMap.set(move.name, move);
      }
    }
  }
  const moves = Array.from(movesMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Section 1: Type effectiveness
  const offensive = calcOffensive(typeName);
  const defensive = calcDefensive(typeName);

  const displayName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
  const typeColor   = TYPE_COLORS[typeName] ?? '#888';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/wiki" className="hover:text-gray-300 transition-colors">Wiki</Link>
          <span>/</span>
          <span className="text-gray-300">Types</span>
          <span>/</span>
          <span className="text-gray-300">{displayName}</span>
        </nav>

        {/* Hero */}
        <div className="flex items-center gap-4 mb-10">
          <TypeBadge type={typeName} className="h-10" />
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              {displayName} Type
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {pokemonOfType.length} Pokémon · {moves.length} moves
            </p>
          </div>
        </div>

        {/* ── Section 1: Type Effectiveness ─────────────────────────────── */}
        <section className="mb-12">
          <SectionHeading>Type Effectiveness</SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offensive */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                Attacking with {displayName}
              </p>
              <TypeRow label="Super effective (2×)" types={offensive.superEffective} labelClass="text-red-400"   />
              <TypeRow label="Not very effective (½×)" types={offensive.notVery}       labelClass="text-green-400" />
              <TypeRow label="No effect (0×)"       types={offensive.immune}         labelClass="text-gray-500"  />
              {offensive.superEffective.length === 0 && offensive.notVery.length === 0 && offensive.immune.length === 0 && (
                <p className="text-gray-600 text-sm">Normal effectiveness against all types.</p>
              )}
            </div>

            {/* Defensive */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                Defending as {displayName}
              </p>
              <TypeRow label="Weak to (2×)"    types={defensive.weakTo}   labelClass="text-red-400"   />
              <TypeRow label="Resists (½×)"    types={defensive.resists}  labelClass="text-green-400" />
              <TypeRow label="Immune to (0×)"  types={defensive.immuneTo} labelClass="text-gray-500"  />
              {defensive.weakTo.length === 0 && defensive.resists.length === 0 && defensive.immuneTo.length === 0 && (
                <p className="text-gray-600 text-sm">Takes normal damage from all types.</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 2: Pokémon of this type ───────────────────────────── */}
        <section className="mb-12">
          <SectionHeading>
            {displayName}-type Pokémon ({pokemonOfType.length})
          </SectionHeading>

          {pokemonOfType.length === 0 ? (
            <p className="text-gray-500 text-sm">No Pokémon found for this type.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {pokemonOfType.map((p) => {
                const num     = String(p.metadata.pokemon_id).padStart(3, '0');
                const sprite  = p.metadata.sprites?.front;
                const name    = p.metadata.name
                  ? p.metadata.name.charAt(0).toUpperCase() + p.metadata.name.slice(1)
                  : p.title;

                return (
                  <Link
                    key={p.slug}
                    href={`/wiki/${p.slug}`}
                    className="group rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 p-3 flex flex-col items-center gap-2 transition-all"
                  >
                    {/* Sprite */}
                    <div className="w-16 h-16 flex items-center justify-center">
                      {sprite ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sprite}
                          alt={name}
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
                          ?
                        </div>
                      )}
                    </div>

                    {/* Number */}
                    <p className="text-xs text-gray-600 font-mono">#{num}</p>

                    {/* Name */}
                    <p className="text-sm font-semibold text-gray-200 group-hover:text-white capitalize text-center leading-tight transition-colors">
                      {name}
                    </p>

                    {/* Type badges */}
                    <div className="flex gap-1 flex-wrap justify-center">
                      {p.metadata.types?.map((t) => (
                        <TypeBadge key={t} type={t} className="h-5" />
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Section 3: Moves of this type ─────────────────────────────── */}
        <section className="mb-12">
          <SectionHeading>
            {displayName}-type Moves ({moves.length})
          </SectionHeading>

          {moves.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No move data available yet. Run the PokéAPI import script to populate move types.
            </p>
          ) : (
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Move</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Category</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold">Power</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {moves.map((m, i) => {
                    const moveSlug = m.name.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <tr
                        key={m.name}
                        className={`border-b border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-900/30'}`}
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/wiki/${moveSlug}`}
                            className="capitalize text-gray-200 hover:text-red-400 transition-colors"
                          >
                            {m.name.replace(/-/g, ' ')}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          {m.damage_class ? (
                            <CategoryBadge category={m.damage_class} className="h-5" />
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-300">
                          {m.power ?? <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-300">
                          {m.accuracy != null ? `${m.accuracy}%` : <span className="text-gray-600">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
