'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { TeamPokemon, Stats, StatKey } from './types';
import { NATURES, STAT_KEYS, STAT_LABELS, STAT_COLORS, DEFAULT_IVS, DEFAULT_EVS } from './constants';
import { calcStat, totalEVs } from './utils';
import { Sparkles, Trash2 } from 'lucide-react';

// ── Move autocomplete ─────────────────────────────────────────────────────────

type MoveResult = {
  name:     string;
  type:     string | null;
  category: 'physical' | 'special' | 'status' | null;
  power:    number | null;
};

const TYPE_PILL: Record<string, string> = {
  normal:'bg-gray-500',fire:'bg-orange-500',water:'bg-blue-500',electric:'bg-yellow-400',
  grass:'bg-green-500',ice:'bg-cyan-400',fighting:'bg-red-700',poison:'bg-purple-500',
  ground:'bg-yellow-600',flying:'bg-indigo-400',psychic:'bg-pink-500',bug:'bg-lime-500',
  rock:'bg-yellow-700',ghost:'bg-purple-700',dragon:'bg-indigo-700',dark:'bg-gray-700',steel:'bg-gray-400',
};

const CAT_COLOR: Record<string, string> = {
  physical: 'text-orange-400',
  special:  'text-blue-400',
  status:   'text-gray-400',
};

type MoveInputProps = {
  value:    string;
  index:    number;
  atkStat:  number | null;
  spaStat:  number | null;
  onChange: (val: string) => void;
};

