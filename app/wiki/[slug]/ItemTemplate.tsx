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

// ── Template ─────────────────────────────────────────────────────────────────

export default function ItemTemplate({ page, pokemonMap }: { page: PageData; pokemonMap: Record<string, number> }) {
  const meta = page.metadata;
  const heldBy = (meta.held_by_pokemon ?? []).slice(0, 30);

  return (
    <div className="flex gap-8 flex-col lg:flex-row">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">{page.title}</h1>

        {/* Category */}
        {meta.category && (
          <span className="inline-block mb-4 text-xs px-2.5 py-1 rounded-full border border-gray-700 bg-gray-800 text-gray-400 uppercase tracking-widest">
            {cap(meta.category)}
          </span>
        )}

        {/* Flavor text */}
        {meta.flavor_text && (
          <blockquote className="mb-6 border-l-4 border-red-500/40 pl-4 italic text-gray-400 text-sm leading-relaxed">
            {meta.flavor_text}
          </blockquote>
        )}

        {/* Effect */}
        {meta.effect && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-2 pb-1 border-b border-gray-800">Effect</h2>
            <p className="text-gray-300 text-sm leading-relaxed">{meta.effect}</p>
          </section>
        )}

        {/* Attributes */}
        {meta.attributes?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-2 pb-1 border-b border-gray-800">Attributes</h2>
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
                    className="flex items-center gap-2 p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors"
                  >
                    {spriteUrl
                      ? <img src={spriteUrl} alt={h.pokemon_name} className="w-10 h-10 object-contain" /> /* eslint-disable-line @next/next/no-img-element */
                      : <div className="w-10 h-10 rounded-full bg-gray-800 shrink-0" />
                    }
                    <div>
                      <p className="text-xs font-semibold text-gray-200 capitalize">{h.pokemon_name.replace(/-/g, ' ')}</p>
                      {h.rarity != null && (
                        <p className="text-[10px] text-gray-500">{h.rarity}% rarity</p>
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
          <div className="flex flex-col items-center bg-gray-800/50 px-4 py-6">
            {meta.sprite
              ? <img src={meta.sprite} alt={meta.name} className="w-20 h-20 object-contain" style={{ imageRendering: 'pixelated' }} /> /* eslint-disable-line @next/next/no-img-element */
              : <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl">🎒</div>
            }
          </div>

          <div className="px-4 py-4 space-y-3 text-sm">
            {meta.category && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Category</p>
                <p className="text-gray-200 capitalize">{cap(meta.category)}</p>
              </div>
            )}
            {meta.cost != null && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Buy Price</p>
                <p className="text-gray-200 font-mono">{meta.cost.toLocaleString()} ₽</p>
              </div>
            )}
            {meta.fling_power != null && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Fling Power</p>
                <p className="text-gray-200 font-mono">{meta.fling_power}</p>
              </div>
            )}
            {meta.fling_effect && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Fling Effect</p>
                <p className="text-gray-200 capitalize">{cap(meta.fling_effect)}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
