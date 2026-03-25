'use client';

import { TeamPokemon } from './types';
import { EFF } from '@/lib/type-chart';

const POKEMMO_TYPES = [
  'normal','fire','water','electric','grass','ice',
  'fighting','poison','ground','flying','psychic',
  'bug','rock','ghost','dragon','dark','steel',
];

type Props = { pokemon: TeamPokemon[] };

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    normal:'bg-gray-500',fire:'bg-orange-500',water:'bg-blue-500',electric:'bg-yellow-400',
    grass:'bg-green-500',ice:'bg-cyan-400',fighting:'bg-red-700',poison:'bg-purple-500',
    ground:'bg-yellow-600',flying:'bg-indigo-400',psychic:'bg-pink-500',bug:'bg-lime-500',
    rock:'bg-yellow-700',ghost:'bg-purple-700',dragon:'bg-indigo-700',dark:'bg-gray-700',steel:'bg-gray-400',
  };
  return map[type] ?? 'bg-gray-600';
}

/** How effective is attackingType vs all defending types combined */
function offensiveCoverage(attackingType: string, defenderTypes: string[][]): number {
  let hits = 0;
  for (const types of defenderTypes) {
    const eff = types.reduce((mult, dt) => {
      return mult * (EFF[attackingType]?.[dt] ?? 1);
    }, 1);
    if (eff > 1) hits++;
  }
  return hits;
}

/** How many of the team types hit a given defender type for super effective */
function teamOffensiveCoverage(teamTypes: string[][], defender: string): number {
  let count = 0;
  for (const types of teamTypes) {
    for (const at of types) {
      const eff = EFF[at]?.[defender] ?? 1;
      if (eff > 1) { count++; break; }
    }
  }
  return count;
}

/** Defensive: how vulnerable is a Pokémon to an attacking type */
function defensiveMultiplier(attackingType: string, defenderTypes: string[]): number {
  return defenderTypes.reduce((mult, dt) => mult * (EFF[attackingType]?.[dt] ?? 1), 1);
}

export default function TeamAnalysis({ pokemon }: Props) {
  const filled = pokemon.filter(p => p.pokemon_name);

  if (filled.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm gap-2">
        <span className="text-4xl">🔍</span>
        <span>Add Pokémon to see analysis</span>
      </div>
    );
  }

  // Collect types per member (from description parsing — we store types in pokemon_slug metadata but don't have it here)
  // We'll show move-type coverage if we had move types, but for now use pokemon types from slug
  // For simplicity, use a defensive weakness analysis based on team types array stored in TeamPokemon
  // Since we don't store types on TeamPokemon, we'll show a stat summary + warnings

  const totalEVsUsed = filled.map(p => Object.values(p.evs).reduce((a, b) => a + b, 0));
  const evWarnings   = filled.filter((p, i) => totalEVsUsed[i] > 510);
  const duplicates   = filled.filter((p, i) => filled.findIndex(q => q.pokemon_name === p.pokemon_name) !== i);
  const noMoves      = filled.filter(p => !p.moves?.some(Boolean));
  const allShiny     = filled.length >= 6 && filled.every(p => p.is_shiny);
  const highLevel    = filled.filter(p => p.level > 50);

  const speedTiers = [...filled]
    .filter(p => p.pokemon_name)
    .sort((a, b) => b.evs.speed - a.evs.speed);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto flex-1">
      {/* Score */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="text-sm font-semibold text-white mb-1">Team Score</div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-extrabold text-white">{filled.length}</span>
          <span className="text-gray-500 text-sm mb-1">/ 6 Pokémon</span>
        </div>
        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all"
            style={{ width: `${(filled.length / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Warnings */}
      {(evWarnings.length > 0 || duplicates.length > 0 || noMoves.length > 0) && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="text-sm font-semibold text-yellow-400 mb-2">⚠ Warnings</div>
          <ul className="space-y-1 text-xs text-yellow-300">
            {evWarnings.map(p => (
              <li key={p.id}>• {p.pokemon_name}: EVs exceed 510</li>
            ))}
            {duplicates.map(p => (
              <li key={p.id}>• {p.pokemon_name} appears more than once</li>
            ))}
            {noMoves.map(p => (
              <li key={p.id}>• {p.pokemon_name}: no moves set</li>
            ))}
          </ul>
        </div>
      )}

      {allShiny && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-300">
          ✨ Full shiny team! Flex worthy.
        </div>
      )}

      {highLevel.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300">
          ℹ {highLevel.map(p => p.pokemon_name).join(', ')} {highLevel.length === 1 ? 'is' : 'are'} above Lv50 (PvP standard).
        </div>
      )}

      {/* Speed tiers */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="text-sm font-semibold text-white mb-3">Speed EV Investment</div>
        <div className="space-y-2">
          {speedTiers.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-24 truncate">{p.pokemon_name}</span>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full"
                  style={{ width: `${(p.evs.speed / 252) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{p.evs.speed}</span>
            </div>
          ))}
        </div>
      </div>

      {/* EV distribution */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="text-sm font-semibold text-white mb-3">EV Distribution</div>
        <div className="space-y-2">
          {filled.map(p => {
            const used = Object.values(p.evs).reduce((a, b) => a + b, 0);
            return (
              <div key={p.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-24 truncate">{p.pokemon_name}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${used > 510 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, (used / 510) * 100)}%` }}
                  />
                </div>
                <span className={`text-xs w-12 text-right ${used > 510 ? 'text-red-400' : 'text-gray-400'}`}>{used}/510</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Members summary */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="text-sm font-semibold text-white mb-3">Team Summary</div>
        <div className="space-y-3">
          {filled.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              {p.pokemon_id && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemon_id}.png`}
                  alt={p.pokemon_name ?? ''}
                  className="w-8 h-8 object-contain"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {p.is_shiny ? '✨ ' : ''}{p.pokemon_name}
                </div>
                <div className="text-[10px] text-gray-500">
                  Lv{p.level} · {p.nature} · {p.ability ?? 'No ability'}
                </div>
              </div>
              <div className="text-[10px] text-gray-600 shrink-0">
                {(p.moves ?? []).filter(Boolean).length} moves
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
