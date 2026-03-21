import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const categoryColors: Record<string, string> = {
  Starters: 'bg-green-500/20 text-green-400 border-green-500/40',
  Moves: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  Items: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  Farming: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  Guides: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  PvP: 'bg-red-500/20 text-red-400 border-red-500/40',
};

export default async function WikiIndex() {
  const { data: pages } = await supabase
    .from('pages')
    .select('title, category, slug')
    .order('title', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-red-400">PokéMMO Wiki</span>
          <div className="flex gap-8 text-sm text-gray-300">
            {['Home', 'Wiki', 'Guides', 'Community'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className="hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-300">Wiki</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Wiki</h1>
          <p className="text-gray-400">Browse all community-contributed pages.</p>
        </div>

        {pages && pages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => {
              const colorClass =
                categoryColors[page.category] ??
                'bg-gray-500/20 text-gray-400 border-gray-500/40';
              return (
                <Link
                  key={page.slug}
                  href={`/wiki/${page.slug}`}
                  className="group rounded-xl bg-gray-900 border border-gray-800 p-6 hover:border-red-500 hover:bg-gray-800 transition-all"
                >
                  {page.category && (
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium mb-3 ${colorClass}`}
                    >
                      {page.category}
                    </span>
                  )}
                  <h2 className="text-lg font-semibold group-hover:text-red-400 transition-colors">
                    {page.title}
                  </h2>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
            <p className="text-gray-500">No pages found. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
