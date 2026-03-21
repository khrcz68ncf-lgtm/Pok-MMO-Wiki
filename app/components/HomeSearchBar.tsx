'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) router.push(`/wiki?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Pokémon, moves, items..."
        className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors"
      />
      <button
        type="submit"
        className="rounded-lg bg-red-500 hover:bg-red-600 px-5 py-3 font-semibold transition-colors"
      >
        Search
      </button>
    </form>
  );
}
