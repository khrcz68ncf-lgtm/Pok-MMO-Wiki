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
  { value: 'id',            label: 'ID'    },
  { value: 'name',          label: 'Name'  },
  { value: 'hp',            label: 'HP'    },
  { value: 'attack',        label: 'ATK'   },
  { value: 'defense',       label: 'DEF'   },
  { value: 'special_attack',  label: 'SpATK' },
  { value: 'special_defense', label: 'SpDEF' },
  { value: 'speed',         label: 'SPE'   },
  { value: 'total',         label: 'Total' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PokedexPage() {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading]       = useState(true);

  // Filters
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sortKey,    setSortKey]    = useState<SortKey>('id');
  const [asc,        setAsc]        = useState(true);

  // Fetch once on mount
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

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = allPokemon;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const name = (p.metadata.name || p.title).toLowerCase();
        return name.includes(q);
      });
    }

    if (typeFilter.length > 0) {
      list = list.filter((p) =>
        typeFilter.every((t) => p.metadata.types?.includes(t))
      );
    }

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
  }, [allPokemon, search, typeFilter, sortKey, asc]);

  function toggleType(t: string) {
    setTypeFilter((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function reset() {
    setSearch('');
    setTypeFilter([]);
    setSortKey('id');
    setAsc(true);
  }

  const inputCls = 'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Pokédex' }]} />

        <h1 className="text-3xl font-extrabold mb-1">Pokédex</h1>
        <p className="text-gray-400 text-sm mb-6">
          {loading ? 'Loading…' : `${allPokemon.length} Pokémon available in PokéMMO`}
        </p>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-start mb-4">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className={`${inputCls} w-48`}
          />

          {/* Sort by */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className={`${inputCls} cursor-pointer`}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Asc/Desc toggle */}
          <button
            onClick={() => setAsc((a) => !a)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white hover:border-gray-500 transition-colors"
          >
            {asc ? '↑ Asc' : '↓ Desc'}
          </button>

          {/* Reset */}
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
                  <th
                    key={h}
                    className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
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

                  return (
                    <tr
                      key={p.slug}
                      className={`border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors ${i % 2 === 1 ? 'bg-gray-900/20' : ''}`}
                    >
                      {/* No. */}
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">#{num}</td>

                      {/* Sprite */}
                      <td className="px-3 py-2.5">
                        {m.sprites?.front ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.sprites.front}
                            alt={name}
                            className="w-10 h-10 object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-800" />
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/wiki/${p.slug}`}
                          className="font-medium text-gray-200 hover:text-red-400 capitalize transition-colors"
                        >
                          {name}
                        </Link>
                      </td>

                      {/* Types */}
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {m.types?.map((t) => (
                            <TypeBadge key={t} type={t} className="h-5" />
                          ))}
                        </div>
                      </td>

                      {/* Stats */}
                      {([
                        s.hp, s.attack, s.defense,
                        s.special_attack, s.special_defense, s.speed,
                      ] as number[]).map((v, si) => (
                        <td key={si} className={`px-3 py-2.5 font-mono text-xs ${statColor(v)}`}>
                          {v}
                        </td>
                      ))}

                      {/* Total */}
                      <td className={`px-3 py-2.5 font-mono text-xs font-bold ${totalColor(tot)}`}>
                        {tot}
                      </td>
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