function MoveInput({ value, index, atkStat, spaStat, onChange }: MoveInputProps) {
  const [query,    setQuery]    = useState(value);
  const [results,  setResults]  = useState<MoveResult[]>([]);
  const [open,     setOpen]     = useState(false);
  const [selected, setSelected] = useState<MoveResult | null>(null);
  const debounce   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef    = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(q: string) {
    setQuery(q);
    onChange(q);
    setSelected(null);
    clearTimeout(debounce.current);
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      const { data } = await supabase
        .from('pages')
        .select('title, metadata')
        .eq('template_type', 'move')
        .ilike('title', `%${q.trim()}%`)
        .limit(10);
      const mapped: MoveResult[] = (data ?? []).map(p => ({
        name:     p.title,
        type:     p.metadata?.type ?? null,
        category: p.metadata?.category ?? null,
        power:    p.metadata?.power ?? null,
      }));
      setResults(mapped);
      setOpen(mapped.length > 0);
    }, 300);
  }

  function handleSelect(r: MoveResult) {
    setQuery(r.name);
    onChange(r.name);
    setSelected(r);
    setResults([]);
    setOpen(false);
  }

  let warning: string | null = null;
  if (selected && atkStat !== null && spaStat !== null) {
    if (selected.category === 'physical' && atkStat < spaStat - 20) {
      warning = '⚠️ Consider a Special move instead';
    } else if (selected.category === 'special' && spaStat < atkStat - 20) {
      warning = '⚠️ Consider a Physical move instead';
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-1">
        <input
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={`Move ${index + 1}`}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 placeholder-gray-600"
        />
        {selected?.type && (
          <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white ${TYPE_PILL[selected.type.toLowerCase()] ?? 'bg-gray-600'}`}>
            {selected.type}
          </span>
        )}
      </div>
      {selected && (selected.category || selected.power) && (
        <div className="flex gap-2 mt-0.5 px-1">
          {selected.category && <span className={`text-[10px] font-semibold ${CAT_COLOR[selected.category] ?? 'text-gray-400'}`}>{selected.category}</span>}
          {selected.power    && <span className="text-[10px] text-gray-500">PWR {selected.power}</span>}
        </div>
      )}
      {warning && <div className="text-[10px] text-orange-400 mt-0.5 px-1">{warning}</div>}
      {open && results.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
          {results.map(r => (
            <button key={r.name} type="button" onClick={() => handleSelect(r)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left transition-colors">
              {r.type && (
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white shrink-0 ${TYPE_PILL[r.type.toLowerCase()] ?? 'bg-gray-600'}`}>
                  {r.type}
                </span>
              )}
              <span className="text-sm text-white flex-1">{r.name}</span>
              <span className={`text-[10px] shrink-0 ${CAT_COLOR[r.category ?? ''] ?? 'text-gray-400'}`}>{r.category ?? ''}</span>
              {r.power && <span className="text-[10px] text-gray-500 shrink-0">{r.power}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Held Item Search ──────────────────────────────────────────────────────────

type ItemResult = { name: string; sprite?: string | null };

// Item modifiers for stat display
type ItemEffect = { stat: StatKey; multiplier: number }[];

const ITEM_EFFECTS: Record<string, { label: string; effects: ItemEffect }> = {
  'choice band':  { label: '+50% ATK (locked to 1 move)',    effects: [{ stat: 'attack',          multiplier: 1.5 }] },
  'choice specs': { label: '+50% SpATK (locked to 1 move)',  effects: [{ stat: 'special_attack',  multiplier: 1.5 }] },
  'choice scarf': { label: '+50% SPE (locked to 1 move)',    effects: [{ stat: 'speed',           multiplier: 1.5 }] },
  'life orb':     { label: '+30% damage output (no stat boost)', effects: [] },
  'assault vest': { label: '+50% SpDEF (no status moves)',   effects: [{ stat: 'special_defense', multiplier: 1.5 }] },
  'eviolite':     { label: '+50% DEF & SpDEF (if can evolve)', effects: [{ stat: 'defense', multiplier: 1.5 }, { stat: 'special_defense', multiplier: 1.5 }] },
};

function getItemEffect(name: string | null): { label: string; effects: ItemEffect } | null {
  if (!name) return null;
  return ITEM_EFFECTS[name.toLowerCase()] ?? null;
}

function HeldItemSearch({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [query,   setQuery]   = useState(value ?? '');
  const [results, setResults] = useState<ItemResult[]>([]);
  const [open,    setOpen]    = useState(false);
  const debounce  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef   = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value ?? ''); }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(q: string) {
    setQuery(q);
    onChange(q || null);
    clearTimeout(debounce.current);
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      const { data } = await supabase
        .from('pages')
        .select('title, metadata')
        .eq('template_type', 'item')
        .ilike('title', `%${q.trim()}%`)
        .limit(8);
      const mapped: ItemResult[] = (data ?? []).map(p => ({
        name:   p.title,
        sprite: p.metadata?.sprite_url ?? null,
      }));
      setResults(mapped);
      setOpen(mapped.length > 0);
    }, 300);
  }

  function handleSelect(r: ItemResult) {
    setQuery(r.name);
    onChange(r.name);
    setResults([]);
    setOpen(false);
  }

  const effect = getItemEffect(value);

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="e.g. Choice Band"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
      />
      {effect && (
        <div className="text-[10px] text-yellow-400 mt-1 px-1">
          🎒 {effect.label}
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
          {results.map(r => (
            <button key={r.name} type="button" onClick={() => handleSelect(r)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left transition-colors">
              {r.sprite
                ? <img src={r.sprite} alt="" className="w-6 h-6 object-contain shrink-0" />
                : <div className="w-6 h-6 rounded bg-gray-700 shrink-0 flex items-center justify-center text-[10px]">🎒</div>
              }
              <span className="text-sm text-white flex-1">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  pokemon:   TeamPokemon;
  onChange:  (updated: Partial<TeamPokemon>) => void;
  onRemove:  () => void;
};

type BaseStats = Stats;

const MAX_EVS        = 510;
const MAX_SINGLE_EV  = 252;

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

  // Nature modifier display
  const nature = NATURES.find(n => n.name === pokemon.nature);
  const nMod = (key: StatKey): string =>
    nature?.plus === key ? 'text-red-400' : nature?.minus === key ? 'text-blue-400' : 'text-white';

  // Item effects
  const itemEffect = getItemEffect(pokemon.held_item);
  const itemMultiplier = (key: StatKey): number =>
    itemEffect?.effects.find(e => e.stat === key)?.multiplier ?? 1;

  // Computed final stats (with item modifier)
  const calcFinal = (key: StatKey): number | null => {
    if (!bases) return null;
    const base = calcStat(key, bases[key], pokemon.ivs[key], pokemon.evs[key], pokemon.level, pokemon.nature);
    const mult = itemMultiplier(key);
    return mult !== 1 ? Math.floor(base * mult) : base;
  };

  // Max possible stat (31 IV, 252 EV) for bar scaling
  const calcMax = (key: StatKey): number => {
    if (!bases) return 400;
    return calcStat(key, bases[key], 31, 252, pokemon.level, pokemon.nature);
  };

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
          <HeldItemSearch value={pokemon.held_item} onChange={v => onChange({ held_item: v })} />
        </div>
      </div>

      {/* IVs / EVs */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">IVs / EVs</span>
          <span className={`text-xs ${totalEVs(pokemon.evs) >= MAX_EVS ? 'text-red-400' : 'text-gray-500'}`}>
            EVs: {totalEVs(pokemon.evs)}/{MAX_EVS}
          </span>
        </div>
        <div className="space-y-2">
          {STAT_KEYS.map(key => (
            <div key={key} className="grid grid-cols-[60px_1fr_1fr] items-center gap-2">
              <span className={`text-xs font-bold ${nMod(key)}`}>{STAT_LABELS[key]}</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 w-4">IV</span>
                <input
                  type="number" min={0} max={31}
                  value={pokemon.ivs[key]}
                  onChange={e => updateIV(key, parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 w-4">EV</span>
                <input
                  type="number" min={0} max={252}
                  value={pokemon.evs[key]}
                  onChange={e => updateEV(key, parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => onChange({ ivs: { ...DEFAULT_IVS } })}
            className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg py-1.5 transition-colors">
            Reset IVs
          </button>
          <button onClick={() => onChange({ evs: { ...DEFAULT_EVS } })}
            className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg py-1.5 transition-colors">
            Reset EVs
          </button>
        </div>
      </div>

      {/* Final Stats */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Final Stats</span>
          <span className="text-[10px] text-gray-600">Lv. {pokemon.level}</span>
        </div>
        {!bases ? (
          <p className="text-xs text-gray-600 text-center py-2">Loading base stats…</p>
        ) : (
          <div className="space-y-2">
            {STAT_KEYS.map(key => {
              const val  = calcFinal(key);
              const maxV = calcMax(key);
              const mult = itemMultiplier(key);
              const pct  = val !== null ? Math.min(100, (val / (maxV * (mult > 1 ? mult : 1))) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold w-8 shrink-0 ${nMod(key)}`}>{STAT_LABELS[key]}</span>
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${STAT_COLORS[key]}${mult > 1 ? ' brightness-125' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0 w-16 justify-end">
                    {mult > 1 && (
                      <span className="text-[9px] text-yellow-400">×{mult}</span>
                    )}
                    <span className={`text-xs font-bold ${mult > 1 ? 'text-yellow-300' : nMod(key)}`}>
                      {val ?? '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Moves */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="text-sm font-semibold text-white mb-3">Moves</div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => {
            const atkStat = bases ? calcStat('attack',         bases.attack,         pokemon.ivs.attack,         pokemon.evs.attack,         pokemon.level, pokemon.nature) : null;
            const spaStat = bases ? calcStat('special_attack', bases.special_attack, pokemon.ivs.special_attack, pokemon.evs.special_attack, pokemon.level, pokemon.nature) : null;
            return (
              <MoveInput key={i} index={i} value={moves[i] ?? ''} atkStat={atkStat} spaStat={spaStat} onChange={val => updateMove(i, val)} />
            );
          })}
        </div>
      </div>

      {/* Notes */}
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
