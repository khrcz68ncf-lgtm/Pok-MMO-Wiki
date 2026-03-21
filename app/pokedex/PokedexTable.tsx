'use client';

import { useState } from 'react';
import Link from 'next/link';
import TypeBadge from '@/app/components/TypeBadge';
import { ALL_TYPES } from '@/lib/type-chart';

type PokemonRow = {
  title: string;
  slug: string;
  metadata: Record<string, any>;
};

function formatNo(id: number): string {
  return '#' + String(id).padStart(3, '0');
}

function statTotal(stats: Record<string, number>): number {
  return (
    (stats?.hp ?? 0) +
    (stats?.attack ?? 0) +
    (stats?.defense ?? 0) +
    (stats?.special_attack ?? 0) +
    (stats?.special_defense ?? 0) +
    (stats?.speed ?? 0)
  );
}

function totalColor(total: number): string {
  if (total >= 500) return 'text-green-400';
  if (total >= 400) return 'text-yellow-400';
  return 'text-red-400';
}

export default function PokedexTable({ pokemon }: { pokemon: PokemonRow[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = pokemon.filter((p) => {
    const name = p.title.toLowerCase();
    const types: string[] = p.metadata?.types ?? [];
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesType = typeFilter === '' || types.map(t => t.toLowerCase()).includes(typeFilter.toLowerCase());
    return matchesSearch && matchesType;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search Pokémon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm rounded-xl bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-400 transition-colors"
        >
          <option value="">All Types</option>
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">No.</th>
              <th className="px-4 py-3 text-left">Sprite</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Type(s)</th>
              <th className="px-4 py-3 text-right">HP</th>
              <th className="px-4 py-3 text-right">ATK</th>
              <th className="px-4 py-3 text-right">DEF</th>
              <th className="px-4 py-3 text-right">SpATK</th>
              <th className="px-4 py-3 text-right">SpDEF</th>
              <th className="px-4 py-3 text-right">SPE</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const meta = p.metadata;
              const stats = meta?.stats ?? {};
              const types: string[] = meta?.types ?? [];
              const total = statTotal(stats);
              return (
                <tr
                  key={p.slug}
                  className={i % 2 === 0 ? 'bg-gray-900/30' : ''}
                >
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs whitespace-nowrap">
                    {formatNo(meta.pokemon_id)}
                  </td>
                  <td className="px-4 py-2.5">
                    {meta?.sprites?.front ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={meta.sprites.front}
                        alt={p.title}
                        width={40}
                        height={40}
                        className="w-10 h-10"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-800 rounded" />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/wiki/${p.slug}`}
                      className="font-medium text-white hover:text-red-400 transition-colors capitalize"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {types.map((t) => (
                        <TypeBadge key={t} type={t} className="h-5" />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{stats.hp ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{stats.attack ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{stats.defense ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{stats.special_attack ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{stats.special_defense ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{stats.speed ?? '—'}</td>
                  <td className={`px-4 py-2.5 text-right font-bold ${totalColor(total)}`}>
                    {total}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                  No Pokémon match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
