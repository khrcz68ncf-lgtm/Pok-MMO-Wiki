import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type HeldPokemon = { pokemon_name: string; rarity: number | null };

type ItemMeta = {
  item_id:         number;
  name:            string;
  category:        string | null;
  attributes:      string[];
  cost:            number;
  effect:          string | null;
  flavor_text:     string | null;
  sprite:          string | null;
  held_by_pokemon: HeldPokemon[];
  fling_power:     number | null;
  fling_effect:    string | null;
};

type PageData = {
  title:    string;
  category: string | null;
  metadata: ItemMeta;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function cap(s: string) { return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

// ── Category badge colors ─────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'medicine':             'bg-red-500/10 border-red-500/30 text-red-400',
  'held-items':           'bg-blue-500/10 border-blue-500/30 text-blue-400',
  'berries':              'bg-green-500/10 border-green-500/30 text-green-400',
  'evolution':            'bg-purple-500/10 border-purple-500/30 text-purple-400',
  'battle':               'bg-orange-500/10 border-orange-500/30 text-orange-400',
  'vitamins':             'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  'effort-drop':          'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  'poke-balls':           'bg-red-500/10 border-red-500/30 text-red-400',
  'all-machines':         'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  'machines':             'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  'key-items':            'bg-amber-500/10 border-amber-500/30 text-amber-400',
  'stat-boosts':          'bg-teal-500/10 border-teal-500/30 text-teal-400',
  'flutes':               'bg-pink-500/10 border-pink-500/30 text-pink-400',
  'type-protection':      'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  'scarves':              'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400',
  'loot':                 'bg-gray-500/10 border-gray-500/30 text-gray-400',
  'other':                'bg-gray-500/10 border-gray-500/30 text-gray-400',
};

function categoryBadge(cat: string) {
  const key = cat.toLowerCase();
  return CATEGORY_COLORS[key] ?? 'bg-gray-500/10 border-gray-500/30 text-gray-400';
}

// ── Template ─────────────────────────────────────────────────────────────────

export default function ItemTemplate({ page, pokemonMap }: { page: PageData; pokemonMap: Record<string, number> }) {
  const meta   = page.metadata;
  const heldBy = (meta.held_by_pokemon ?? []).slice(0, 30);
  const sellPrice = meta.cost > 0 ? Math.floor(meta.cost / 2) : null;

  return (
    <div className="flex gap-8 flex-col lg:flex-row">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Title + category */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">{page.title}</h1>
          {meta.category && (
            <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium ${categoryBadge(meta.category)}`}>
              {cap(meta.category)}
            </span>
          )}
        </div>

        {/* Flavor text */}
        {meta.flavor_text && (
          <blockquote className="mb-6 border-l-4 border-red-500/40 pl-4 italic text-gray-400 text-sm leading-relaxed">
            {meta.flavor_text}
          </blockquote>
        )}

        {/* Effect — highlighted box */}
        {meta.effect && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-3 pb-1 border-b border-gray-800">Effect</h2>
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 px-5 py-4 flex gap-3">
              <span className="text-blue-400 text-lg shrink-0 mt-0.5">💡</span>
              <p className="text-gray-300 text-sm leading-relaxed">{meta.effect}</p>
            </div>
          </section>
        )}

        {/* Fling effect */}
        {(meta.fling_power != null || meta.fling_effect) && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-3 pb-1 border-b border-gray-800">Fling</h2>
            <div className="flex gap-6 text-sm">
              {meta.fling_power != null && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Power</p>
                  <p className="text-gray-200 font-mono font-semibold">{meta.fling_power}</p>
                </div>
              )}
              {meta.fling_effect && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Effect</p>
                  <p className="text-gray-200 capitalize">{cap(meta.fling_effect)}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Attributes */}
        {meta.attributes?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-3 pb-1 border-b border-gray-800">Attributes</h2>
            <div className="flex flex-wrap gap-2">
              {meta.attributes.map(a => (
                <span key={a} className="text-xs px-2.5 py-1 rounded-full border border-gray-700 bg-gray-800 text-gray-400">
                  {cap(a)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Held by Pokémon */}
        {heldBy.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-3 pb-1 border-b border-gray-800">
              Held by Wild Pokémon
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {heldBy.map(h => {
                const pokemonId = pokemonMap[h.pokemon_name] ?? null;
                const spriteUrl = pokemonId
                  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemonId}.gif`
                  : null;
                return (
                  <Link
                    key={h.pokemon_name}
                    href={`/wiki/${h.pokemon_name}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 hover:bg-gray-800/80 transition-all"
                  >
                    {spriteUrl
                      ? <img src={spriteUrl} alt={h.pokemon_name} className="w-10 h-10 object-contain shrink-0" /> /* eslint-disable-line @next/next/no-img-element */
                      : <div className="w-10 h-10 rounded-full bg-gray-800 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-200 capitalize truncate">
                        {h.pokemon_name.replace(/-/g, ' ')}
                      </p>
                      {h.rarity != null && (
                        <p className="text-[10px] text-gray-500">{h.rarity}% chance</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ── Infobox ───────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-56 shrink-0 lg:order-last">
        <div className="sticky top-6 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">

          {/* Sprite */}
          <div className="flex flex-col items-center bg-gray-800/50 px-4 py-8">
            {meta.sprite
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={meta.sprite}
                  alt={meta.name}
                  className="w-24 h-24 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              : <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl">🎒</div>
            }
          </div>

          <div className="px-4 py-4 space-y-3 text-sm divide-y divide-gray-800/60">
            {meta.category && (
              <div className="pb-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Category</p>
                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${categoryBadge(meta.category)}`}>
                  {cap(meta.category)}
                </span>
              </div>
            )}

            {(meta.cost != null && meta.cost > 0) ? (
              <div className="pt-3 space-y-2">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Buy Price</p>
                  <p className="text-gray-200 font-mono font-semibold">
                    {meta.cost.toLocaleString()}
                    <span className="text-gray-500 font-normal ml-0.5 text-xs"> ₽</span>
                  </p>
                </div>
                {sellPrice != null && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Sell Price</p>
                    <p className="text-gray-400 font-mono">
                      {sellPrice.toLocaleString()}
                      <span className="text-gray-600 font-normal ml-0.5 text-xs"> ₽</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (meta.cost === 0) ? (
              <div className="pt-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Price</p>
                <p className="text-gray-500 text-xs">Not sold</p>
              </div>
            ) : null}

            {meta.fling_power != null && (
              <div className="pt-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Fling Power</p>
                <p className="text-gray-200 font-mono">{meta.fling_power}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
