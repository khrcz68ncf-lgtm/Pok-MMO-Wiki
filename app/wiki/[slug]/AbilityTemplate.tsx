import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type AbilityPokemon = { name: string; is_hidden: boolean };

type AbilityMeta = {
  effect:       string | null;
  flavor_text:  string | null;
  pokemon:      AbilityPokemon[];
};

type PageData = {
  title:    string;
  metadata: AbilityMeta;
};

// ── Template ─────────────────────────────────────────────────────────────────

export default function AbilityTemplate({
  page,
  pokemonMap,
}: {
  page:       PageData;
  pokemonMap: Record<string, number>; // pokemon_name → pokemon_id
}) {
  const meta   = page.metadata;
  const pokemon = (meta.pokemon ?? [])
    .filter(p => (pokemonMap[p.name] ?? 9999) <= 649)
    .slice(0, 60);

  return (
    <div className="flex gap-8 flex-col lg:flex-row">

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 capitalize">
          {page.title.replace(/-/g, ' ')}
        </h1>

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

        {/* Pokémon with this ability */}
        {pokemon.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-3 pb-1 border-b border-gray-800">
              Pokémon with this Ability
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {pokemon.map(p => {
                const pokemonId = pokemonMap[p.name] ?? null;
                const spriteUrl = pokemonId
                  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemonId}.gif`
                  : null;
                return (
                  <Link
                    key={`${p.name}-${p.is_hidden}`}
                    href={`/wiki/${p.name}`}
                    className="flex items-center gap-2 p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors"
                  >
                    {spriteUrl
                      ? <img src={spriteUrl} alt={p.name} className="w-10 h-10 object-contain shrink-0" /> /* eslint-disable-line @next/next/no-img-element */
                      : <div className="w-10 h-10 rounded-full bg-gray-800 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-200 capitalize truncate">
                        {p.name.replace(/-/g, ' ')}
                      </p>
                      {p.is_hidden && (
                        <span className="text-[10px] bg-purple-500/20 border border-purple-500/40 text-purple-400 px-1.5 py-0.5 rounded font-medium">
                          Hidden
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ── Infobox ─────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-52 shrink-0 lg:order-last">
        <div className="sticky top-6 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-center bg-gray-800/50 px-4 py-8">
            <div className="text-5xl">✨</div>
          </div>
          <div className="px-4 py-4 text-sm">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Ability</p>
            <p className="text-gray-200 font-semibold capitalize">{page.title.replace(/-/g, ' ')}</p>
            {pokemon.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Pokémon count</p>
                <p className="text-gray-200 font-mono">{pokemon.length}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
