'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import TypeBadge from '@/app/components/TypeBadge';
import { supabase } from '@/lib/supabase';
import { ALL_TYPES } from '@/lib/type-chart';

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  hp: number; attack: number; defense: number;
  special_attack: number; special_defense: number; speed: number;
};

type Pokemon = {
  title: string;
  slug: string;
  metadata: {
    pokemon_id: number;
    name: string;
    types: string[];
    stats: Stats;
    sprites: { front?: string };
  };
};

type SortKey = 'id' | 'name' | 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed' | 'total';
type TrackerFilter = 'all' | 'caught' | 'not_caught' | 'shiny';
type TrackerEntry = { caught: boolean; shiny: boolean };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function total(s: Stats) {
  return s.hp + s.attack + s.defense + s.special_attack + s.special_defense + s.speed;
}

function statColor(v: number) {
  if (v >= 90) return 'text-green-400';
  if (v >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function totalColor(v: number) {
  if (v >= 500) return 'text-green-400';
  if (v >= 400) return 'text-yellow-400';
  return 'text-red-400';
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'id',              label: 'ID'    },
  { value: 'name',            label: 'Name'  },
  { value: 'hp',              label: 'HP'    },
  { value: 'attack',          label: 'ATK'   },
  { value: 'defense',         label: 'DEF'   },
  { value: 'special_attack',  label: 'SpATK' },
  { value: 'special_defense', label: 'SpDEF' },
  { value: 'speed',           label: 'SPE'   },
  { value: 'total',           label: 'Total' },
];

const TRACKER_FILTERS: { value: TrackerFilter; label: string }[] = [
  { value: 'all',       label: 'Show all'   },
  { value: 'caught',    label: 'Caught'     },
  { value: 'not_caught', label: 'Not caught' },
  { value: 'shiny',     label: 'Shiny only' },
];

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function TrackerCheckbox({
  checked, onChange, variant,
}: {
  checked: boolean;
  onChange: () => void;
  variant: 'caught' | 'shiny';
}) {
  const color = variant === 'caught'
    ? (checked ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-green-500')
    : (checked ? 'bg-yellow-400 border-yellow-400' : 'border-gray-600 hover:border-yellow-400');

  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(); }}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${color}`}
      title={variant === 'caught' ? 'Mark as caught' : 'Mark as shiny'}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PokedexPage() {
  const [allPokemon, setAllPokemon]     = useState<Pokemon[]>([]);
  const [loading, setLoading]           = useState(true);
  const [user, setUser]                 = useState<{ id: string } | null | undefined>(undefined);
  const [tracker, setTracker]           = useState<Record<number, TrackerEntry>>({});
  const [trackerFilter, setTrackerFilter] = useState<TrackerFilter>('all');

  // Filters
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sortKey,    setSortKey]    = useState<SortKey>('id');
  const [asc,        setAsc]        = useState(true);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Pokémon once
  useEffect(() => {
    supabase
      .from('pages')
      .select('title, slug, metadata')
      .eq('template_type', 'pokemon')
      .not('metadata', 'is', null)
      .then(({ data }) => {
        const rows = (data ?? [] as Pokemon[])
          .filter((p: Pokemon) => p.metadata?.pokemon_id && p.metadata?.stats)
          .sort((a: Pokemon, b: Pokemon) => a.metadata.pokemon_id - b.metadata.pokemon_id);
        setAllPokemon(rows as Pokemon[]);
        setLoading(false);
      });
  }, []);

  // Load tracker when user is known
  useEffect(() => {
    if (!user) { setTracker({}); return; }
    supabase
      .from('pokedex_tracker')
      .select('pokemon_id, caught, shiny')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const map: Record<number, TrackerEntry> = {};
        (data ?? []).forEach(r => { map[r.pokemon_id] = { caught: r.caught, shiny: r.shiny }; });
        setTracker(map);
      });
  }, [user]);

  async function toggleTracker(pokemonId: number, field: 'caught' | 'shiny') {
    if (!user) return;
    const current = tracker[pokemonId] ?? { caught: false, shiny: false };
    const updated  = { ...current, [field]: !current[field] };
    setTracker(prev => ({ ...prev, [pokemonId]: updated }));
    await supabase.from('pokedex_tracker').upsert(
      { user_id: user.id, pokemon_id: pokemonId, ...updated, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,pokemon_id' },
    );
  }

  // Progress counts
  const caughtCount = useMemo(() => Object.values(tracker).filter(e => e.caught).length, [tracker]);
  const shinyCount  = useMemo(() => Object.values(tracker).filter(e => e.shiny).length,  [tracker]);
  const dexTotal    = allPokemon.length || 649;

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = allPokemon;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => (p.metadata.name || p.title).toLowerCase().includes(q));
    }

    if (typeFilter.length > 0) {
      list = list.filter(p => typeFilter.every(t => p.metadata.types?.includes(t)));
    }

    if (trackerFilter === 'caught')    list = list.filter(p => tracker[p.metadata.pokemon_id]?.caught);
    if (trackerFilter === 'not_caught') list = list.filter(p => !tracker[p.metadata.pokemon_id]?.caught);
    if (trackerFilter === 'shiny')     list = list.filter(p => tracker[p.metadata.pokemon_id]?.shiny);

    list = [...list].sort((a, b) => {
      const sa = a.metadata.stats;
      const sb = b.metadata.stats;
      let diff = 0;
      switch (sortKey) {
        case 'id':    diff = a.metadata.pokemon_id - b.metadata.pokemon_id; break;
        case 'name':  diff = (a.metadata.name || a.title).localeCompare(b.metadata.name || b.title); break;
        case 'total': diff = total(sa) - total(sb); break;
        default:      diff = (sa[sortKey as keyof Stats] ?? 0) - (sb[sortKey as keyof Stats] ?? 0);
      }
      return asc ? diff : -diff;
    });

    return list;
  }, [allPokemon, search, typeFilter, sortKey, asc, tracker, trackerFilter]);

  function toggleType(t: string) {
    setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function reset() {
    setSearch(''); setTypeFilter([]); setSortKey('id'); setAsc(true); setTrackerFilter('all');
  }

  const inputCls = 'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors';
  const colCount = user ? 13 : 11;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Pokédex' }]} />

        <h1 className="text-3xl font-extrabold mb-1">Pokédex</h1>
        <p className="text-gray-400 text-sm mb-6">
          {loading ? 'Loading…' : `${allPokemon.length} Pokémon available in PokéMMO`}
        </p>

        {/* ── Progress bars (logged in) ───────────────────────────────────── */}
        {user && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Caught */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Caught</span>
                <span className="text-sm font-bold text-green-400">{caughtCount} <span className="text-gray-600 font-normal">/ {dexTotal}</span></span>
              </div>
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${dexTotal > 0 ? (caughtCount / dexTotal) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1.5">{dexTotal > 0 ? ((caughtCount / dexTotal) * 100).toFixed(1) : 0}% complete</p>
            </div>

            {/* Shiny */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Shiny</span>
                <span className="text-sm font-bold text-yellow-400">{shinyCount} <span className="text-gray-600 font-normal">/ {dexTotal}</span></span>
              </div>
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                  style={{ width: `${dexTotal > 0 ? (shinyCount / dexTotal) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1.5">{dexTotal > 0 ? ((shinyCount / dexTotal) * 100).toFixed(1) : 0}% complete</p>
            </div>
          </div>
        )}

        {/* ── Not logged in CTA ───────────────────────────────────────────── */}
        {user === null && (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 px-5 py-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-semibold text-gray-300">Track your Pokédex progress</p>
                <p className="text-xs text-gray-500">Login to mark Pokémon as caught or shiny</p>
              </div>
            </div>
            <Link href="/auth/login" className="rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors shrink-0">
              Login
            </Link>
          </div>
        )}

        {/* ── Tracker filter buttons (logged in) ─────────────────────────── */}
        {user && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {TRACKER_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setTrackerFilter(f.value)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold border transition-all ${
                  trackerFilter === f.value
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-start mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className={`${inputCls} w-48`}
          />

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className={`${inputCls} cursor-pointer`}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setAsc(a => !a)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white hover:border-gray-500 transition-colors"
          >
            {asc ? '↑ Asc' : '↓ Desc'}
          </button>

          <button
            onClick={reset}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Type filter pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {ALL_TYPES.filter(t => t !== 'fairy').map((t) => (
            <div
              key={t}
              className={`rounded-lg border px-1.5 py-0.5 transition-all cursor-pointer ${
                typeFilter.includes(t)
                  ? 'border-red-400 ring-1 ring-red-400'
                  : 'border-transparent hover:border-gray-600'
              }`}
            >
              <TypeBadge type={t} className="h-5" clickable={false} onClick={() => toggleType(t)} />
            </div>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-gray-500 mb-3">
          Showing <span className="text-gray-300 font-semibold">{filtered.length}</span> / {allPokemon.length} Pokémon
        </p>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                {['No.', 'Sprite', 'Name', 'Type(s)', 'HP', 'ATK', 'DEF', 'SpATK', 'SpDEF', 'SPE', 'Total'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
                {user && (
                  <>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest text-green-600 whitespace-nowrap">
                      Caught
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest text-yellow-600 whitespace-nowrap">
                      Shiny
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    {Array.from({ length: colCount }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-500">
                    No Pokémon match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => {
                  const m    = p.metadata;
                  const s    = m.stats;
                  const num  = String(m.pokemon_id).padStart(3, '0');
                  const name = m.name
                    ? m.name.charAt(0).toUpperCase() + m.name.slice(1)
                    : p.title;
                  const tot  = total(s);
                  const entry = tracker[m.pokemon_id];

                  return (
                    <tr
                      key={p.slug}
                      className={`border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors ${i % 2 === 1 ? 'bg-gray-900/20' : ''} ${entry?.caught ? 'opacity-60' : ''}`}
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">#{num}</td>

                      <td className="px-3 py-2.5">
                        {m.sprites?.front ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.sprites.front} alt={name} className="w-10 h-10 object-contain" style={{ imageRendering: 'pixelated' }} />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-800" />
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        <Link href={`/wiki/${p.slug}`} className="font-medium text-gray-200 hover:text-red-400 capitalize transition-colors">
                          {name}
                        </Link>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {m.types?.map((t) => <TypeBadge key={t} type={t} className="h-5" />)}
                        </div>
                      </td>

                      {([s.hp, s.attack, s.defense, s.special_attack, s.special_defense, s.speed] as number[]).map((v, si) => (
                        <td key={si} className={`px-3 py-2.5 font-mono text-xs ${statColor(v)}`}>{v}</td>
                      ))}

                      <td className={`px-3 py-2.5 font-mono text-xs font-bold ${totalColor(tot)}`}>{tot}</td>

                      {user && (
                        <td className="px-3 py-2.5">
                          <TrackerCheckbox
                            checked={entry?.caught ?? false}
                            onChange={() => toggleTracker(m.pokemon_id, 'caught')}
                            variant="caught"
                          />
                        </td>
                      )}
                      {user && (
                        <td className="px-3 py-2.5">
                          <TrackerCheckbox
                            checked={entry?.shiny ?? false}
                            onChange={() => toggleTracker(m.pokemon_id, 'shiny')}
                            variant="shiny"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
