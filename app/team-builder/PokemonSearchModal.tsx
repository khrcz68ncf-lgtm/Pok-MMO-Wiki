'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Search } from 'lucide-react';

type SearchResult = {
  slug:        string;
  title:       string;
  pokemon_id?: number;
  types?:      string[];
  sprite_url?: string;
};

type Props = {
  onSelect: (r: SearchResult) => void;
  onClose:  () => void;
};

const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-gray-500', fire: 'bg-orange-500', water: 'bg-blue-500',
  electric: 'bg-yellow-400', grass: 'bg-green-500', ice: 'bg-cyan-400',
  fighting: 'bg-red-700', poison: 'bg-purple-500', ground: 'bg-yellow-600',
  flying: 'bg-indigo-400', psychic: 'bg-pink-500', bug: 'bg-lime-500',
  rock: 'bg-yellow-700', ghost: 'bg-purple-700', dragon: 'bg-indigo-700',
  dark: 'bg-gray-700', steel: 'bg-gray-400',
};

export default function PokemonSearchModal({ onSelect, onClose }: Props) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('pages')
        .select('slug, title, metadata')
        .eq('template_type', 'pokemon')
        .ilike('title', `%${q}%`)
        .limit(20);

      setResults((data ?? []).map(p => ({
        slug:       p.slug,
        title:      p.title,
        pokemon_id: p.metadata?.pokemon_id,
        types:      p.metadata?.types ?? [],
        sprite_url: p.metadata?.pokemon_id
          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${p.metadata.pokemon_id}.gif`
          : undefined,
      })));
      setLoading(false);
    }, 300);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <Search className="text-gray-400 shrink-0" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Pokémon…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
          />
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 p-2">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && results.length === 0 && query.trim() && (
            <p className="text-center text-gray-500 py-8 text-sm">No Pokémon found</p>
          )}
          {!loading && results.length === 0 && !query.trim() && (
            <p className="text-center text-gray-600 py-8 text-sm">Start typing to search</p>
          )}
          {results.map(r => (
            <button
              key={r.slug}
              onClick={() => onSelect(r)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 transition-colors text-left"
            >
              {r.sprite_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.sprite_url} alt={r.title} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-xl">?</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm">{r.title}</div>
                <div className="flex gap-1 mt-1">
                  {(r.types ?? []).map(t => (
                    <span key={t} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white ${TYPE_COLORS[t.toLowerCase()] ?? 'bg-gray-600'}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {r.pokemon_id && (
                <span className="text-gray-600 text-xs font-mono">#{String(r.pokemon_id).padStart(3, '0')}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
