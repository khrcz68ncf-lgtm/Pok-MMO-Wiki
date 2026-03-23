'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/lib/supabase';
import TypeBadge from '@/app/components/TypeBadge';

// ── Types ─────────────────────────────────────────────────────────────────────

type StatKey = 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed';

type PokemonInfo = {
  slug:       string;
  name:       string;
  pokemon_id: number | null;
  types:      string[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STAT_KEYS:   StatKey[] = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'];
const STAT_LABELS: Record<StatKey, string> = { hp:'HP', attack:'ATK', defense:'DEF', special_attack:'SpATK', special_defense:'SpDEF', speed:'SPE' };

const POWER_ITEMS: Record<StatKey, { name: string; stat: string }> = {
  hp:              { name: 'Power Weight',  stat: 'HP'    },
  attack:          { name: 'Power Bracer',  stat: 'ATK'   },
  defense:         { name: 'Power Belt',    stat: 'DEF'   },
  special_attack:  { name: 'Power Lens',    stat: 'SpATK' },
  special_defense: { name: 'Power Band',    stat: 'SpDEF' },
  speed:           { name: 'Power Anklet',  stat: 'SPE'   },
};

const ITEM_PRICE    = 10_000;
const EVERSTONE_PRICE = 5_000;

// Official PokéMMO cost table (Pokéyen)
const COSTS: Record<'noNature' | 'withNature', Record<number, { min: number; typ: number; max: number }>> = {
  noNature: {
    1: { min: 10_000,  typ: 10_000,  max: 38_500  },
    2: { min: 20_000,  typ: 20_000,  max: 118_000 },
    3: { min: 65_000,  typ: 70_000,  max: 280_000 },
    4: { min: 155_000, typ: 170_000, max: 605_000 },
    5: { min: 335_000, typ: 370_000, max: 1_259_000 },
  },
  withNature: {
    1: { min: 17_500,  typ: 17_500,  max: 38_500  },
    2: { min: 55_000,  typ: 60_000,  max: 118_000 },
    3: { min: 132_500, typ: 163_000, max: 280_000 },
    4: { min: 290_000, typ: 360_000, max: 605_000 },
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
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M ₽`
    : `${(n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1)}K ₽`;
}

function costColor(n: number): string {
  if (n < 100_000)  return 'text-green-400';
  if (n < 500_000)  return 'text-yellow-400';
  return 'text-red-400';
}

// ── Breeding chain builder ────────────────────────────────────────────────────

type ChainParent = {
  label:   string;
  ivs:     string[];
  item?:   string;
  isDitto?: boolean;
};

type ChainStep = {
  step:      number;
  title:     string;
  parentA:   ChainParent;
  parentB:   ChainParent;
  offspring: { label: string; ivs: string[] };
  note?:     string;
};

function buildChain(ivs: StatKey[], has6IVDitto: boolean, needsNature: boolean): ChainStep[] {
  const n = ivs.length;
  if (n === 0) return [];

  const lbl  = (ks: StatKey[]) => ks.map(k => STAT_LABELS[k]);
  const item = (k: StatKey)   => POWER_ITEMS[k].name;
  const steps: ChainStep[] = [];

  if (has6IVDitto) {
    // ── With 6IV Ditto ────────────────────────────────────────────────
    if (n <= 2) {
      steps.push({
        step: 1, title: `Get ${n}IV Offspring`,
        parentA:  { label: 'Base ♀',    ivs: [],      item: item(ivs[0]) },
        parentB:  { label: '6IV Ditto', ivs: lbl(ivs), isDitto: true, item: n === 2 ? item(ivs[1]) : undefined },
        offspring: { label: `${n}IV Target`, ivs: lbl(ivs) },
        note: 'Ditto provides 31 IVs in all slots — averages will be 31 if base also has 31.',
      });
    } else if (n <= 4) {
      // Step 1: get 2IV base
      const first2 = ivs.slice(0, 2);
      const rest   = ivs.slice(2);
      steps.push({
        step: 1, title: 'Get 2IV Intermediate',
        parentA:  { label: 'Base ♀',    ivs: [],         item: item(ivs[0]) },
        parentB:  { label: '6IV Ditto', ivs: lbl(ivs), isDitto: true, item: item(ivs[1]) },
        offspring: { label: `2IV ♀ (${lbl(first2).join('+')})`, ivs: lbl(first2) },
      });
      steps.push({
        step: 2, title: `Get ${n}IV Target`,
        parentA:  { label: `2IV ♀ (${lbl(first2).join('+')})`, ivs: lbl(first2), item: item(ivs[0]) },
        parentB:  { label: '6IV Ditto', ivs: lbl(ivs), isDitto: true, item: item(rest[rest.length - 1]) },
        offspring: { label: `${n}IV Target`, ivs: lbl(ivs) },
        note: 'Averaged IVs = 31 because Ditto has 31 everywhere.',
      });
    } else {
      // 5 IVs
      const first2  = ivs.slice(0, 2);
      const mid2    = ivs.slice(2, 4);
      const last    = ivs.slice(4);
      steps.push({
        step: 1, title: 'Get 2IV Intermediate A',
        parentA:  { label: 'Base ♀',    ivs: [],       item: item(ivs[0]) },
        parentB:  { label: '6IV Ditto', ivs: lbl(ivs), isDitto: true, item: item(ivs[1]) },
        offspring: { label: `2IV ♀ (${lbl(first2).join('+')})`, ivs: lbl(first2) },
      });
      steps.push({
        step: 2, title: 'Get 4IV Intermediate',
        parentA:  { label: `2IV ♀ (${lbl(first2).join('+')})`, ivs: lbl(first2), item: item(ivs[0]) },
        parentB:  { label: '6IV Ditto', ivs: lbl(ivs), isDitto: true, item: item(mid2[mid2.length - 1]) },
        offspring: { label: `4IV ♀ (${lbl([...first2, ...mid2]).join('+')})`, ivs: lbl([...first2, ...mid2]) },
      });
      steps.push({
        step: 3, title: 'Get 5IV Target',
        parentA:  { label: `4IV ♀ (${lbl([...first2, ...mid2]).join('+')})`, ivs: lbl([...first2, ...mid2]), item: item(ivs[0]) },
        parentB:  { label: '6IV Ditto', ivs: lbl(ivs), isDitto: true, item: item(last[0]) },
        offspring: { label: '5IV Target', ivs: lbl(ivs) },
        note: needsNature ? 'Use Everstone on the parent with the correct nature.' : undefined,
      });
    }
    return steps;
  }

  // ── Without 6IV Ditto ─────────────────────────────────────────────────────
  if (n === 1) {
    steps.push({
      step: 1, title: 'Catch/Trade for 1IV Parent',
      parentA:  { label: 'Wild/Traded ♀', ivs: [],         item: item(ivs[0]) },
      parentB:  { label: 'Wild ♂',        ivs: []          },
      offspring: { label: '1IV Target', ivs: lbl(ivs) },
      note: `Find a wild ${STAT_LABELS[ivs[0]]}=31 Pokémon and breed with Power Weight.`,
    });
    return steps;
  }

  if (n === 2) {
    steps.push({
      step: 1, title: `Build Parent A — ${lbl([ivs[0]]).join('')}`,
      parentA:  { label: 'Wild ♀', ivs: [], item: item(ivs[0]) },
      parentB:  { label: 'Wild ♂', ivs: [] },
      offspring: { label: `1IV ♂ (${lbl([ivs[0]]).join('')})`, ivs: lbl([ivs[0]]) },
    });
    steps.push({
      step: 2, title: `Combine → 2IV`,
      parentA:  { label: 'Wild ♀',                          ivs: [],          item: item(ivs[1]) },
      parentB:  { label: `1IV ♂ (${STAT_LABELS[ivs[0]]})`, ivs: lbl([ivs[0]]), item: item(ivs[0]) },
      offspring: { label: '2IV Target', ivs: lbl(ivs) },
    });
    return steps;
  }

  if (n === 3) {
    const [a, b, c] = ivs;
    steps.push({
      step: 1, title: `Build 2IV Parent (${lbl([a, b]).join('+')})`,
      parentA:  { label: `1IV ♀ (${STAT_LABELS[a]})`, ivs: lbl([a]), item: item(a) },
      parentB:  { label: `1IV ♂ (${STAT_LABELS[b]})`, ivs: lbl([b]), item: item(b) },
      offspring: { label: `2IV ♀ (${lbl([a, b]).join('+')})`, ivs: lbl([a, b]) },
    });
    steps.push({
      step: 2, title: `Build 1IV Parent (${STAT_LABELS[c]})`,
      parentA:  { label: 'Wild ♀', ivs: [], item: item(c) },
      parentB:  { label: 'Wild ♂', ivs: [] },
      offspring: { label: `1IV ♂ (${STAT_LABELS[c]})`, ivs: lbl([c]) },
    });
    steps.push({
      step: 3, title: 'Combine → 3IV Target',
      parentA:  { label: `2IV ♀ (${lbl([a, b]).join('+')})`, ivs: lbl([a, b]), item: item(a) },
      parentB:  { label: `1IV ♂ (${STAT_LABELS[c]})`,         ivs: lbl([c]),    item: item(c) },
      offspring: { label: '3IV Target', ivs: lbl(ivs) },
      note: needsNature ? 'Breed with Everstone on the nature parent in this final step.' : undefined,
    });
    return steps;
  }

  if (n === 4) {
    const [a, b, c, d] = ivs;
    steps.push({
      step: 1, title: `Build Parent A — 2IV (${lbl([a, b]).join('+')})`,
      parentA:  { label: `1IV ♀ (${STAT_LABELS[a]})`, ivs: lbl([a]), item: item(a) },
      parentB:  { label: `1IV ♂ (${STAT_LABELS[b]})`, ivs: lbl([b]), item: item(b) },
      offspring: { label: `2IV ♀ (${lbl([a, b]).join('+')})`, ivs: lbl([a, b]) },
    });
    steps.push({
      step: 2, title: `Build Parent B — 2IV (${lbl([c, d]).join('+')})`,
      parentA:  { label: `1IV ♀ (${STAT_LABELS[c]})`, ivs: lbl([c]), item: item(c) },
      parentB:  { label: `1IV ♂ (${STAT_LABELS[d]})`, ivs: lbl([d]), item: item(d) },
      offspring: { label: `2IV ♂ (${lbl([c, d]).join('+')})`, ivs: lbl([c, d]) },
    });
    steps.push({
      step: 3, title: 'Get 3IV Intermediate',
      parentA:  { label: `2IV ♀ (${lbl([a, b]).join('+')})`, ivs: lbl([a, b]), item: item(a) },
      parentB:  { label: `2IV ♂ (${lbl([c, d]).join('+')})`, ivs: lbl([c, d]), item: item(c) },
      offspring: { label: `3IV ♀ (${lbl([a, b, c]).join('+')})`, ivs: lbl([a, b, c]) },
    });
    steps.push({
      step: 4, title: 'Combine → 4IV Target',
      parentA:  { label: `3IV ♀ (${lbl([a,b,c]).join('+')})`, ivs: lbl([a,b,c]), item: item(a) },
      parentB:  { label: `2IV ♂ (${lbl([c,d]).join('+')})`,   ivs: lbl([c, d]),  item: item(d) },
      offspring: { label: '4IV Target', ivs: lbl(ivs) },
      note: needsNature ? 'Use Everstone here for guaranteed nature.' : undefined,
    });
    return steps;
  }

  // 5 IVs
  const [a, b, c, d, e] = ivs;
  steps.push({
    step: 1, title: `Build 2IV Parent A (${lbl([a, b]).join('+')})`,
    parentA:  { label: `1IV ♀ (${STAT_LABELS[a]})`, ivs: lbl([a]), item: item(a) },
    parentB:  { label: `1IV ♂ (${STAT_LABELS[b]})`, ivs: lbl([b]), item: item(b) },
    offspring: { label: `2IV ♀ (${lbl([a,b]).join('+')})`, ivs: lbl([a, b]) },
  });
  steps.push({
    step: 2, title: `Build 2IV Parent B (${lbl([c, d]).join('+')})`,
    parentA:  { label: `1IV ♀ (${STAT_LABELS[c]})`, ivs: lbl([c]), item: item(c) },
    parentB:  { label: `1IV ♂ (${STAT_LABELS[d]})`, ivs: lbl([d]), item: item(d) },
    offspring: { label: `2IV ♂ (${lbl([c,d]).join('+')})`, ivs: lbl([c, d]) },
  });
  steps.push({
    step: 3, title: `Build 4IV Intermediate`,
    parentA:  { label: `2IV ♀ (${lbl([a,b]).join('+')})`, ivs: lbl([a,b]), item: item(a) },
    parentB:  { label: `2IV ♂ (${lbl([c,d]).join('+')})`, ivs: lbl([c,d]), item: item(c) },
    offspring: { label: `4IV ♀ (${lbl([a,b,c,d]).join('+')})`, ivs: lbl([a,b,c,d]) },
  });
  steps.push({
    step: 4, title: `Build 1IV Parent (${STAT_LABELS[e]})`,
    parentA:  { label: 'Wild ♀', ivs: [], item: item(e) },
    parentB:  { label: 'Wild ♂', ivs: [] },
    offspring: { label: `1IV ♂ (${STAT_LABELS[e]})`, ivs: lbl([e]) },
  });
  steps.push({
    step: 5, title: 'Combine → 5IV Target',
    parentA:  { label: `4IV ♀ (${lbl([a,b,c,d]).join('+')})`, ivs: lbl([a,b,c,d]), item: item(a) },
    parentB:  { label: `1IV ♂ (${STAT_LABELS[e]})`,            ivs: lbl([e]),       item: item(e) },
    offspring: { label: '5IV Target', ivs: lbl(ivs) },
    note: needsNature ? 'Use Everstone on the parent with the correct nature.' : undefined,
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
        slug:       p.slug,
        name:       p.title,
        pokemon_id: p.metadata?.pokemon_id ?? null,
        types:      p.metadata?.types ?? [],
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
          {animUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={animUrl} alt={value.name} className="w-14 h-14 object-contain" />
          )}
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
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search Pokémon…"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
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

// ── IVBadge ───────────────────────────────────────────────────────────────────

function IVBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
      active ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-gray-700 text-gray-500'
    }`}>
      {label}
    </span>
  );
}

// ── ChainCard ─────────────────────────────────────────────────────────────────

function ChainCard({ step }: { step: ChainStep }) {
  const ParentBox = ({ p, side }: { p: ChainParent; side: 'A' | 'B' }) => (
    <div className={`flex-1 bg-gray-800 rounded-xl p-3 border ${p.isDitto ? 'border-purple-500/30' : 'border-gray-700'}`}>
      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
        Parent {side}{p.isDitto ? ' (Ditto)' : ''}
      </div>
      <div className={`text-xs font-semibold mb-2 ${p.isDitto ? 'text-purple-400' : 'text-gray-200'}`}>
        {p.label}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {STAT_KEYS.map(k => (
          <IVBadge key={k} label={STAT_LABELS[k]} active={p.ivs.includes(STAT_LABELS[k])} />
        ))}
        {p.isDitto && !p.ivs.some(iv => !STAT_KEYS.map(k => STAT_LABELS[k]).includes(iv)) && (
          <span className="text-[10px] text-purple-400">all 31</span>
        )}
      </div>
      {p.item && (
        <div className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-0.5 inline-block">
          🎒 {p.item}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold flex items-center justify-center shrink-0">
          {step.step}
        </span>
        <span className="font-semibold text-white text-sm">{step.title}</span>
      </div>

      <div className="flex items-start gap-2">
        <ParentBox p={step.parentA} side="A" />
        <div className="flex flex-col items-center justify-center pt-6 shrink-0">
          <span className="text-gray-600 text-lg">×</span>
        </div>
        <ParentBox p={step.parentB} side="B" />
      </div>

      {/* Arrow */}
      <div className="flex justify-center my-2">
        <div className="flex flex-col items-center gap-0.5">
          <div className="text-green-500 text-lg">↓</div>
        </div>
      </div>

      {/* Offspring */}
      <div className="bg-green-950/30 border border-green-500/20 rounded-xl p-3">
        <div className="text-[10px] text-green-500 uppercase tracking-widest mb-1">Offspring</div>
        <div className="text-sm font-semibold text-green-300 mb-2">{step.offspring.label}</div>
        <div className="flex flex-wrap gap-1">
          {STAT_KEYS.map(k => (
            <IVBadge key={k} label={STAT_LABELS[k]} active={step.offspring.ivs.includes(STAT_LABELS[k])} />
          ))}
        </div>
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
  const [ownedItems,       setOwnedItems]       = useState<Set<string>>(new Set());
  const [everstoneOwned,   setEverstoneOwned]   = useState(false);

  function toggleIV(k: StatKey) {
    setTargetIVs(prev =>
      prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]
    );
  }

  function toggleItem(name: string) {
    setOwnedItems(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  const ivCount = Math.min(targetIVs.length, 5); // cap at 5 for cost table

  // Power items needed for target IVs
  const powerItemsNeeded = targetIVs.map(k => ({ key: k, ...POWER_ITEMS[k] }));
  const powerItemsToBuy  = powerItemsNeeded.filter(i => !ownedItems.has(i.name));
  const needsEverstone   = needsNature;
  const everCost         = (needsEverstone && !everstoneOwned) ? EVERSTONE_PRICE : 0;
  const itemCost         = powerItemsToBuy.length * ITEM_PRICE + everCost;

  const baseCosts        = ivCount > 0 ? COSTS[needsNature ? 'withNature' : 'noNature'][ivCount] : null;
  const totalMin         = baseCosts ? baseCosts.min + itemCost : 0;
  const totalTyp         = baseCosts ? baseCosts.typ + itemCost : 0;
  const totalMax         = baseCosts ? baseCosts.max + itemCost : 0;

  const chain = buildChain(targetIVs, has6IVDitto, needsNature);

  // Dynamic tips
  const tips: string[] = [];
  if (!has6IVDitto && ivCount >= 4) tips.push('Having a 6IV Ditto reduces cost by ~40% and shortens the chain significantly.');
  if (ivCount === 5) tips.push('Breeding 5IVs is very expensive — consider if 4IVs is sufficient for your use case.');
  if (ivCount >= 4 && !needsNature) tips.push('For PvP, most builds also need a specific nature. Factor that in.');
  if (targetIVs.includes('hp') && targetIVs.includes('defense') && targetIVs.includes('special_defense') && ivCount <= 3) {
    tips.push('For Capture teams, 3IVs in HP/DEF/SpDEF is usually enough — no need to go further.');
  }
  if (needsNature) tips.push('Use Everstone on the parent with the desired nature to guarantee it 100% of the time.');
  if (isShiny)     tips.push('Shiny breeding requires both parents to be Shiny. This significantly increases cost and difficulty.');
  if (hasHiddenAbility) tips.push('Hidden Ability is only passed if the female parent has it. Plan your breeding chain accordingly.');
  if (ivCount <= 2 && !has6IVDitto) tips.push('Low IV counts are cheap — you can often find 1-2IV parents in the wild or GTS for free.');

  const dittoSavings = baseCosts
    ? Math.round((baseCosts.typ - (COSTS[needsNature ? 'withNature' : 'noNature'][ivCount]?.typ ?? baseCosts.typ)) * 0.4)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-1">Breeding Calculator</h1>
          <p className="text-gray-500 text-sm">PokéMMO rules — 3 IVs direct, 3 IVs averaged, Power Items force IV slots.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column: Target + Items ── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Section 1: Target Pokémon */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="font-extrabold text-base text-green-400 mb-4">① Target Pokémon</h2>

              <PokemonSearch value={pokemon} onSelect={setPokemon} />

              {/* IV checkboxes */}
              <div className="mt-4">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">IVs to breed (31)</div>
                <div className="grid grid-cols-3 gap-2">
                  {STAT_KEYS.map(k => (
                    <button
                      key={k}
                      onClick={() => toggleIV(k)}
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
                {targetIVs.length > 5 && (
                  <p className="text-xs text-orange-400 mt-2">⚠ Cost table covers up to 5IVs — 6IV costs are extrapolated.</p>
                )}
              </div>

              {/* Nature */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Nature Required?</span>
                  <button
                    onClick={() => setNeedsNature(p => !p)}
                    className={`relative h-5 w-9 rounded-full border-2 transition-colors ${needsNature ? 'bg-green-500 border-green-500' : 'bg-gray-700 border-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${needsNature ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {needsNature && (
                  <div className="space-y-2">
                    <select
                      value={selectedNature}
                      onChange={e => setSelectedNature(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                    >
                      {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <p className="text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1">
                      Use Everstone on the parent with this nature.
                    </p>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="mt-4 space-y-2">
                {[
                  { label: 'Hidden Ability needed', val: hasHiddenAbility, set: setHasHiddenAbility },
                  { label: 'Shiny (both parents must be shiny)', val: isShiny, set: setIsShiny },
                ].map(({ label, val, set }) => (
                  <label key={label} className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-gray-400">{label}</span>
                    <button
                      onClick={() => set(p => !p)}
                      className={`relative h-5 w-9 rounded-full border-2 transition-colors shrink-0 ${val ? 'bg-green-500 border-green-500' : 'bg-gray-700 border-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${val ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                ))}
              </div>

              {/* 6IV Ditto */}
              <div className="mt-4 p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-purple-300">I have a 6IV Ditto</div>
                    <div className="text-[11px] text-purple-500 mt-0.5">Shortens chain by ~40%</div>
                  </div>
                  <button
                    onClick={() => setHas6IVDitto(p => !p)}
                    className={`relative h-5 w-9 rounded-full border-2 transition-colors shrink-0 ${has6IVDitto ? 'bg-purple-500 border-purple-500' : 'bg-gray-700 border-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${has6IVDitto ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              </div>
            </div>

            {/* Section 2: Items */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="font-extrabold text-base text-yellow-400 mb-4">② Items Needed</h2>

              {powerItemsNeeded.length === 0 && (
                <p className="text-gray-600 text-sm">Select target IVs to see required items.</p>
              )}

              <div className="space-y-2">
                {powerItemsNeeded.map(({ key, name }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={ownedItems.has(name)}
                      onChange={() => toggleItem(name)}
                      className="accent-yellow-500 w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${ownedItems.has(name) ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                        {name}
                      </span>
                      <span className="ml-2 text-[11px] text-gray-600">({STAT_LABELS[key]})</span>
                    </div>
                    <span className={`text-xs font-mono shrink-0 ${ownedItems.has(name) ? 'text-gray-700' : 'text-yellow-500'}`}>
                      {ownedItems.has(name) ? 'owned' : `${(ITEM_PRICE / 1000).toFixed(0)}K ₽`}
                    </span>
                  </label>
                ))}

                {needsNature && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={everstoneOwned}
                      onChange={() => setEverstoneOwned(p => !p)}
                      className="accent-yellow-500 w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${everstoneOwned ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                        Everstone
                      </span>
                    </div>
                    <span className={`text-xs font-mono shrink-0 ${everstoneOwned ? 'text-gray-700' : 'text-yellow-500'}`}>
                      {everstoneOwned ? 'owned' : '5K ₽'}
                    </span>
                  </label>
                )}
              </div>

              {itemCost > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Item cost to buy</span>
                  <span className="text-sm font-bold text-yellow-400">{fmt(itemCost)}</span>
                </div>
              )}
            </div>

            {/* Section 4: Cost Estimate */}
            {ivCount > 0 && baseCosts && (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h2 className="font-extrabold text-base text-blue-400 mb-4">④ Cost Estimate</h2>

                {/* Base breeding cost */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Base breeding ({ivCount}IV{needsNature ? ' + nature' : ''})</span>
                    <span className="text-gray-400">
                      {fmt(baseCosts.min)} – {fmt(baseCosts.max)}
                    </span>
                  </div>
                  {powerItemsToBuy.length > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Power Items ({powerItemsToBuy.length}×)</span>
                      <span className="text-gray-400">{fmt(powerItemsToBuy.length * ITEM_PRICE)}</span>
                    </div>
                  )}
                  {needsEverstone && !everstoneOwned && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Everstone</span>
                      <span className="text-gray-400">{fmt(EVERSTONE_PRICE)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Daycare fees (est.)</span>
                    <span className="text-gray-400">~5K ₽ / attempt</span>
                  </div>
                  {isShiny && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Shiny parents cost</span>
                      <span className="text-orange-400">varies widely</span>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-800 pt-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Min',  value: totalMin, color: 'text-green-400',  bg: 'bg-green-950/30 border-green-500/20' },
                      { label: 'Typ',  value: totalTyp, color: 'text-yellow-400', bg: 'bg-yellow-950/30 border-yellow-500/20' },
                      { label: 'Max',  value: totalMax, color: 'text-red-400',    bg: 'bg-red-950/30 border-red-500/20' },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`rounded-xl p-2 border ${bg} text-center`}>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
                        <div className={`text-sm font-extrabold mt-0.5 ${color}`}>{fmt(value)}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-600 text-center">
                    Typical cost: <span className={`font-bold ${costColor(totalTyp)}`}>{fmt(totalTyp)}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: Chain + Tips ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Section 3: Breeding Chain */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-base text-white">③ Breeding Chain</h2>
                {chain.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-lg">
                    {chain.length} step{chain.length !== 1 ? 's' : ''}
                    {has6IVDitto ? ' (with 6IV Ditto)' : ''}
                  </span>
                )}
              </div>

              {ivCount === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <div className="text-4xl mb-2">🥚</div>
                  <div className="text-sm">Select target IVs to see the breeding chain</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {chain.map(step => <ChainCard key={step.step} step={step} />)}

                  {/* Nature note at end */}
                  {needsNature && (
                    <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
                      <span className="font-bold">Nature:</span> Use Everstone on the <span className="text-white">{selectedNature}</span> parent
                      in the final breeding step to guarantee the nature 100%.
                    </div>
                  )}

                  {/* Shiny note */}
                  {isShiny && (
                    <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300">
                      <span className="font-bold">✨ Shiny:</span> All parents in the chain must be Shiny.
                      Shiny Pokémon can only breed with other Shinies in PokéMMO.
                    </div>
                  )}

                  {/* Hidden Ability note */}
                  {hasHiddenAbility && (
                    <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300">
                      <span className="font-bold">HA:</span> Ensure the female parent in the final step has the Hidden Ability.
                      HA is only passed through the female line.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 5: Tips */}
            {tips.length > 0 && (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h2 className="font-extrabold text-base text-orange-400 mb-3">⑤ Tips</h2>
                <ul className="space-y-2">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-orange-400 shrink-0 mt-0.5">💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rules reference */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="font-extrabold text-sm text-gray-500 mb-3 uppercase tracking-widest">PokéMMO Breeding Rules</h2>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li className="flex gap-2"><span className="text-green-400 shrink-0">→</span><span>3 IVs are inherited <strong className="text-gray-400">directly</strong> (unchanged) from one parent each</span></li>
                <li className="flex gap-2"><span className="text-blue-400 shrink-0">→</span><span>3 IVs are <strong className="text-gray-400">averaged</strong> from both parents (rounded down)</span></li>
                <li className="flex gap-2"><span className="text-yellow-400 shrink-0">→</span><span><strong className="text-gray-400">Power Items</strong> force a specific IV into a direct slot (one item per parent)</span></li>
                <li className="flex gap-2"><span className="text-purple-400 shrink-0">→</span><span><strong className="text-gray-400">Everstone</strong> guarantees nature passes at 100%</span></li>
                <li className="flex gap-2"><span className="text-pink-400 shrink-0">→</span><span>Hidden Ability only passes if the <strong className="text-gray-400">female parent</strong> has it</span></li>
                <li className="flex gap-2"><span className="text-yellow-300 shrink-0">→</span><span>Shiny Pokémon can <strong className="text-gray-400">only breed with other Shinies</strong></span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
