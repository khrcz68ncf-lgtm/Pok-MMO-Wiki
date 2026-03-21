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

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Wiki', href: '/wiki' },
  { label: 'Guides', href: '/guides' },
  { label: 'Community', href: '/community' },
];

export default async function WikiIndex({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category, search } = await searchParams;

  const categoryFilter = typeof category === 'string' ? category : undefined;
  const searchFilter = typeof search === 'string' ? search : undefined;

  let query = supabase
    .from('pages')
    .select('title, category, slug')
    .order('title', { ascending: true });

  if (categoryFilter) {
    query = query.ilike('category', categoryFilter);
  }
  if (searchFilter) {
    query = query.ilike('title', `%${searchFilter}%`);
  }

  const { data: pages } = await query;

  const activeFilter = categoryFilter
    ? `Category: ${categoryFilter}`
    : searchFilter
    ? `Search: "${searchFilter}"`
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-red-400">PokéMMO Wiki</Link>
          <div className="flex gap-8 text-sm text-gray-300">
            {navLinks.map(({ label, href }) => (
              <Link key={label} href={href} className="hover:text-white transition-colors">
                {label}
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

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Wiki</h1>
          <p className="text-gray-400">Browse all community-contributed pages.</p>
        </div>

        {/* Active filter banner */}
        {activeFilter && (
          <div className="flex items-center gap-3 mb-6 rounded-lg bg-gray-900 border border-gray-800 px-4 py-3">
            <span className="text-sm text-gray-400">Filtering by:</span>
            <span className="text-sm font-medium text-white">{activeFilter}</span>
            <Link
              href="/wiki"
              className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear ✕
            </Link>
          </div>
        )}

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
            <p className="text-gray-500">
              {activeFilter ? 'No pages match this filter.' : 'No pages found. Check back soon.'}
            </p>
            {activeFilter && (
              <Link href="/wiki" className="mt-3 inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
                Browse all pages
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
