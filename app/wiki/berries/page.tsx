'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Berry = {
  name_fr:     string;
  name_en:     string;
  growth_time: number;
  min_yield:   number;
  max_yield:   number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GROWTH_BADGE: Record<number, string> = {
  16: 'bg-green-900/60  text-green-400  border-green-700/50',
  20: 'bg-blue-900/60   text-blue-400   border-blue-700/50',
  42: 'bg-yellow-900/60 text-yellow-400 border-yellow-700/50',
  44: 'bg-orange-900/60 text-orange-400 border-orange-700/50',
  67: 'bg-red-900/60    text-red-400    border-red-700/50',
};

const GROWTH_TIMES = [16, 20, 42, 44, 67];

function berryImg(nameEn: string): string {
  const base = nameEn.toLowerCase().replace(/\s+/g, '-');
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${base}-berry.png`;
}

function toSlug(nameEn: string): string {
  return nameEn.toLowerCase().replace(/\s+/g, '-');
}

// ─── Berry card ───────────────────────────────────────────────────────────────

function BerryCard({ berry }: { berry: Berry }) {
  const badge  = GROWTH_BADGE[berry.growth_time] ?? 'bg-gray-800 text-gray-400 border-gray-700';
  const imgUrl = berryImg(berry.name_en);
  const slug   = toSlug(berry.name_en);

  return (
    <Link
      href={`/wiki/${slug}-berry`}
      className="group flex flex-col items-center gap-2 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-600 hover:bg-gray-800/60 p-4 transition-all text-center"
    >
      {/* Sprite */}
      <div className="w-14 h-14 flex items-center justify-center bg-gray-800/60 rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          alt={berry.name_en}
          className="w-12 h-12 object-contain"
          style={{ imageRendering: 'pixelated' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* Names */}
      <div>
        <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors leading-tight">
          {berry.name_en} Berry
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{berry.name_fr}</p>
      </div>

      {/* Growth time badge */}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge}`}>
        {berry.growth_time}h
      </span>

      {/* Yield */}
      <p className="text-[10px] text-gray-500">
        Yield: <span className="text-gray-400">{berry.min_yield}–{berry.max_yield}</span>
      </p>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BerriesWikiPage() {
  const [berries,    setBerries]    = useState<Berry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [growthFilter, setGrowthFilter] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('berries')
      .select('name_fr, name_en, growth_time, min_yield, max_yield')
      .order('name_en', { ascending: true })
      .then(({ data }) => {
        setBerries(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = berries.filter(b => {
    const q = search.toLowerCase();
    const matchName = !q || b.name_en.toLowerCase().includes(q) || b.name_fr.toLowerCase().includes(q);
    const matchTime = growthFilter === null || b.growth_time === growthFilter;
    return matchName && matchTime;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-800">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(168,85,247,0.08),transparent)]" />

        <div className="relative mx-auto max-w-4xl px-6 py-14 text-center">
          <nav className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-8">
            <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/wiki" className="hover:text-gray-400 transition-colors">Wiki</Link>
            <span>/</span>
            <span className="text-gray-500">Berries</span>
          </nav>

          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🫐</span>
            <h1 className="text-4xl font-extrabold tracking-tight">Berries</h1>
          </div>
          <p className="text-gray-400 mb-6">
            All berries available in PokéMMO — grow times, yields, and more.
          </p>

          <Link
            href="/berries"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-5 py-2.5 text-sm font-semibold text-purple-300 transition-all"
          >
            🧮 Berry Yield Calculator →
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search berries..."
          className="flex-1 rounded-xl bg-gray-800/80 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors"
        />

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setGrowthFilter(null)}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all ${
              growthFilter === null
                ? 'bg-gray-700 border-gray-500 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            All times
          </button>
          {GROWTH_TIMES.map(t => {
            const badge = GROWTH_BADGE[t];
            return (
              <button
                key={t}
                onClick={() => setGrowthFilter(growthFilter === t ? null : t)}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all ${
                  growthFilter === t ? badge : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {t}h
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-xs text-gray-600 mb-4">{filtered.length} berries</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {filtered.map(b => (
                <BerryCard key={b.name_en} berry={b} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-16 text-center">
            <p className="text-gray-500">No berries match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
