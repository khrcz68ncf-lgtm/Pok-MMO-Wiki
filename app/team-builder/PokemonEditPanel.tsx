'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TeamPokemon, Stats, StatKey } from './types';
import { NATURES, STAT_KEYS, STAT_LABELS, STAT_COLORS, DEFAULT_IVS, DEFAULT_EVS } from './constants';
import { calcStat, totalEVs } from './utils';
import { Sparkles, Trash2 } from 'lucide-react';

type Props = {
  pokemon:   TeamPokemon;
  onChange:  (updated: Partial<TeamPokemon>) => void;
  onRemove:  () => void;
};

type BaseStats = Stats;

const MAX_EVS = 508;
const MAX_SINGLE_EV = 252;

export default function PokemonEditPanel({ pokemon, onChange, onRemove }: Props) {
  const [bases, setBases] = useState<BaseStats | null>(null);

  useEffect(() => {
    if (!pokemon.pokemon_slug) return;
    supabase.from('pages')
      .select('metadata')
      .eq('slug', pokemon.pokemon_slug)
      .single()
      .then(({ data }) => {
        if (data?.metadata?.base_stats) setBases(data.metadata.base_stats as BaseStats);
      });
  }, [pokemon.pokemon_slug]);

  const updateIV = (key: StatKey, val: number) => {
    onChange({ ivs: { ...pokemon.ivs, [key]: Math.min(31, Math.max(0, val)) } });
  };

  const updateEV = (key: StatKey, val: number) => {
    const clamped = Math.min(MAX_SINGLE_EV, Math.max(0, val));
    const current = totalEVs(pokemon.evs) - pokemon.evs[key] + clamped;
    if (current > MAX_EVS) return;
    onChange({ evs: { ...pokemon.evs, [key]: clamped } });
  };

  const updateMove = (idx: number, val: string) => {
    const moves = [...(pokemon.moves ?? ['', '', '', ''])];
    while (moves.length < 4) moves.push('');
    moves[idx] = val;
    onChange({ moves });
  };

  const moves = [...(pokemon.moves ?? [])];
  while (moves.length < 4) moves.push('');

  const spriteBase = pokemon.pokemon_id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated`
    : null;
  const spriteUrl = spriteBase
    ? pokemon.is_shiny
      ? `${spriteBase}/shiny/${pokemon.pokemon_id}.gif`
      : `${spriteBase}/${pokemon.pokemon_id}.gif`
    : null;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
        {spriteUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={spriteUrl} alt={pokemon.pokemon_name ?? ''} className="w-16 h-16 object-contain" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-lg">{pokemon.pokemon_name ?? 'Unknown'}</div>
          {pokemon.pokemon_id && (
            <div className="text-gray-500 text-xs font-mono">#{String(pokemon.pokemon_id).padStart(3, '0')}</div>
          )}
        </div>
        <button
          onClick={() => onChange({ is_shiny: !pokemon.is_shiny })}
          className={`p-2 rounded-lg transition-colors ${pokemon.is_shiny ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-500 hover:text-yellow-400'}`}
          title="Toggle shiny"
        >
          <Sparkles size={16} />
        </button>
        <button onClick={onRemove} className="p-2 rounded-lg bg-gray-700 text-gray-500 hover:text-red-400 transition-colors" title="Remove">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Basic fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Level</label>
          <input
            type="number" min={1} max={100}
            value={pokemon.level}
            onChange={e => onChange({ level: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nature</label>
          <select
            value={pokemon.nature}
            onChange={e => onChange({ nature: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            {NATURES.map(n => (
              <option key={n.name} value={n.name}>
                {n.name}{n.plus ? ` (+${STAT_LABELS[n.plus]}/-${STAT_LABELS[n.minus!]})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Ability</label>
          <input
            value={pokemon.ability ?? ''}
            onChange={e => onChange({ ability: e.target.value || null })}
            placeholder="e.g. Intimidate"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Held Item</label>
          <input
            value={pokemon.held_item ?? ''}
            onChange={e => onChange({ held_item: e.target.value || null })}
            placeholder="e.g. Choice Band"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Stats</span>
          <span className="text-xs text-gray-500">EVs: {totalEVs(pokemon.evs)}/{MAX_EVS}</span>
        </div>
        <div className="space-y-2">
          {STAT_KEYS.map(key => {
            const calcVal = bases
              ? calcStat(key, bases[key], pokemon.ivs[key], pokemon.evs[key], pokemon.level, pokemon.nature)
              : null;
            const nature = NATURES.find(n => n.name === pokemon.nature);
            const nMod = nature?.plus === key ? 'text-red-400' : nature?.minus === key ? 'text-blue-400' : 'text-white';
            return (
              <div key={key} className="grid grid-cols-[80px_1fr_1fr_50px] items-center gap-2">
                <span className={`text-xs font-bold ${nMod}`}>{STAT_LABELS[key]}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">IV</span>
                  <input
                    type="number" min={0} max={31}
                    value={pokemon.ivs[key]}
                    onChange={e => updateIV(key, parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">EV</span>
                  <input
                    type="number" min={0} max={252}
                    value={pokemon.evs[key]}
                    onChange={e => updateEV(key, parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="text-right">
                  {calcVal !== null ? (
                    <div className="flex items-center gap-1 justify-end">
                      <div className={`h-1.5 w-8 rounded-full ${STAT_COLORS[key]} opacity-60`} style={{ width: `${Math.min(100, calcVal / 4)}%`, minWidth: 4 }} />
                      <span className={`text-xs font-bold ${nMod}`}>{calcVal}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onChange({ ivs: { ...DEFAULT_IVS } })}
            className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg py-1.5 transition-colors"
          >
            Reset IVs
          </button>
          <button
            onClick={() => onChange({ evs: { ...DEFAULT_EVS } })}
            className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg py-1.5 transition-colors"
          >
            Reset EVs
          </button>
        </div>
      </div>

      {/* Moves */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="text-sm font-semibold text-white mb-3">Moves</div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map(i => (
            <input
              key={i}
              value={moves[i] ?? ''}
              onChange={e => updateMove(i, e.target.value)}
              placeholder={`Move ${i + 1}`}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 placeholder-gray-600"
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea
          value={pokemon.description ?? ''}
          onChange={e => onChange({ description: e.target.value || null })}
          rows={2}
          placeholder="Optional notes about this Pokémon's role…"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 placeholder-gray-600 resize-none"
        />
      </div>
    </div>
  );
}
