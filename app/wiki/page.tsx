import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

// ─── Category definitions ─────────────────────────────────────────────────────

type CategoryDef = {
  title: string;
  icon: string;
  gradient: string;   // bg gradient classes
  glow: string;       // icon container bg
  accentText: string;
  subcategories: string[];
};

const CATEGORIES: CategoryDef[] = [
  {
    title: 'The Game',
    icon: '🎮',
    gradient: 'from-red-950/60 to-gray-900',
    glow: 'bg-red-500/10',
    accentText: 'text-red-400',
    subcategories: [
      'Getting Started', 'Regions', 'Pokémon', 'Items', 'Berries',
      'Crafting', 'Breeding', 'Trading', 'PvP', 'Gift Shop', 'Add-ons',
    ],
  },
  {
    title: 'Pokémon',
    icon: '⚡',
    gradient: 'from-yellow-950/60 to-gray-900',
    glow: 'bg-yellow-500/10',
    accentText: 'text-yellow-400',
    subcategories: [
      'Pokédex', 'Types', 'Phenomena', 'Alphas',
      'EV Training', 'Pickup', 'Breeding', 'Battle',
    ],
  },
  {
    title: 'Items',
    icon: '🎒',
    gradient: 'from-blue-950/60 to-gray-900',
    glow: 'bg-blue-500/10',
    accentText: 'text-blue-400',
    subcategories: [
      'Adventure', 'Vitamins', 'Berries', 'Seeds',
      'Battle', 'Crafting', 'Gift Shop',
    ],
  },
  {
    title: 'Guides',
    icon: '📖',
    gradient: 'from-purple-950/60 to-gray-900',
    glow: 'bg-purple-500/10',
    accentText: 'text-purple-400',
    subcategories: [
      'Player Guides Hub', 'Getting Started', 'Game Controls',
    ],
  },
  {
    title: 'Regions',
    icon: '🗺️',
    gradient: 'from-green-950/60 to-gray-900',
    glow: 'bg-green-500/10',
    accentText: 'text-green-400',
    subcategories: ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova'],
  },
  {
    title: 'PvP',
    icon: '⚔️',
    gradient: 'from-orange-950/60 to-gray-900',
    glow: 'bg-orange-500/10',
    accentText: 'text-orange-400',
    subcategories: ['Tiers', 'Team Building', 'Mechanics', 'Tournaments'],
  },
  {
    title: 'Farming',
    icon: '💰',
    gradient: 'from-amber-950/60 to-gray-900',
    glow: 'bg-amber-500/10',
    accentText: 'text-amber-400',
    subcategories: [
      'Money Farming', 'Item Farming', 'EV Farming', 'Experience Farming',
    ],
  },
  {
    title: 'News & Updates',
    icon: '📢',
    gradient: 'from-cyan-950/60 to-gray-900',
    glow: 'bg-cyan-500/10',
    accentText: 'text-cyan-400',
    subcategories: ['Latest Changes', 'Patch Notes', 'Events', 'Seasonal'],
  },
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({ cat }: { cat: CategoryDef }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-b ${cat.gradient} border border-gray-800 p-6 flex flex-col gap-5`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${cat.glow} flex items-center justify-center text-xl shrink-0`}>
          {cat.icon}
        </div>
        <h2 className={`text-base font-bold ${cat.accentText}`}>{cat.title}</h2>
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-2">
        {cat.subcategories.map((sub) => (
          <Link
            key={sub}
            href={`/wiki/${toSlug(sub)}`}
            className="rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 px-3 py-1 text-xs text-gray-300 hover:text-white transition-all"
          >
            {sub}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Search results ───────────────────────────────────────────────────────────

function SearchResults({
  pages,
  activeFilter,
}: {
  pages: { title: string; category: string | null; slug: string }[];
  activeFilter: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="flex items-center gap-3 mb-6 rounded-xl bg-gray-900 border border-gray-800 px-4 py-3">
        <span className="text-sm text-gray-400">Filtering by:</span>
        <span className="text-sm font-medium text-white">{activeFilter}</span>
        <Link href="/wiki" className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Clear ✕
        </Link>
      </div>

      {pages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <Link
              key={page.slug}
              href={`/wiki/${page.slug}`}
              className="group rounded-xl bg-gray-900 border border-gray-800 p-5 hover:border-red-500/50 hover:bg-gray-800/80 transition-all"
            >
              {page.category && (
                <span className="inline-block rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400 mb-3">
                  {page.category}
                </span>
              )}
              <p className="text-sm font-semibold group-hover:text-red-400 transition-colors capitalize">
                {page.title}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-16 text-center">
          <p className="text-gray-500 mb-3">No pages match this filter.</p>
          <Link href="/wiki" className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Back to wiki
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function WikiIndex({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category, search } = await searchParams;

  const categoryFilter = typeof category === 'string' ? category : undefined;
  const searchFilter   = typeof search   === 'string' ? search   : undefined;
  const isFiltered     = !!(categoryFilter || searchFilter);

  const [filteredResult, recentResult] = await Promise.all([
    isFiltered
      ? (() => {
          let q = supabase
            .from('pages')
            .select('title, category, slug')
            .order('title', { ascending: true });
          if (categoryFilter) q = q.ilike('category', categoryFilter);
          if (searchFilter)   q = q.ilike('title', `%${searchFilter}%`);
          return q;
        })()
      : Promise.resolve({ data: null }),
    supabase
      .from('pages')
      .select('title, slug, updated_at, category')
      .order('updated_at', { ascending: false })
      .limit(5),
  ]);

  const filteredPages = filteredResult.data ?? [];
  const recentPages   = recentResult.data   ?? [];

  const activeFilter = categoryFilter
    ? `Category: ${categoryFilter}`
    : searchFilter
    ? `Search: "${searchFilter}"`
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-800">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(239,68,68,0.08),transparent)]" />

        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-8">
            <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-500">Wiki</span>
          </nav>

          <h1 className="text-5xl font-extrabold tracking-tight mb-3">
            PokéMMO <span className="text-red-400">Wiki</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            The community-driven knowledge base for everything PokéMMO.
          </p>

          {/* Search bar */}
          <form method="GET" className="flex gap-2 max-w-xl mx-auto mb-8">
            <input
              name="search"
              defaultValue={searchFilter}
              type="text"
              placeholder="Search pages, Pokémon, moves, items..."
              autoFocus={isFiltered}
              className="flex-1 rounded-xl bg-gray-800/80 border border-gray-700 px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 text-sm transition-colors"
            />
            <button
              type="submit"
              className="rounded-xl bg-red-500 hover:bg-red-600 px-6 py-3 text-sm font-semibold transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 text-sm">
            {[
              { value: '2,900+', label: 'pages' },
              { value: 'Community', label: 'driven' },
              { value: 'Always', label: 'updated' },
            ].map(({ value, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="font-semibold text-white">{value}</span>
                <span className="text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isFiltered ? (
        <div className="pt-10">
          <SearchResults pages={filteredPages as any} activeFilter={activeFilter!} />
        </div>
      ) : (
        <>
          {/* Category grid */}
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => (
                <CategoryCard key={cat.title} cat={cat} />
              ))}
            </div>
          </div>

          {/* Recently Updated strip */}
          {recentPages.length > 0 && (
            <div className="border-t border-gray-800 bg-gray-900/40">
              <div className="mx-auto max-w-6xl px-6 py-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-5">
                  Recently Updated
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {recentPages.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/wiki/${p.slug}`}
                      className="group rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 px-4 py-3 transition-all"
                    >
                      <p className="text-sm font-medium text-gray-300 group-hover:text-white capitalize truncate mb-1 transition-colors">
                        {p.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(p.updated_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
