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

function cap(s: string) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Category config ───────────────────────────────────────────────────────────
//   Each entry: [ badgeClasses, accentBorderClass, bgClass ]

type CatStyle = { badge: string; border: string; bg: string; icon: string };

const CAT_STYLES: Record<string, CatStyle> = {
  'medicine':        { badge: 'bg-green-500/15  border-green-500/40  text-green-400',  border: 'border-l-green-500',   bg: 'bg-green-500/5',  icon: '💊' },
  'healing':         { badge: 'bg-green-500/15  border-green-500/40  text-green-400',  border: 'border-l-green-500',   bg: 'bg-green-500/5',  icon: '💊' },
  'poke-balls':      { badge: 'bg-red-500/15    border-red-500/40    text-red-400',    border: 'border-l-red-500',     bg: 'bg-red-500/5',    icon: '⚪' },
  'battle-items':    { badge: 'bg-orange-500/15 border-orange-500/40 text-orange-400', border: 'border-l-orange-500',  bg: 'bg-orange-500/5', icon: '⚔️' },
  'battle':          { badge: 'bg-orange-500/15 border-orange-500/40 text-orange-400', border: 'border-l-orange-500',  bg: 'bg-orange-500/5', icon: '⚔️' },
  'berries':         { badge: 'bg-purple-500/15 border-purple-500/40 text-purple-400', border: 'border-l-purple-500',  bg: 'bg-purple-500/5', icon: '🫐' },
  'all-machines':    { badge: 'bg-blue-500/15   border-blue-500/40   text-blue-400',   border: 'border-l-blue-500',    bg: 'bg-blue-500/5',   icon: '💿' },
  'machines':        { badge: 'bg-blue-500/15   border-blue-500/40   text-blue-400',   border: 'border-l-blue-500',    bg: 'bg-blue-500/5',   icon: '💿' },
  'held-items':      { badge: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400', border: 'border-l-yellow-500',  bg: 'bg-yellow-500/5', icon: '🤝' },
  'key-items':       { badge: 'bg-pink-500/15   border-pink-500/40   text-pink-400',   border: 'border-l-pink-500',    bg: 'bg-pink-500/5',   icon: '🔑' },
  'evolution':       { badge: 'bg-violet-500/15 border-violet-500/40 text-violet-400', border: 'border-l-violet-500',  bg: 'bg-violet-500/5', icon: '✨' },
  'vitamins':        { badge: 'bg-teal-500/15   border-teal-500/40   text-teal-400',   border: 'border-l-teal-500',    bg: 'bg-teal-500/5',   icon: '💪' },
  'effort-drop':     { badge: 'bg-teal-500/15   border-teal-500/40   text-teal-400',   border: 'border-l-teal-500',    bg: 'bg-teal-500/5',   icon: '💪' },
  'stat-boosts':     { badge: 'bg-teal-500/15   border-teal-500/40   text-teal-400',   border: 'border-l-teal-500',    bg: 'bg-teal-500/5',   icon: '📈' },
  'flutes':          { badge: 'bg-pink-500/15   border-pink-500/40   text-pink-400',   border: 'border-l-pink-500',    bg: 'bg-pink-500/5',   icon: '🎵' },
  'type-protection': { badge: 'bg-cyan-500/15   border-cyan-500/40   text-cyan-400',   border: 'border-l-cyan-500',    bg: 'bg-cyan-500/5',   icon: '🛡️' },
  'scarves':         { badge: 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-400', border: 'border-l-fuchsia-500', bg: 'bg-fuchsia-500/5', icon: '🧣' },
  'loot':            { badge: 'bg-gray-500/15   border-gray-500/40   text-gray-400',   border: 'border-l-gray-500',    bg: 'bg-gray-500/5',   icon: '💰' },
};

const DEFAULT_STYLE: CatStyle = {
  badge:  'bg-gray-500/15 border-gray-500/40 text-gray-400',
  border: 'border-l-gray-500',
  bg:     'bg-gray-500/5',
  icon:   '🎒',
};

function getCatStyle(cat: string | null): CatStyle {
  if (!cat) return DEFAULT_STYLE;
  return CAT_STYLES[cat.toLowerCase()] ?? DEFAULT_STYLE;
}

// ── Rarity badge ──────────────────────────────────────────────────────────────

function RarityBadge({ rarity }: { rarity: number }) {
  if (rarity >= 50) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-green-500/15 border border-green-500/30 text-green-400">
      Common
    </span>
  );
  if (rarity >= 10) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
      Uncommon
    </span>
  );
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
      Rare
    </span>
  );
}

// ── Infobox row ───────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
      <div className="text-sm text-gray-200">{children}</div>
    </div>
  );
}

// ── Template ─────────────────────────────────────────────────────────────────

import React from 'react';

