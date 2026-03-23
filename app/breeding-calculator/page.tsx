'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/lib/supabase';
import TypeBadge from '@/app/components/TypeBadge';

// ── Types ─────────────────────────────────────────────────────────────────────

type StatKey = 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed';

type PokemonInfo = {
  slug: string; name: string; pokemon_id: number | null; types: string[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STAT_KEYS: StatKey[] = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'];
const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  special_attack: 'SpATK', special_defense: 'SpDEF', speed: 'SPE',
};
const POWER_ITEMS: Record<StatKey, string> = {
  hp: 'Power Weight', attack: 'Power Bracer', defense: 'Power Belt',
  special_attack: 'Power Lens', special_defense: 'Power Band', speed: 'Power Anklet',
};

const ITEM_PRICE      = 10_000;
const EVERSTONE_PRICE =  5_000;
const DAYCARE_PER_STEP = 5_000;

// Official PokéMMO breeding fee reference (not including parent purchase costs)
const OFFICIAL_COSTS: Record<'noNature' | 'withNature', Record<number, { min: number; typ: number; max: number }>> = {
  noNature: {
    1: { min: 10_000,  typ: 10_000,  max: 38_500    },
    2: { min: 20_000,  typ: 20_000,  max: 118_000   },
    3: { min: 65_000,  typ: 70_000,  max: 280_000   },
    4: { min: 155_000, typ: 170_000, max: 605_000   },
    5: { min: 335_000, typ: 370_000, max: 1_259_000 },
  },
  withNature: {
    1: { min: 17_500,  typ: 17_500,  max: 38_500    },
    2: { min: 55_000,  typ: 60_000,  max: 118_000   },
    3: { min: 132_500, typ: 163_000, max: 280_000   },
    4: { min: 290_000, typ: 360_000, max: 605_000   },
    5: { min: 607_500, typ: 758_000, max: 1_259_000 },
  },
};

const NATURES = [
  'Hardy','Lonely','Brave','Adamant','Naughty',
  'Bold','Docile','Relaxed','Impish','Lax',
  'Timid','Hasty','Serious','Jolly','Naive',
  'Modest','Mild','Quiet','Bashful','Rash',
  'Calm','Gentle','Sassy','Careful','Quirky',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n <= 0) return '0 ₽';
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M ₽`
    : `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K ₽`;
}

function costColor(n: number): string {
  if (n < 100_000)  return 'text-green-400';
  if (n < 300_000)  return 'text-yellow-400';
  return 'text-red-400';
}

// ── Chain types ───────────────────────────────────────────────────────────────

type ParentRole = 'purchased' | 'intermediate' | 'ditto' | 'wild';

type ChainParent = {
  label:      string;
  ivs31:      StatKey[];
  powerItem?: StatKey;   // which Power Item this parent holds
  role:       ParentRole;
};

type IVMechanism = { stat: StatKey; via: 'power' | 'average' };

type ChainStep = {
  step:       number;
  title:      string;
  parentA:    ChainParent;
  parentB:    ChainParent;
  offspring:  { label: string; ivs31: StatKey[] };
  mechanisms: IVMechanism[];
  attempts?:  string;
  note?:      string;
};

// ── Chain builder ─────────────────────────────────────────────────────────────

function buildChain(ivs: StatKey[], has6IVDitto: boolean, needsNature: boolean): ChainStep[] {
  const n = ivs.length;
  if (n === 0) return [];

  const L = (k: StatKey) => STAT_LABELS[k];

  const bought = (k: StatKey): ChainParent => ({
    label: `31${L(k)} Parent`,
    ivs31: [k],
    powerItem: k,
    role: 'purchased',
  });

  const inter = (ivs31: StatKey[], gender: '♀' | '♂' = '♀'): ChainParent => ({
    label: `${ivs31.length}IV ${gender} (${ivs31.map(L).join('+')})`,
    ivs31,
    role: 'intermediate',
  });

  const ditto: ChainParent = {
    label: '6IV Ditto',
    ivs31: STAT_KEYS,
    role: 'ditto',
  };

  const steps: ChainStep[] = [];

  // ── With 6IV Ditto ─────────────────────────────────────────────────────────
  if (has6IVDitto) {
    if (n === 1) {
      steps.push({
        step: 1, title: 'Get 1IV Target',
        parentA:   { ...bought(ivs[0]) },
        parentB:   { ...ditto, powerItem: undefined },
        offspring: { label: '1IV Target', ivs31: ivs },
        mechanisms: [{ stat: ivs[0], via: 'power' }],
        attempts: '~3 eggs',
      });
      return steps;
    }

    // Step 1: Buy[0] (Power[0]) × Ditto (Power[1]) → 2IV
    steps.push({
      step: 1, title: 'Step 1 — Build 2IV Base',
      parentA:   { ...bought(ivs[0]) },
      parentB:   { ...ditto, powerItem: ivs[1] },
      offspring: { label: `2IV ♀ (${ivs.slice(0, 2).map(L).join('+')})`, ivs31: ivs.slice(0, 2) },
      mechanisms: [{ stat: ivs[0], via: 'power' }, { stat: ivs[1], via: 'power' }],
      attempts: '~3 eggs',
      note: `${L(ivs[0])} passes via Power Item on parent. ${L(ivs[1])} passes via Power Item on Ditto.`,
    });

    // Subsequent: XIV × Ditto (Power[next]) → (X+1)IV
    let current = ivs.slice(0, 2);
    for (let i = 2; i < n; i++) {
      const prev    = current;
      current       = [...current, ivs[i]];
      const isLast  = i === n - 1;
      steps.push({
        step: i, title: `Step ${i} — ${isLast ? `Get ${n}IV Target` : `Build ${current.length}IV Intermediate`}`,
        parentA:   { ...inter(prev) },
        parentB:   { ...ditto, powerItem: ivs[i] },
        offspring: {
          label: isLast ? `${n}IV Target` : `${current.length}IV ♀ (${current.map(L).join('+')})`,
          ivs31: current,
        },
        mechanisms: [
          ...prev.map(k => ({ stat: k, via: 'average' as const })),
          { stat: ivs[i], via: 'power' as const },
        ],
        attempts: isLast ? '~4-8 eggs' : '~3 eggs',
        note: `${prev.map(L).join(', ')} average to 31 (Ditto has 31 everywhere). ${L(ivs[i])} passes via Power Item on Ditto.${isLast && needsNature ? ' Use Everstone for nature.' : ''}`,
      });
    }
    return steps;
  }

  // ── Without Ditto ──────────────────────────────────────────────────────────

  if (n === 1) {
    steps.push({
      step: 1, title: 'Get 1IV Target',
      parentA:   { ...bought(ivs[0]) },
      parentB:   { label: 'Any wild Pokémon', ivs31: [], role: 'wild' },
      offspring: { label: '1IV Target', ivs31: ivs },
      mechanisms: [{ stat: ivs[0], via: 'power' }],
      attempts: '~2-4 eggs',
      note: needsNature ? 'Use Everstone on the nature parent.' : undefined,
    });
    return steps;
  }

  if (n === 2) {
    steps.push({
      step: 1, title: 'Breed Two Parents Together',
      parentA:   { ...bought(ivs[0]) },
      parentB:   { ...bought(ivs[1]) },
      offspring: { label: '2IV Target', ivs31: ivs },
      mechanisms: ivs.map(k => ({ stat: k, via: 'power' as const })),
      attempts: '~3-6 eggs',
      note: needsNature ? 'Use Everstone on the nature parent.' : undefined,
    });
    return steps;
  }

  // n === 3: Step1: Buy[0]×Buy[1]→2IV, Step2: 2IV×Buy[2]→3IV
  if (n === 3) {
    const [a, b, c] = ivs;
    steps.push({
      step: 1, title: 'Step 1 — Build 2IV Intermediate',
      parentA:   { ...bought(a) },
      parentB:   { ...bought(b) },
      offspring: { label: `2IV ♀ (${L(a)}+${L(b)})`, ivs31: [a, b] },
      mechanisms: [{ stat: a, via: 'power' }, { stat: b, via: 'power' }],
      attempts: '~3-5 eggs',
    });
    steps.push({
      step: 2, title: 'Step 2 — Get 3IV Target',
      parentA:   { ...inter([a, b]) },
      parentB:   { ...bought(c) },
      offspring: { label: '3IV Target', ivs31: [a, b, c] },
      mechanisms: [
        { stat: a, via: 'average' },
        { stat: b, via: 'average' },
        { stat: c, via: 'power'   },
      ],
      attempts: '~3-6 eggs',
      note: `${L(a)} and ${L(b)} average to 31 (both parents have 31). ${L(c)} passes via Power Item.${needsNature ? ' Use Everstone for nature.' : ''}`,
    });
    return steps;
  }

  // n === 4: Step1: Buy[0]×Buy[1]→2IV-A, Step2: Buy[2]×Buy[3]→2IV-B, Step3: A×B→4IV
  if (n === 4) {
    const [a, b, c, d] = ivs;
    steps.push({
      step: 1, title: 'Step 1 — Build 2IV Intermediate A',
      parentA:   { ...bought(a) },
      parentB:   { ...bought(b) },
      offspring: { label: `2IV ♀ (${L(a)}+${L(b)})`, ivs31: [a, b] },
      mechanisms: [{ stat: a, via: 'power' }, { stat: b, via: 'power' }],
      attempts: '~3-5 eggs',
    });
    steps.push({
      step: 2, title: 'Step 2 — Build 2IV Intermediate B',
      parentA:   { ...bought(c) },
      parentB:   { ...bought(d) },
      offspring: { label: `2IV ♂ (${L(c)}+${L(d)})`, ivs31: [c, d] },
      mechanisms: [{ stat: c, via: 'power' }, { stat: d, via: 'power' }],
      attempts: '~3-5 eggs',
    });
    steps.push({
      step: 3, title: 'Step 3 — Combine → 4IV Target',
      parentA:   { ...inter([a, b]) },
      parentB:   { ...inter([c, d], '♂') },
      offspring: { label: '4IV Target', ivs31: [a, b, c, d] },
      mechanisms: [a, b, c, d].map(k => ({ stat: k, via: 'average' as const })),
      attempts: '~5-10 eggs',
      note: `All 4 stats average to 31 — each intermediate has 31 in 2 different stats.${needsNature ? ' Use Everstone for nature.' : ''}`,
    });
    return steps;
  }

  // n === 5: Steps 1-3 same as 4IV, Step 4: 4IV×Buy[4]→5IV
  if (n === 5) {
    const [a, b, c, d, e] = ivs;
    steps.push({
      step: 1, title: 'Step 1 — Build 2IV Intermediate A',
      parentA:   { ...bought(a) },
      parentB:   { ...bought(b) },
      offspring: { label: `2IV ♀ (${L(a)}+${L(b)})`, ivs31: [a, b] },
      mechanisms: [{ stat: a, via: 'power' }, { stat: b, via: 'power' }],
      attempts: '~3-5 eggs',
    });
    steps.push({
      step: 2, title: 'Step 2 — Build 2IV Intermediate B',
      parentA:   { ...bought(c) },
      parentB:   { ...bought(d) },
      offspring: { label: `2IV ♂ (${L(c)}+${L(d)})`, ivs31: [c, d] },
      mechanisms: [{ stat: c, via: 'power' }, { stat: d, via: 'power' }],
      attempts: '~3-5 eggs',
    });
    steps.push({
      step: 3, title: 'Step 3 — Build 4IV Intermediate',
      parentA:   { ...inter([a, b]) },
      parentB:   { ...inter([c, d], '♂') },
      offspring: { label: `4IV ♀ (${[a, b, c, d].map(L).join('+')})`, ivs31: [a, b, c, d] },
      mechanisms: [a, b, c, d].map(k => ({ stat: k, via: 'average' as const })),
      attempts: '~5-10 eggs',
    });
    steps.push({
      step: 4, title: 'Step 4 — Get 5IV Target',
      parentA:   { ...inter([a, b, c, d]) },
      parentB:   { ...bought(e) },
      offspring: { label: '5IV Target', ivs31: [a, b, c, d, e] },
      mechanisms: [
        ...[a, b, c, d].map(k => ({ stat: k, via: 'average' as const })),
        { stat: e, via: 'power' as const },
      ],
      attempts: '~8-15 eggs',
      note: `${[a, b, c, d].map(L).join(', ')} average to 31. ${L(e)} passes via Power Item.${needsNature ? ' Use Everstone for nature.' : ''}`,
    });
    return steps;
  }

  // n === 6: Steps 1-4 same as 5IV, Step 5: 5IV×Buy[5]→6IV
  const [a, b, c, d, e, f] = ivs as [StatKey, StatKey, StatKey, StatKey, StatKey, StatKey];
  steps.push({
    step: 1, title: 'Step 1 — Build 2IV Intermediate A',
    parentA:   { ...bought(a) }, parentB: { ...bought(b) },
    offspring: { label: `2IV ♀ (${L(a)}+${L(b)})`, ivs31: [a, b] },
    mechanisms: [{ stat: a, via: 'power' }, { stat: b, via: 'power' }],
    attempts: '~3-5 eggs',
  });
  steps.push({
    step: 2, title: 'Step 2 — Build 2IV Intermediate B',
    parentA:   { ...bought(c) }, parentB: { ...bought(d) },
    offspring: { label: `2IV ♂ (${L(c)}+${L(d)})`, ivs31: [c, d] },
    mechanisms: [{ stat: c, via: 'power' }, { stat: d, via: 'power' }],
    attempts: '~3-5 eggs',
  });
  steps.push({
    step: 3, title: 'Step 3 — Build 4IV Intermediate',
    parentA:   { ...inter([a, b]) }, parentB: { ...inter([c, d], '♂') },
    offspring: { label: `4IV ♀ (${[a, b, c, d].map(L).join('+')})`, ivs31: [a, b, c, d] },
    mechanisms: [a, b, c, d].map(k => ({ stat: k, via: 'average' as const })),
    attempts: '~5-10 eggs',
  });
  steps.push({
    step: 4, title: 'Step 4 — Build 5IV Intermediate',
    parentA:   { ...inter([a, b, c, d]) }, parentB: { ...bought(e) },
    offspring: { label: `5IV ♀ (${[a, b, c, d, e].map(L).join('+')})`, ivs31: [a, b, c, d, e] },
    mechanisms: [
      ...[a, b, c, d].map(k => ({ stat: k, via: 'average' as const })),
      { stat: e, via: 'power' as const },
    ],
    attempts: '~8-15 eggs',
  });
  steps.push({
    step: 5, title: 'Step 5 — Get 6IV Target',
    parentA:   { ...inter([a, b, c, d, e]) }, parentB: { ...bought(f) },
    offspring: { label: '6IV Target', ivs31: [a, b, c, d, e, f] },
    mechanisms: [
      ...[a, b, c, d, e].map(k => ({ stat: k, via: 'average' as const })),
      { stat: f, via: 'power' as const },
    ],
    attempts: '~10-20 eggs',
    note: `All previous IVs average to 31. ${L(f)} passes via Power Item.${needsNature ? ' Use Everstone for nature.' : ''}`,
  });
  return steps;
}

// ── PokemonSearch ─────────────────────────────────────────────────────────────

function PokemonSearch({ value, onSelect }: { value: PokemonInfo | null; onSelect: (p: PokemonInfo | null) => void }) {
  const [query,   setQuery]   = useState(value?.name ?? '');
  const [results, setResults] = useState<PokemonInfo[]>([]);
  const [open,    setOpen]    = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value?.name ?? ''); }, [value]);

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
        slug: p.slug, name: p.title,
        pokemon_id: p.metadata?.pokemon_id ?? null,
        types: p.metadata?.types ?? [],
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
        <div className="flex items-center gap-3 mb-2 p-3 bg-gray-800 rounded-xl border border-green-500/20">
          {animUrl && <img src={animUrl} alt={value.name} className="w-14 h-14 object-contain" />}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white capitalize">{value.name}</div>
            <div className="flex gap-1 mt-1">
              {value.types.map(t => <TypeBadge key={t} type={t} className="h-4" clickable={false} />)}
            </div>
          </div>
          <button onClick={() => { onSelect(null); setQuery(''); }} className="text-gray-600 hover:text-red-400 text-lg shrink-0">×</button>
        </div>
      )}
      <input
        value={query} onChange={e => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search Pokémon…"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
          {results.map(r => (
            <button key={r.slug} onClick={() => { setQuery(r.name); setOpen(false); onSelect(r); }}
              className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-700 text-left transition-colors">
              {r.pokemon_id && <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${r.pokemon_id}.png`} alt="" className="w-8 h-8 object-contain" />}
              <span className="text-sm text-white flex-1">{r.name}</span>
              <div className="flex gap-1">{r.types.map(t => <TypeBadge key={t} type={t} className="h-4" clickable={false} />)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── IVBadge ───────────────────────────────────────────────────────────────────

function IVBadge({ statKey, active, via }: { statKey: StatKey; active: boolean; via?: 'power' | 'average' }) {
  const base = active
    ? via === 'power'   ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
    : via === 'average' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
    :                     'bg-green-500/20 text-green-400 border border-green-500/40'
    : 'bg-gray-700 text-gray-500';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${base}`}>
      {STAT_LABELS[statKey]}
    </span>
  );
}

// ── ChainCard ─────────────────────────────────────────────────────────────────

function ChainCard({ step }: { step: ChainStep }) {
  const roleStyle = (role: ParentRole) => {
    if (role === 'purchased')    return 'bg-blue-950/40 border-blue-500/30';
    if (role === 'ditto')        return 'bg-purple-950/40 border-purple-500/30';
    if (role === 'intermediate') return 'bg-gray-800/80 border-gray-700';
    return 'bg-gray-800/40 border-gray-700/50';
  };
  const roleLabel = (role: ParentRole, p: ChainParent) => {
    if (role === 'purchased')    return <span className="text-[10px] text-blue-400 font-semibold">Buy from GTL</span>;
    if (role === 'ditto')        return <span className="text-[10px] text-purple-400 font-semibold">6IV Ditto</span>;
    if (role === 'intermediate') return <span className="text-[10px] text-gray-500">Bred intermediate</span>;
    return <span className="text-[10px] text-gray-600">Any</span>;
  };

  const ParentBox = ({ p, side }: { p: ChainParent; side: 'A' | 'B' }) => (
    <div className={`flex-1 rounded-xl p-3 border ${roleStyle(p.role)}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Parent {side}</span>
        {roleLabel(p.role, p)}
      </div>
      <div className={`text-xs font-semibold mb-2 ${
        p.role === 'purchased'    ? 'text-blue-300'   :
        p.role === 'ditto'        ? 'text-purple-300' : 'text-gray-200'
      }`}>{p.label}</div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {STAT_KEYS.map(k => (
          <span key={k} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            p.ivs31.includes(k)
              ? p.role === 'ditto' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              :                      'bg-green-500/20 text-green-400 border border-green-500/40'
              : 'bg-gray-700 text-gray-600'
          }`}>{STAT_LABELS[k]}</span>
        ))}
      </div>
      {p.powerItem && (
        <div className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-0.5 inline-block mt-0.5">
          🎒 {POWER_ITEMS[p.powerItem]}
        </div>
      )}
    </div>
  );

  // Build a map of how each IV in the offspring is inherited
  const mechMap: Partial<Record<StatKey, 'power' | 'average'>> = {};
  for (const m of step.mechanisms) mechMap[m.stat] = m.via;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold flex items-center justify-center shrink-0">
            {step.step}
          </span>
          <span className="font-semibold text-white text-sm">{step.title}</span>
        </div>
        {step.attempts && (
          <span className="text-[11px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-lg shrink-0">{step.attempts}</span>
        )}
      </div>

      <div className="flex items-start gap-2">
        <ParentBox p={step.parentA} side="A" />
        <div className="flex flex-col items-center justify-center pt-8 shrink-0 text-gray-600 text-lg">×</div>
        <ParentBox p={step.parentB} side="B" />
      </div>

      <div className="flex justify-center my-2 text-green-500 text-lg">↓</div>

      {/* Offspring */}
      <div className="bg-green-950/30 border border-green-500/20 rounded-xl p-3">
        <div className="text-[10px] text-green-500 uppercase tracking-widest mb-1">Offspring</div>
        <div className="text-sm font-semibold text-green-300 mb-2">{step.offspring.label}</div>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {STAT_KEYS.map(k => (
            <IVBadge key={k} statKey={k} active={step.offspring.ivs31.includes(k)} via={mechMap[k]} />
          ))}
        </div>
        {/* IV mechanism legend for this step */}
        {step.mechanisms.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {step.mechanisms.filter(m => m.via === 'power').length > 0 && (
              <span className="text-[10px] text-yellow-500">
                🎒 via Power Item: {step.mechanisms.filter(m => m.via === 'power').map(m => STAT_LABELS[m.stat]).join(', ')}
              </span>
            )}
            {step.mechanisms.filter(m => m.via === 'average').length > 0 && (
              <span className="text-[10px] text-blue-400">
                ≈ via averaging (free): {step.mechanisms.filter(m => m.via === 'average').map(m => STAT_LABELS[m.stat]).join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      {step.note && (
        <p className="mt-2 text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
          💡 {step.note}
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BreedingCalculatorPage() {
  const [pokemon,          setPokemon]          = useState<PokemonInfo | null>(null);
  const [targetIVs,        setTargetIVs]        = useState<StatKey[]>([]);
  const [needsNature,      setNeedsNature]      = useState(false);
  const [selectedNature,   setSelectedNature]   = useState('Adamant');
  const [hasHiddenAbility, setHasHiddenAbility] = useState(false);
  const [isShiny,          setIsShiny]          = useState(false);
  const [has6IVDitto,      setHas6IVDitto]      = useState(false);

  // Parent prices & ownership
  const [parentPrices, setParentPrices] = useState<Partial<Record<StatKey, string>>>({});
  const [parentOwned,  setParentOwned]  = useState<Partial<Record<StatKey, boolean>>>({});
  const [dittoPrice,   setDittoPrice]   = useState('');
  const [dittoOwned,   setDittoOwned]   = useState(false);

  // Items
  const [ownedItems,     setOwnedItems]     = useState<Set<string>>(new Set());
  const [everstoneOwned, setEverstoneOwned] = useState(false);

  function toggleIV(k: StatKey) {
    setTargetIVs(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  }

  const chain   = buildChain(targetIVs, has6IVDitto, needsNature);
  const ivCount = Math.min(targetIVs.length, 5);

  // Which stats need Power Items
  const powerItemsForChain: StatKey[] = targetIVs; // 1 item per target stat regardless of chain

  // Cost calculation
  const parentStatsToBuy = has6IVDitto
    ? (targetIVs.length > 0 ? [targetIVs[0]] : [])
    : targetIVs;

  const parentCost = (has6IVDitto
    ? (dittoOwned ? 0 : parseInt(dittoPrice || '0', 10))
    : 0
  ) + parentStatsToBuy.reduce(
    (sum, k) => sum + (parentOwned[k] ? 0 : parseInt(parentPrices[k] || '0', 10)),
    0
  );

  const powerItemsToBuy = powerItemsForChain.filter(k => !ownedItems.has(POWER_ITEMS[k]));
  const everCost        = needsNature && !everstoneOwned ? EVERSTONE_PRICE : 0;
  const itemCost        = powerItemsToBuy.length * ITEM_PRICE + everCost;
  const daycareCost     = chain.length * DAYCARE_PER_STEP;
  const estimatedTotal  = parentCost + itemCost + daycareCost;

  // Official table reference
  const officialRef = ivCount > 0 ? OFFICIAL_COSTS[needsNature ? 'withNature' : 'noNature'][ivCount] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-1">Breeding Calculator</h1>
          <p className="text-gray-500 text-sm">
            Power Items guarantee 2 IVs per step. Once both parents share a 31, that stat averages to 31 for free.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Section 1 — Target */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="font-extrabold text-base text-green-400 mb-4">① Target Pokémon</h2>

              <PokemonSearch value={pokemon} onSelect={setPokemon} />

              {/* IV selection */}
              <div className="mt-4">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">IVs to breed perfect (31)</div>
                <div className="grid grid-cols-3 gap-2">
                  {STAT_KEYS.map(k => (
                    <button key={k} onClick={() => toggleIV(k)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        targetIVs.includes(k)
                          ? 'bg-green-500/20 border-green-500/50 text-green-400'
                          : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'
                      }`}
                    >
                      {STAT_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nature */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Nature Required?</span>
                  <button onClick={() => setNeedsNature(p => !p)}
                    className={`relative h-5 w-9 rounded-full border-2 transition-colors ${needsNature ? 'bg-green-500 border-green-500' : 'bg-gray-600 border-gray-500'}`}>
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${needsNature ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {needsNature && (
                  <div className="space-y-2">
                    <select value={selectedNature} onChange={e => setSelectedNature(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                      {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <p className="text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1">
                      Use Everstone on the parent with this nature.
                    </p>
                  </div>
                )}
              </div>

              {/* Misc toggles */}
              <div className="mt-4 space-y-2">
                {([
                  { label: 'Hidden Ability needed',           val: hasHiddenAbility, set: setHasHiddenAbility },
                  { label: 'Shiny (both parents must be shiny)', val: isShiny,          set: setIsShiny          },
                ] as const).map(({ label, val, set }) => (
                  <label key={label} className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-gray-400">{label}</span>
                    <button onClick={() => set((p: boolean) => !p)}
                      className={`relative h-5 w-9 rounded-full border-2 transition-colors shrink-0 ${val ? 'bg-green-500 border-green-500' : 'bg-gray-600 border-gray-500'}`}>
                      <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${val ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                ))}
              </div>

              {/* 6IV Ditto */}
              <div className="mt-4 p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-purple-300">I have a 6IV Ditto</div>
                    <div className="text-[11px] text-purple-500 mt-0.5">Replaces all parents — much cheaper</div>
                  </div>
                  <button onClick={() => setHas6IVDitto(p => !p)}
                    className={`relative h-5 w-9 rounded-full border-2 transition-colors shrink-0 ${has6IVDitto ? 'bg-purple-500 border-purple-500' : 'bg-gray-600 border-gray-500'}`}>
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${has6IVDitto ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              </div>
            </div>

            {/* Section 2 — Parent Prices */}
            {targetIVs.length > 0 && (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h2 className="font-extrabold text-base text-blue-400 mb-4">② Parent Prices</h2>

                <div className="space-y-3">
                  {/* Ditto price (if using 6IV Ditto) */}
                  {has6IVDitto && (
                    <div className="pb-3 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-300 font-semibold flex-1">6IV Ditto</span>
                        {dittoOwned ? (
                          <span className="text-xs text-green-400 font-semibold">✓ Owned</span>
                        ) : (
                          <div className="relative w-28">
                            <input type="number" min="0" value={dittoPrice}
                              onChange={e => setDittoPrice(e.target.value)}
                              placeholder="0"
                              className="w-full bg-gray-800 border border-purple-700/50 rounded-lg px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 pr-5" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">₽</span>
                          </div>
                        )}
                        <label className="flex items-center gap-1 cursor-pointer shrink-0">
                          <input type="checkbox" checked={dittoOwned} onChange={() => setDittoOwned(p => !p)}
                            className="accent-purple-500 w-3 h-3" />
                          <span className="text-[10px] text-gray-500">Owned</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Per-stat parent prices */}
                  {(has6IVDitto ? targetIVs.slice(0, 1) : targetIVs).map(k => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-xs text-blue-300 font-medium flex-1">31 {STAT_LABELS[k]} Parent</span>
                      {parentOwned[k] ? (
                        <span className="text-xs text-green-400 font-semibold">✓ Owned</span>
                      ) : (
                        <div className="relative w-28">
                          <input type="number" min="0"
                            value={parentPrices[k] ?? ''}
                            onChange={e => setParentPrices(prev => ({ ...prev, [k]: e.target.value }))}
                            placeholder="0"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 pr-5" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">₽</span>
                        </div>
                      )}
                      <label className="flex items-center gap-1 cursor-pointer shrink-0">
                        <input type="checkbox" checked={parentOwned[k] ?? false}
                          onChange={() => setParentOwned(prev => ({ ...prev, [k]: !prev[k] }))}
                          className="accent-green-500 w-3 h-3" />
                        <span className="text-[10px] text-gray-500">Owned</span>
                      </label>
                    </div>
                  ))}
                  {has6IVDitto && targetIVs.length > 1 && (
                    <p className="text-[11px] text-purple-400">
                      Only 1 purchased parent needed — Ditto provides all other IVs.
                    </p>
                  )}

                  {/* Power Items */}
                  <div className="pt-3 border-t border-gray-800">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Power Items (10K ₽ each)</div>
                    <div className="space-y-1.5">
                      {powerItemsForChain.map(k => (
                        <label key={k} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={ownedItems.has(POWER_ITEMS[k])}
                            onChange={() => setOwnedItems(prev => {
                              const next = new Set(prev);
                              next.has(POWER_ITEMS[k]) ? next.delete(POWER_ITEMS[k]) : next.add(POWER_ITEMS[k]);
                              return next;
                            })}
                            className="accent-yellow-500 w-3.5 h-3.5" />
                          <span className={`text-xs flex-1 ${ownedItems.has(POWER_ITEMS[k]) ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                            {POWER_ITEMS[k]}
                          </span>
                          <span className={`text-[11px] font-mono ${ownedItems.has(POWER_ITEMS[k]) ? 'text-gray-700' : 'text-yellow-500'}`}>
                            {ownedItems.has(POWER_ITEMS[k]) ? 'owned' : '10K ₽'}
                          </span>
                        </label>
                      ))}
                      {needsNature && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={everstoneOwned}
                            onChange={() => setEverstoneOwned(p => !p)}
                            className="accent-yellow-500 w-3.5 h-3.5" />
                          <span className={`text-xs flex-1 ${everstoneOwned ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                            Everstone
                          </span>
                          <span className={`text-[11px] font-mono ${everstoneOwned ? 'text-gray-700' : 'text-yellow-500'}`}>
                            {everstoneOwned ? 'owned' : '5K ₽'}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4 — Cost Estimate */}
            {targetIVs.length > 0 && (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h2 className="font-extrabold text-base text-yellow-400 mb-4">④ Cost Estimate</h2>

                <div className="space-y-1.5 mb-4">
                  {/* Parents */}
                  {has6IVDitto ? (
                    <>
                      {!dittoOwned && parseInt(dittoPrice || '0') > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">6IV Ditto</span>
                          <span className="text-purple-300">{fmt(parseInt(dittoPrice))}</span>
                        </div>
                      )}
                      {targetIVs[0] && !parentOwned[targetIVs[0]] && parseInt(parentPrices[targetIVs[0]] || '0') > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">31{STAT_LABELS[targetIVs[0]]} Parent</span>
                          <span className="text-blue-300">{fmt(parseInt(parentPrices[targetIVs[0]]!))}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    parentStatsToBuy.map(k => {
                      const p = parseInt(parentPrices[k] || '0');
                      return (
                        <div key={k} className="flex justify-between text-xs">
                          <span className="text-gray-500">31{STAT_LABELS[k]} Parent{parentOwned[k] ? ' (owned)' : ''}</span>
                          <span className={parentOwned[k] ? 'text-gray-600 line-through' : 'text-blue-300'}>
                            {parentOwned[k] ? 'free' : p > 0 ? fmt(p) : '—'}
                          </span>
                        </div>
                      );
                    })
                  )}

                  {/* Items */}
                  {powerItemsToBuy.length > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Power Items ({powerItemsToBuy.length}×)</span>
                      <span className="text-yellow-500">{fmt(powerItemsToBuy.length * ITEM_PRICE)}</span>
                    </div>
                  )}
                  {needsNature && !everstoneOwned && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Everstone</span>
                      <span className="text-yellow-500">{fmt(EVERSTONE_PRICE)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Daycare fees ({chain.length} step{chain.length !== 1 ? 's' : ''} × 5K est.)</span>
                    <span className="text-gray-400">{fmt(daycareCost)}</span>
                  </div>
                  {isShiny && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Shiny parents</span>
                      <span className="text-orange-400">varies</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-gray-800 pt-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-semibold">Estimated Total</span>
                    <span className={`text-lg font-extrabold ${costColor(estimatedTotal)}`}>
                      {fmt(estimatedTotal)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-700 mt-1">
                    Parents + items + {chain.length} daycare step{chain.length !== 1 ? 's' : ''} (rough estimate)
                  </p>
                </div>

                {/* Official reference table */}
                {officialRef && (
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Official guide reference — breeding fees only</div>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { label: 'Min', value: officialRef.min, color: 'text-green-400',  bg: 'bg-green-950/30 border-green-500/20' },
                        { label: 'Typ', value: officialRef.typ, color: 'text-yellow-400', bg: 'bg-yellow-950/30 border-yellow-500/20' },
                        { label: 'Max', value: officialRef.max, color: 'text-red-400',    bg: 'bg-red-950/30 border-red-500/20' },
                      ] as const).map(({ label, value, color, bg }) => (
                        <div key={label} className={`rounded-xl p-2 border ${bg} text-center`}>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
                          <div className={`text-sm font-extrabold mt-0.5 ${color}`}>{fmt(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right column — Chain ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Section 3 — Breeding Chain */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-base text-white">③ Breeding Chain</h2>
                {chain.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-lg">
                    {chain.length} step{chain.length !== 1 ? 's' : ''}
                    {has6IVDitto ? ' · Ditto chain' : ''}
                  </span>
                )}
              </div>

              {/* Legend */}
              {chain.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4 text-[11px]">
                  <span className="flex items-center gap-1.5 text-blue-300">
                    <span className="w-2.5 h-2.5 rounded bg-blue-950/60 border border-blue-500/30 inline-block" />
                    Buy from GTL
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-2.5 h-2.5 rounded bg-gray-800 border border-gray-700 inline-block" />
                    Bred intermediate
                  </span>
                  <span className="flex items-center gap-1.5 text-yellow-500">
                    <span className="w-2.5 h-2.5 rounded bg-yellow-500/20 border border-yellow-500/30 inline-block" />
                    IV via Power Item
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500/30 inline-block" />
                    IV via averaging (free)
                  </span>
                </div>
              )}

              {targetIVs.length === 0 ? (
                <div className="text-center text-gray-600 py-10">
                  <div className="text-4xl mb-2">🥚</div>
                  <div className="text-sm">Select target IVs above to see the chain</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {chain.map(s => <ChainCard key={s.step} step={s} />)}

                  {needsNature && chain.length > 0 && (
                    <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
                      <span className="font-bold">Nature:</span> Use Everstone on the <span className="text-white">{selectedNature}</span> parent
                      in the final step to guarantee it 100%.
                    </div>
                  )}
                  {isShiny && (
                    <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300">
                      <span className="font-bold">✨ Shiny:</span> All parents in the chain must be Shiny — Shinies can only breed with other Shinies in PokéMMO.
                    </div>
                  )}
                  {hasHiddenAbility && (
                    <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300">
                      <span className="font-bold">HA:</span> Ensure the female parent in the final step has the Hidden Ability — HA only passes through the female line.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rules reference */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="font-extrabold text-sm text-gray-500 mb-3 uppercase tracking-widest">PokéMMO Breeding Rules</h2>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li className="flex gap-2"><span className="text-blue-400 shrink-0">→</span><span>Purchase parents with 31 in the desired stats from GTL — wild Pokémon have random IVs (0–31)</span></li>
                <li className="flex gap-2"><span className="text-green-400 shrink-0">→</span><span>3 IVs are inherited <strong className="text-gray-400">directly</strong> from parents — Power Items force one specific IV per parent</span></li>
                <li className="flex gap-2"><span className="text-blue-300 shrink-0">→</span><span>3 IVs are <strong className="text-gray-400">averaged</strong> — if both parents have 31 in that stat, the offspring gets 31 automatically (free!)</span></li>
                <li className="flex gap-2"><span className="text-yellow-400 shrink-0">→</span><span><strong className="text-gray-400">Power Items</strong> (10,000₽ each) lock one IV into the direct inheritance slot</span></li>
                <li className="flex gap-2"><span className="text-purple-400 shrink-0">→</span><span><strong className="text-gray-400">Everstone</strong> (5,000₽) guarantees 100% nature inheritance</span></li>
                <li className="flex gap-2"><span className="text-pink-400 shrink-0">→</span><span>Hidden Ability only passes if the <strong className="text-gray-400">female</strong> has it</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
