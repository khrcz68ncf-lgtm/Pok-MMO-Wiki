'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/lib/supabase';
import { EFF } from '@/lib/type-chart';
import TypeBadge from '@/app/components/TypeBadge';
import CategoryBadge from '@/app/components/CategoryBadge';

// ── Types ─────────────────────────────────────────────────────────────────────

type StatKey = 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed';
type BoostKey = Exclude<StatKey, 'hp'>;
type Stats = Record<StatKey, number>;
type Boosts = Record<BoostKey, number>;

type PokemonInfo = {
  slug:        string;
  name:        string;
  pokemon_id:  number | null;
  types:       string[];
  abilities:   { name: string; is_hidden: boolean }[];
  base_stats:  Stats;
};

type MoveInfo = {
  slug:     string;
  name:     string;
  type:     string | null;
  category: 'physical' | 'special' | 'status' | null;
  power:    number | null;
};

type Weather = 'none' | 'sun' | 'rain' | 'sand' | 'hail';

type PanelState = {
  pokemon:  PokemonInfo | null;
  level:    number;
  nature:   string;
  ivs:      Stats;
  evs:      Stats;
  boosts:   Boosts;
  heldItem: string;
  ability:  string;
};

type DamageResult = {
  min:          number;
  max:          number;
  defHP:        number;
  atkStat:      number;
  defStat:      number;
  baseDamage:   number;
  typeEff:      number;
  stab:         boolean;
  weatherMult:  number;
  critMult:     number;
  burnMult:     number;
  screenMult:   number;
  hhMult:       number;
  itemMult:     number;
  defItemMult:  number;
  abilityMult:  number;
  isImmune:     boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STAT_KEYS:   StatKey[] = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'];
const BOOST_KEYS:  BoostKey[] = ['attack', 'defense', 'special_attack', 'special_defense', 'speed'];
const STAT_LABELS: Record<StatKey, string> = { hp:'HP', attack:'Atk', defense:'Def', special_attack:'SpA', special_defense:'SpD', speed:'Spe' };

const NATURES: { name: string; plus: StatKey | null; minus: StatKey | null }[] = [
  { name:'Hardy',   plus:null,              minus:null              },
  { name:'Lonely',  plus:'attack',          minus:'defense'         },
  { name:'Brave',   plus:'attack',          minus:'speed'           },
  { name:'Adamant', plus:'attack',          minus:'special_attack'  },
  { name:'Naughty', plus:'attack',          minus:'special_defense' },
  { name:'Bold',    plus:'defense',         minus:'attack'          },
  { name:'Docile',  plus:null,              minus:null              },
  { name:'Relaxed', plus:'defense',         minus:'speed'           },
  { name:'Impish',  plus:'defense',         minus:'special_attack'  },
  { name:'Lax',     plus:'defense',         minus:'special_defense' },
  { name:'Timid',   plus:'speed',           minus:'attack'          },
  { name:'Hasty',   plus:'speed',           minus:'defense'         },
  { name:'Serious', plus:null,              minus:null              },
  { name:'Jolly',   plus:'speed',           minus:'special_attack'  },
  { name:'Naive',   plus:'speed',           minus:'special_defense' },
  { name:'Modest',  plus:'special_attack',  minus:'attack'          },
  { name:'Mild',    plus:'special_attack',  minus:'defense'         },
  { name:'Quiet',   plus:'special_attack',  minus:'speed'           },
  { name:'Bashful', plus:null,              minus:null              },
  { name:'Rash',    plus:'special_attack',  minus:'special_defense' },
  { name:'Calm',    plus:'special_defense', minus:'attack'          },
  { name:'Gentle',  plus:'special_defense', minus:'defense'         },
  { name:'Sassy',   plus:'special_defense', minus:'speed'           },
  { name:'Careful', plus:'special_defense', minus:'special_attack'  },
  { name:'Quirky',  plus:null,              minus:null              },
];

const DEFAULT_IVS:  Stats  = { hp:31, attack:31, defense:31, special_attack:31, special_defense:31, speed:31 };
const DEFAULT_EVS:  Stats  = { hp:0,  attack:0,  defense:0,  special_attack:0,  special_defense:0,  speed:0  };
const DEFAULT_BOOSTS: Boosts = { attack:0, defense:0, special_attack:0, special_defense:0, speed:0 };

const WEATHER_OPTIONS: { value: Weather; label: string }[] = [
  { value:'none', label:'None'  },
  { value:'sun',  label:'☀️ Sun'  },
  { value:'rain', label:'🌧️ Rain' },
  { value:'sand', label:'🏜️ Sand' },
  { value:'hail', label:'❄️ Hail' },
];

const ATTACKER_ITEMS = ['—', 'Life Orb', 'Choice Band', 'Choice Specs', 'Expert Belt', 'Muscle Band', 'Wise Glasses'];
const DEFENDER_ITEMS = ['—', 'Eviolite', 'Assault Vest', 'Leftovers', 'Rocky Helmet', 'Focus Sash'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcStat(key: StatKey, base: number, iv: number, ev: number, level: number, nature: string): number {
  const n = NATURES.find(n => n.name === nature) ?? NATURES[0];
  const inner = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100);
  if (key === 'hp') return inner + level + 10;
  const mod = n.plus === key ? 1.1 : n.minus === key ? 0.9 : 1;
  return Math.floor((inner + 5) * mod);
}

function boostMult(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

function typeEff(moveType: string | null, defTypes: string[]): number {
  if (!moveType) return 1;
  return defTypes.reduce((m, dt) => m * (EFF[moveType.toLowerCase()]?.[dt.toLowerCase()] ?? 1), 1);
}

function koLabel(min: number, max: number, hp: number): string {
  if (max === 0) return 'No damage';
  if (min >= hp) return 'Guaranteed OHKO';
  if (max >= hp) return 'Possible OHKO';
  const lo = Math.ceil(hp / max);
  const hi = Math.ceil(hp / min);
  return lo === hi ? `Guaranteed ${lo}HKO` : `${lo}–${hi}HKO`;
}

function zeroResult(defHP: number): DamageResult {
  return { min:0, max:0, defHP, atkStat:0, defStat:0, baseDamage:0, typeEff:0, stab:false,
    weatherMult:1, critMult:1, burnMult:1, screenMult:1, hhMult:1, itemMult:1, defItemMult:1, abilityMult:1, isImmune:true };
}

// ── Damage formula (Gen 5 / PokéMMO) ─────────────────────────────────────────

type CalcInput = {
  atkPanel:       PanelState;
  defPanel:       PanelState;
  move:           MoveInfo;
  isBurned:       boolean;
  isCrit:         boolean;
  weather:        Weather;
  hasReflect:     boolean;
  hasLightScreen: boolean;
  hasHelpingHand: boolean;
  defFullHP:      boolean;
};

function calculateDamage(inp: CalcInput): DamageResult {
  const { atkPanel, defPanel, move, isBurned, isCrit, weather, hasReflect, hasLightScreen, hasHelpingHand, defFullHP } = inp;
  const cat = move.category!;
  const power = move.power!;

  const atkStatKey: StatKey = cat === 'physical' ? 'attack' : 'special_attack';
  const defStatKey: StatKey = cat === 'physical' ? 'defense' : 'special_defense';

  // Attacker stat
  const atkBase = atkPanel.pokemon?.base_stats[atkStatKey] ?? 80;
  let atkStat = calcStat(atkStatKey, atkBase, atkPanel.ivs[atkStatKey], atkPanel.evs[atkStatKey], atkPanel.level, atkPanel.nature);
  atkStat = Math.floor(atkStat * boostMult(isCrit ? Math.max(0, atkPanel.boosts[atkStatKey as BoostKey]) : atkPanel.boosts[atkStatKey as BoostKey]));

  // Attacker ability modifier on atkStat
  const atkAbility = atkPanel.ability.toLowerCase();
  if (atkAbility === 'hustle' && cat === 'physical') atkStat = Math.floor(atkStat * 1.5);
  if ((atkAbility === 'huge power' || atkAbility === 'pure power') && cat === 'physical') atkStat *= 2;

  // Defender stat
  const defBase = defPanel.pokemon?.base_stats[defStatKey] ?? 80;
  let defStat = calcStat(defStatKey, defBase, defPanel.ivs[defStatKey], defPanel.evs[defStatKey], defPanel.level, defPanel.nature);
  defStat = Math.floor(defStat * boostMult(isCrit ? Math.min(0, defPanel.boosts[defStatKey as BoostKey]) : defPanel.boosts[defStatKey as BoostKey]));

  // Defender item on stat
  let defItemMult = 1;
  if (defPanel.heldItem === 'Eviolite') { defStat = Math.floor(defStat * 1.5); defItemMult = 1.5; }
  else if (defPanel.heldItem === 'Assault Vest' && cat === 'special') { defStat = Math.floor(defStat * 1.5); defItemMult = 1.5; }

  // Defender HP
  const defHPBase = defPanel.pokemon?.base_stats.hp ?? 80;
  const defHP = calcStat('hp', defHPBase, defPanel.ivs.hp, defPanel.evs.hp, defPanel.level, defPanel.nature);

  // Defender ability immunity check
  const defAbility = defPanel.ability.toLowerCase();
  const mt = move.type?.toLowerCase() ?? '';
  const immuneAbilities: Record<string, string[]> = {
    'flash fire': ['fire'], 'levitate': ['ground'], 'volt absorb': ['electric'],
    'water absorb': ['water'], 'motor drive': ['electric'], 'sap sipper': ['grass'],
    'lightning rod': ['electric'], 'storm drain': ['water'],
  };
  for (const [ab, types] of Object.entries(immuneAbilities)) {
    if (defAbility === ab && types.includes(mt)) return zeroResult(defHP);
  }

  // Type effectiveness
  const defTypes = defPanel.pokemon?.types ?? ['normal'];
  const effMult = typeEff(move.type, defTypes);
  if (effMult === 0) return zeroResult(defHP);

  // 1. Base damage
  const baseDamage = Math.floor(Math.floor(Math.floor(2 * atkPanel.level / 5 + 2) * power * atkStat / defStat / 50) + 2);

  // 2. Weather
  let weatherMult = 1;
  if (weather === 'sun')  weatherMult = mt === 'fire' ? 1.5 : mt === 'water' ? 0.5 : 1;
  if (weather === 'rain') weatherMult = mt === 'water' ? 1.5 : mt === 'fire' ? 0.5 : 1;
  let dmg = Math.floor(baseDamage * weatherMult);

  // 3. Critical
  const critMult = isCrit ? 1.5 : 1;
  if (isCrit) dmg = Math.floor(dmg * 1.5);

  // 4. Random roll (compute min/max here)
  const minDmg = Math.floor(dmg * 85 / 100);
  const maxDmg = dmg;

  // 5. STAB
  const atkTypes = (atkPanel.pokemon?.types ?? []).map(t => t.toLowerCase());
  const isSTAB = mt ? atkTypes.includes(mt) : false;
  const hasAdaptability = atkAbility === 'adaptability';
  const stabMult = isSTAB ? (hasAdaptability ? 2 : 1.5) : 1;

  // 6. Burn
  const burnMult = (isBurned && cat === 'physical' && !isCrit) ? 0.5 : 1;

  // 7. Screens
  let screenMult = 1;
  if (hasReflect    && cat === 'physical' && !isCrit) screenMult = 0.5;
  if (hasLightScreen && cat === 'special'  && !isCrit) screenMult = 0.5;

  // 8. Helping Hand
  const hhMult = hasHelpingHand ? 1.5 : 1;

  // 9. Attacker held item
  let itemMult = 1;
  const ai = atkPanel.heldItem;
  if (ai === 'Life Orb')                              itemMult = 1.3;
  else if (ai === 'Choice Band'  && cat === 'physical') itemMult = 1.5;
  else if (ai === 'Choice Specs' && cat === 'special')  itemMult = 1.5;
  else if (ai === 'Expert Belt'  && effMult > 1)        itemMult = 1.2;
  else if (ai === 'Muscle Band'  && cat === 'physical') itemMult = 1.1;
  else if (ai === 'Wise Glasses' && cat === 'special')  itemMult = 1.1;

  // 10. Attacker ability
  const hasTech = atkAbility === 'technician';
  if (hasTech && power <= 60) itemMult = Math.max(itemMult, 1.5); // Technician stacks with others only loosely

  // 11. Defender ability
  let abilityMult = 1;
  if ((defAbility === 'multiscale' || defAbility === 'shadow shield') && defFullHP) abilityMult = 0.5;
  if (defAbility === 'fluffy') abilityMult *= 0.5;
  if (defAbility === 'fluffy' && mt === 'fire') abilityMult *= 2;

  // Apply all post-random multipliers
  function applyAll(d: number): number {
    let r = Math.floor(d * stabMult);
    r = Math.floor(r * effMult);
    r = Math.floor(r * burnMult);
    r = Math.floor(r * screenMult);
    r = Math.floor(r * hhMult);
    r = Math.floor(r * itemMult);
    r = Math.floor(r * abilityMult);
    return r;
  }

  return {
    min: applyAll(minDmg),
    max: applyAll(maxDmg),
    defHP, atkStat, defStat, baseDamage,
    typeEff:     effMult,
    stab:        isSTAB,
    weatherMult, critMult, burnMult, screenMult, hhMult,
    itemMult, defItemMult, abilityMult,
    isImmune:    false,
  };
}

// ── PokemonSearch ─────────────────────────────────────────────────────────────

function PokemonSearch({ value, onSelect, accentColor }: {
  value:      PokemonInfo | null;
  onSelect:   (p: PokemonInfo | null) => void;
  accentColor: string;
}) {
  const [query,   setQuery]   = useState(value?.name ?? '');
  const [results, setResults] = useState<PokemonInfo[]>([]);
  const [open,    setOpen]    = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { if (value) setQuery(value.name); else setQuery(''); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(q: string) {
    setQuery(q);
    if (!q.trim()) { onSelect(null); setResults([]); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const { data } = await supabase
        .from('pages').select('slug, title, metadata')
        .eq('template_type', 'pokemon').ilike('title', `%${q.trim()}%`).limit(10);
      setResults((data ?? []).map(p => ({
        slug:       p.slug, name: p.title,
        pokemon_id: p.metadata?.pokemon_id ?? null,
        types:      p.metadata?.types ?? [],
        abilities:  p.metadata?.abilities ?? [],
        base_stats: p.metadata?.base_stats ?? { hp:50,attack:50,defense:50,special_attack:50,special_defense:50,speed:50 },
      })));
      setOpen(true);
    }, 300);
  }

  const animUrl = value?.pokemon_id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${value.pokemon_id}.gif`
    : null;

  return (
    <div ref={wrapRef} className="relative">
      {value && (
        <div className={`flex items-center gap-3 mb-2 p-3 bg-gray-800 rounded-xl border ${accentColor === 'red' ? 'border-red-500/30' : 'border-blue-500/30'}`}>
          {animUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={animUrl} alt={value.name} className="w-14 h-14 object-contain" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white capitalize text-sm">{value.name}</div>
            <div className="flex gap-1 mt-1">
              {value.types.map(t => <TypeBadge key={t} type={t} className="h-4" clickable={false} />)}
            </div>
          </div>
          <button onClick={() => { onSelect(null); setQuery(''); }} className="text-gray-600 hover:text-red-400 text-lg shrink-0">×</button>
        </div>
      )}
      <input
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search Pokémon…"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
          {results.map(r => (
            <button key={r.slug} onClick={() => { setQuery(r.name); setOpen(false); onSelect(r); }}
              className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-700 text-left transition-colors">
              {r.pokemon_id && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${r.pokemon_id}.png`} alt="" className="w-8 h-8 object-contain" />
              )}
              <span className="text-sm text-white flex-1">{r.name}</span>
              <div className="flex gap-1">
                {r.types.map(t => <TypeBadge key={t} type={t} className="h-4" clickable={false} />)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MoveSearch ────────────────────────────────────────────────────────────────

function MoveSearch({ value, onSelect }: { value: MoveInfo | null; onSelect: (m: MoveInfo | null) => void }) {
  const [query,   setQuery]   = useState(value?.name ?? '');
  const [results, setResults] = useState<MoveInfo[]>([]);
  const [open,    setOpen]    = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { if (value) setQuery(value.name); else setQuery(''); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(q: string) {
    setQuery(q);
    if (!q.trim()) { onSelect(null); setResults([]); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const { data } = await supabase
        .from('pages').select('slug, title, metadata')
        .eq('template_type', 'move').ilike('title', `%${q.trim()}%`).limit(12);
      setResults((data ?? []).map(p => ({
        slug: p.slug, name: p.title,
        type:     p.metadata?.type ?? null,
        category: p.metadata?.category ?? null,
        power:    p.metadata?.power ?? null,
      })));
      setOpen(true);
    }, 300);
  }

  return (
    <div ref={wrapRef} className="relative">
      {value && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {value.type && <TypeBadge type={value.type} className="h-5" clickable={false} />}
          {value.category && <CategoryBadge category={value.category} className="h-5" />}
          {value.power != null && <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">Pwr {value.power}</span>}
          {value.category === 'status' && <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Status</span>}
          <button onClick={() => { onSelect(null); setQuery(''); }} className="ml-auto text-gray-600 hover:text-red-400 text-sm">clear</button>
        </div>
      )}
      <input
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search move…"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
          {results.map(r => (
            <button key={r.slug} onClick={() => { setQuery(r.name); setOpen(false); onSelect(r); }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 text-left transition-colors">
              <span className="text-sm text-white flex-1">{r.name}</span>
              {r.type && <TypeBadge type={r.type} className="h-4" clickable={false} />}
              {r.category && <CategoryBadge category={r.category} className="h-4" />}
              {r.power != null && <span className="text-xs text-gray-500 font-mono w-6 text-right">{r.power}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── StatInputs ────────────────────────────────────────────────────────────────

function StatInputs({ ivs, evs, boosts, nature, bases, level, onIV, onEV, onBoost }: {
  ivs:     Stats;
  evs:     Stats;
  boosts:  Boosts;
  nature:  string;
  bases:   Stats | null;
  level:   number;
  onIV:    (k: StatKey, v: number) => void;
  onEV:    (k: StatKey, v: number) => void;
  onBoost: (k: BoostKey, v: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-[2.5rem_1fr_1fr_1fr_2.5rem] gap-1 mb-1 text-[10px] text-gray-600 uppercase text-center">
        <span className="text-left">Stat</span><span>IV</span><span>EV</span><span>Boost</span><span className="text-right">Val</span>
      </div>
      {STAT_KEYS.map(key => {
        const nat = NATURES.find(n => n.name === nature);
        const nc  = nat?.plus === key ? 'text-red-400' : nat?.minus === key ? 'text-blue-400' : 'text-gray-300';
        const raw = bases ? calcStat(key, bases[key], ivs[key], evs[key], level, nature) : null;
        const boost = key !== 'hp' ? boosts[key as BoostKey] : 0;
        const val = raw !== null ? (key !== 'hp' ? Math.floor(raw * boostMult(boost)) : raw) : null;
        return (
          <div key={key} className="grid grid-cols-[2.5rem_1fr_1fr_1fr_2.5rem] gap-1 items-center mb-1">
            <span className={`text-xs font-bold ${nc}`}>{STAT_LABELS[key]}</span>
            <input type="number" min={0} max={31} value={ivs[key]}
              onChange={e => onIV(key, Math.min(31, Math.max(0, parseInt(e.target.value)||0)))}
              className="bg-gray-700 border border-gray-600 rounded px-1 py-1 text-xs text-white text-center focus:outline-none focus:border-red-500 w-full" />
            <input type="number" min={0} max={252} value={evs[key]}
              onChange={e => onEV(key, Math.min(252, Math.max(0, parseInt(e.target.value)||0)))}
              className="bg-gray-700 border border-gray-600 rounded px-1 py-1 text-xs text-white text-center focus:outline-none focus:border-red-500 w-full" />
            {key !== 'hp' ? (
              <select value={boost} onChange={e => onBoost(key as BoostKey, parseInt(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-1 py-1 text-xs text-white focus:outline-none focus:border-red-500 w-full">
                {[-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6].map(s => (
                  <option key={s} value={s}>{s > 0 ? `+${s}` : s}</option>
                ))}
              </select>
            ) : (
              <div className="bg-gray-700/30 border border-gray-700 rounded px-1 py-1 text-xs text-gray-600 text-center">—</div>
            )}
            <span className={`text-xs text-right font-mono tabular-nums ${val !== null && boost !== 0 ? (boost > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
              {val ?? '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

function Panel({ title, state, onChange, move, onMoveChange,
  isBurned, onBurnedChange, isCrit, onCritChange,
  weather, onWeatherChange, hasReflect, onReflectChange,
  hasLightScreen, onLSChange, hasHelpingHand, onHHChange,
  defFullHP, onFullHPChange,
}: {
  title:     'Attacker' | 'Defender';
  state:     PanelState;
  onChange:  (u: Partial<PanelState>) => void;
  move?:             MoveInfo | null;
  onMoveChange?:     (m: MoveInfo | null) => void;
  isBurned?:         boolean; onBurnedChange?:  (v: boolean) => void;
  isCrit?:           boolean; onCritChange?:    (v: boolean) => void;
  weather?:          Weather; onWeatherChange?: (w: Weather) => void;
  hasReflect?:       boolean; onReflectChange?: (v: boolean) => void;
  hasLightScreen?:   boolean; onLSChange?:      (v: boolean) => void;
  hasHelpingHand?:   boolean; onHHChange?:      (v: boolean) => void;
  defFullHP?:        boolean; onFullHPChange?:  (v: boolean) => void;
}) {
  const isAtk = title === 'Attacker';
  const abilities = state.pokemon?.abilities.map(a => a.name) ?? [];

  function updateIV(k: StatKey, v: number) { onChange({ ivs: { ...state.ivs, [k]: v } }); }
  function updateEV(k: StatKey, v: number) { onChange({ evs: { ...state.evs, [k]: v } }); }
  function updateBoost(k: BoostKey, v: number) { onChange({ boosts: { ...state.boosts, [k]: v } }); }

  return (
    <div className={`bg-gray-900 rounded-2xl border p-5 flex flex-col gap-4 ${isAtk ? 'border-red-500/20' : 'border-blue-500/20'}`}>
      <h2 className={`font-extrabold text-base ${isAtk ? 'text-red-400' : 'text-blue-400'}`}>{title}</h2>

      {/* Pokémon */}
      <div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Pokémon</div>
        <PokemonSearch
          value={state.pokemon}
          accentColor={isAtk ? 'red' : 'blue'}
          onSelect={p => onChange({ pokemon: p, ability: p?.abilities[0]?.name ?? '' })}
        />
      </div>

      {/* Level + Nature */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Level</div>
          <input type="number" min={1} max={100} value={state.level}
            onChange={e => onChange({ level: Math.min(100, Math.max(1, parseInt(e.target.value)||1)) })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Nature</div>
          <select value={state.nature} onChange={e => onChange({ nature: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
            {NATURES.map(n => (
              <option key={n.name} value={n.name}>
                {n.name}{n.plus ? ` (+${STAT_LABELS[n.plus]}/-${STAT_LABELS[n.minus!]})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Stats</div>
        <StatInputs ivs={state.ivs} evs={state.evs} boosts={state.boosts}
          nature={state.nature} bases={state.pokemon?.base_stats ?? null}
          level={state.level} onIV={updateIV} onEV={updateEV} onBoost={updateBoost} />
      </div>

      {/* Move (attacker only) */}
      {isAtk && onMoveChange && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Move</div>
          <MoveSearch value={move ?? null} onSelect={onMoveChange} />
        </div>
      )}

      {/* Item + Ability */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Held Item</div>
          <select value={state.heldItem} onChange={e => onChange({ heldItem: e.target.value === '—' ? '' : e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
            {(isAtk ? ATTACKER_ITEMS : DEFENDER_ITEMS).map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ability</div>
          {abilities.length > 0 ? (
            <select value={state.ability} onChange={e => onChange({ ability: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
              {abilities.map(a => <option key={a} value={a} className="capitalize">{a.replace(/-/g, ' ')}</option>)}
            </select>
          ) : (
            <input value={state.ability} onChange={e => onChange({ ability: e.target.value })}
              placeholder="e.g. Multiscale"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500" />
          )}
        </div>
      </div>

      {/* Attacker conditions */}
      {isAtk && (
        <>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Weather</div>
            <div className="flex flex-wrap gap-1.5">
              {WEATHER_OPTIONS.map(w => (
                <button key={w.value} onClick={() => onWeatherChange?.(w.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    weather === w.value
                      ? 'bg-red-500/20 border-red-500/50 text-red-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Modifiers</div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {[
                { label: 'Burned',       val: isBurned,      cb: onBurnedChange  },
                { label: 'Critical Hit', val: isCrit,        cb: onCritChange    },
                { label: 'Helping Hand', val: hasHelpingHand, cb: onHHChange      },
                { label: 'Reflect',      val: hasReflect,    cb: onReflectChange },
                { label: 'Light Screen', val: hasLightScreen, cb: onLSChange      },
              ].map(({ label, val, cb }) => (
                <label key={label} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={val ?? false} onChange={e => cb?.(e.target.checked)}
                    className="accent-red-500 w-3.5 h-3.5" />
                  <span className="text-xs text-gray-400">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Defender conditions */}
      {!isAtk && (
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={defFullHP ?? true} onChange={e => onFullHPChange?.(e.target.checked)}
            className="accent-blue-500 w-3.5 h-3.5" />
          <span className="text-xs text-gray-400">At full HP (Multiscale / Shadow Shield)</span>
        </label>
      )}
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function BreakdownRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`font-mono text-xs font-semibold ${color ?? 'text-gray-300'}`}>{value}</span>
    </div>
  );
}

function ResultsPanel({ result, move }: { result: DamageResult | null; move: MoveInfo | null }) {
  if (!move) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center text-gray-600 text-sm">
        Select a move on the attacker side to calculate damage
      </div>
    );
  }

  if (move.category === 'status') {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
        <div className="text-3xl mb-2">⚡</div>
        <div className="text-gray-300 font-semibold">{move.name} — Status move</div>
        <div className="text-gray-600 text-sm mt-1">Status moves deal no damage</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center text-gray-600 text-sm">
        Add attacker & move details to calculate
      </div>
    );
  }

  if (result.isImmune) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
        <div className="text-4xl mb-2">🛡️</div>
        <div className="text-red-400 font-extrabold text-2xl">Immune!</div>
        <div className="text-gray-500 text-sm mt-1">This type has no effect on the defender</div>
      </div>
    );
  }

  const minPct = (result.min / result.defHP * 100).toFixed(1);
  const maxPct = (result.max / result.defHP * 100).toFixed(1);
  const ko     = koLabel(result.min, result.max, result.defHP);
  const isOHKO = result.min >= result.defHP;
  const is2HKO = result.min * 2 >= result.defHP;

  const effLabel =
    result.typeEff === 4    ? '×4 Super effective!'        :
    result.typeEff === 2    ? '×2 Super effective!'        :
    result.typeEff === 0.5  ? '×½ Not very effective'      :
    result.typeEff === 0.25 ? '×¼ Not very effective'      : '×1 Neutral';
  const effColor =
    result.typeEff >= 2   ? 'text-red-400'  :
    result.typeEff < 1    ? 'text-blue-400' : 'text-gray-400';

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      {/* Main numbers */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <div className="text-4xl font-extrabold text-white tabular-nums">
            {result.min} – {result.max}
            <span className="text-xl text-gray-500 font-normal ml-2">damage</span>
          </div>
          <div className="text-gray-400 text-sm mt-1">
            ({minPct}% – {maxPct}% of {result.defHP} HP)
          </div>
        </div>
        <div className={`text-xl font-extrabold px-5 py-2.5 rounded-xl border ${
          isOHKO ? 'bg-red-500/20 text-red-400 border-red-500/40' :
          is2HKO ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
          'bg-gray-800 text-gray-300 border-gray-700'
        }`}>
          {ko}
        </div>
      </div>

      {/* HP bar visualization */}
      <div className="mb-5">
        <div className="h-5 bg-gray-800 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-green-600 rounded-full" />
          <div className="absolute top-0 left-0 h-full bg-red-500/60 rounded-full transition-all"
            style={{ width: `${Math.min(100, parseFloat(maxPct))}%` }} />
          <div className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, parseFloat(minPct))}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/80">
            {minPct}% – {maxPct}%
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-xl p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Formula Steps</div>
          <BreakdownRow label="Attacker stat" value={result.atkStat} />
          <BreakdownRow label="Defender stat" value={result.defStat} />
          <BreakdownRow label="Base damage" value={result.baseDamage} />
          {result.weatherMult !== 1 && <BreakdownRow label="Weather" value={`×${result.weatherMult}`} color="text-sky-400" />}
          {result.critMult !== 1    && <BreakdownRow label="Critical hit" value="×1.5" color="text-yellow-400" />}
          <BreakdownRow label="Random roll" value="×85%–100%" color="text-gray-500" />
          {result.stab             && <BreakdownRow label="STAB" value="×1.5" color="text-blue-400" />}
        </div>
        <div className="bg-gray-800 rounded-xl p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Applied Multipliers</div>
          <BreakdownRow label="Type effectiveness" value={effLabel} color={effColor} />
          {result.burnMult !== 1    && <BreakdownRow label="Burn" value="×0.5" color="text-orange-400" />}
          {result.screenMult !== 1  && <BreakdownRow label="Screen" value="×0.5" color="text-cyan-400" />}
          {result.hhMult !== 1      && <BreakdownRow label="Helping Hand" value="×1.5" color="text-yellow-400" />}
          {result.itemMult !== 1    && <BreakdownRow label="Held item" value={`×${result.itemMult.toFixed(2)}`} color="text-yellow-300" />}
          {result.defItemMult !== 1 && <BreakdownRow label="Def. item (stat)" value={`×${result.defItemMult.toFixed(2)}`} color="text-blue-300" />}
          {result.abilityMult !== 1 && <BreakdownRow label="Ability" value={`×${result.abilityMult.toFixed(2)}`} color="text-purple-400" />}
          <div className="border-t border-gray-700 mt-2 pt-2">
            <BreakdownRow label="Final range" value={`${result.min} – ${result.max}`} color="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function defaultPanel(): PanelState {
  return { pokemon:null, level:50, nature:'Hardy', ivs:{...DEFAULT_IVS}, evs:{...DEFAULT_EVS}, boosts:{...DEFAULT_BOOSTS}, heldItem:'', ability:'' };
}

export default function DamageCalculatorPage() {
  const [atk,    setAtk]    = useState<PanelState>(defaultPanel());
  const [def,    setDef]    = useState<PanelState>(defaultPanel());
  const [move,   setMove]   = useState<MoveInfo | null>(null);
  const [weather,       setWeather]       = useState<Weather>('none');
  const [isBurned,      setIsBurned]      = useState(false);
  const [isCrit,        setIsCrit]        = useState(false);
  const [hasReflect,    setHasReflect]    = useState(false);
  const [hasLightScreen,setHasLightScreen]= useState(false);
  const [hasHelpingHand,setHasHelpingHand]= useState(false);
  const [defFullHP,     setDefFullHP]     = useState(true);
  const [result,        setResult]        = useState<DamageResult | null>(null);

  useEffect(() => {
    if (!move || !move.power || move.category === 'status') { setResult(null); return; }
    setResult(calculateDamage({
      atkPanel: atk, defPanel: def, move,
      isBurned, isCrit, weather,
      hasReflect, hasLightScreen, hasHelpingHand, defFullHP,
    }));
  }, [atk, def, move, isBurned, isCrit, weather, hasReflect, hasLightScreen, hasHelpingHand, defFullHP]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white">Damage Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Gen 5 formula · same engine as PokéMMO · auto-calculates on change</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Panel title="Attacker" state={atk} onChange={u => setAtk(p => ({...p,...u}))}
            move={move} onMoveChange={setMove}
            isBurned={isBurned}       onBurnedChange={setIsBurned}
            isCrit={isCrit}           onCritChange={setIsCrit}
            weather={weather}         onWeatherChange={setWeather}
            hasReflect={hasReflect}   onReflectChange={setHasReflect}
            hasLightScreen={hasLightScreen} onLSChange={setHasLightScreen}
            hasHelpingHand={hasHelpingHand} onHHChange={setHasHelpingHand}
          />
          <Panel title="Defender" state={def} onChange={u => setDef(p => ({...p,...u}))}
            defFullHP={defFullHP} onFullHPChange={setDefFullHP}
          />
        </div>

        <ResultsPanel result={result} move={move} />
      </div>
    </div>
  );
}