export default function ItemTemplate({
  page,
  pokemonMap,
}: {
  page:       PageData;
  pokemonMap: Record<string, number>;
}) {
  const meta      = page.metadata;
  const heldBy    = (meta.held_by_pokemon ?? []).slice(0, 30);
  const sellPrice = meta.cost > 0 ? Math.floor(meta.cost / 2) : null;
  const style     = getCatStyle(meta.category);

  return (
    <div className="flex gap-8 flex-col lg:flex-row">

      {/* ── LEFT: main content ────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-8">

        {/* Title block */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            {page.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {meta.category && (
              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold ${style.badge}`}>
                <span>{style.icon}</span>
                {cap(meta.category)}
              </span>
            )}

            {meta.cost > 0 && (
              <span className="text-sm text-gray-400 font-mono">
                <span className="text-gray-300 font-semibold">{meta.cost.toLocaleString()}</span>
                <span className="text-gray-600 text-xs"> ₽ buy</span>
                {sellPrice != null && (
                  <>
                    <span className="text-gray-600 mx-1.5">/</span>
                    <span className="text-gray-400 font-semibold">{sellPrice.toLocaleString()}</span>
                    <span className="text-gray-600 text-xs"> ₽ sell</span>
                  </>
                )}
              </span>
            )}

            {meta.fling_power != null && (
              <span className="text-xs text-gray-500 font-mono">
                Fling Power: <span className="text-gray-300">{meta.fling_power}</span>
              </span>
            )}
          </div>
        </div>

        {/* Effect */}
        {meta.effect && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Effect</h2>
            <div className={`rounded-xl bg-gray-900 border border-gray-800 border-l-4 ${style.border} px-5 py-4`}>
              <p className="text-gray-200 text-sm leading-relaxed">{meta.effect}</p>
            </div>
          </section>
        )}

        {/* Flavor text */}
        {meta.flavor_text && (
          <p className="italic text-gray-500 text-sm leading-relaxed border-l-2 border-gray-700 pl-4 -mt-4">
            {meta.flavor_text}
          </p>
        )}

        {/* Fling effect (if different from power) */}
        {meta.fling_effect && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Fling Effect</h2>
            <p className="text-gray-300 text-sm">{cap(meta.fling_effect)}</p>
          </section>
        )}

        {/* Held by Wild Pokémon */}
        {heldBy.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
              Found on Wild Pokémon
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {heldBy.map(h => {
                const pokemonId = pokemonMap[h.pokemon_name] ?? null;
                const spriteUrl = pokemonId
                  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemonId}.gif`
                  : null;
                return (
                  <Link
                    key={h.pokemon_name}
                    href={`/wiki/${h.pokemon_name}`}
                    className="group flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 hover:bg-gray-800/60 transition-all text-center"
                  >
                    <div className="w-14 h-14 flex items-center justify-center bg-gray-800/60 rounded-lg">
                      {spriteUrl
                        ? /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={spriteUrl} alt={h.pokemon_name} className="w-12 h-12 object-contain" />
                        : <div className="w-10 h-10 rounded-full bg-gray-700" />
                      }
                    </div>
                    <p className="text-xs font-semibold text-gray-200 capitalize group-hover:text-white transition-colors leading-tight">
                      {h.pokemon_name.replace(/-/g, ' ')}
                    </p>
                    {h.rarity != null && (
                      <div className="flex flex-col items-center gap-0.5">
                        <RarityBadge rarity={h.rarity} />
                        <span className="text-[10px] text-gray-600">{h.rarity}%</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer: attributes */}
        {(meta.attributes?.length > 0 || meta.category) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 border-t border-gray-800 text-xs text-gray-500">
            {meta.category && (
              <span>Category: <span className="text-gray-300">{cap(meta.category)}</span></span>
            )}
            {meta.attributes?.map(a => (
              <span key={a}>{cap(a)}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: infobox ────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-60 shrink-0 lg:order-last">
        <div className="sticky top-6 rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">

          {/* Sprite panel */}
          <div className={`flex items-center justify-center px-6 py-8 ${style.bg}`}>
            {meta.sprite
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={meta.sprite}
                  alt={meta.name || page.title}
                  className="w-28 h-28 object-contain drop-shadow-lg"
                  style={{ imageRendering: 'pixelated' }}
                />
              : <div className="w-28 h-28 rounded-2xl bg-gray-800 flex items-center justify-center text-5xl">
                  {style.icon}
                </div>
            }
          </div>

          {/* Stats */}
          <div className="px-4 py-5 space-y-4">

            {meta.category && (
              <InfoRow label="Category">
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-medium ${style.badge}`}>
                  {style.icon} {cap(meta.category)}
                </span>
              </InfoRow>
            )}

            {meta.cost > 0 ? (
              <InfoRow label="Price">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Buy</span>
                    <span className="font-mono text-sm text-gray-200 font-semibold">
                      {meta.cost.toLocaleString()} ₽
                    </span>
                  </div>
                  {sellPrice != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Sell</span>
                      <span className="font-mono text-sm text-gray-400">
                        {sellPrice.toLocaleString()} ₽
                      </span>
                    </div>
                  )}
                </div>
              </InfoRow>
            ) : meta.cost === 0 ? (
              <InfoRow label="Price">
                <span className="text-gray-500 text-xs">Not sold in shops</span>
              </InfoRow>
            ) : null}

            {meta.fling_power != null && (
              <InfoRow label="Fling Power">
                <span className="font-mono font-semibold">{meta.fling_power}</span>
              </InfoRow>
            )}

            {heldBy.length > 0 && (
              <InfoRow label="Found on">
                <span className="text-gray-300">{heldBy.length} Pokémon</span>
              </InfoRow>
            )}

          </div>
        </div>
      </aside>
    </div>
  );
}
