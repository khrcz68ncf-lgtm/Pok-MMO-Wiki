import Link from 'next/link';
import Navbar from './components/Navbar';
import HomeSearchBar from './components/HomeSearchBar';
import { supabase } from '@/lib/supabase';

const categories = [
  { name: 'Pokémon',         icon: '⚡', href: '/pokedex',             desc: 'Browse the full PokéMMO Pokédex',                    gradient: 'from-yellow-950/60 to-gray-900', glow: 'bg-yellow-500/10', accent: 'text-yellow-400' },
  { name: 'Regions',         icon: '🗺️', href: '/regions',             desc: 'Explore Kanto, Johto, Hoenn, Sinnoh and Unova',       gradient: 'from-green-950/60 to-gray-900',  glow: 'bg-green-500/10',  accent: 'text-green-400'  },
  { name: 'Guides',          icon: '📖', href: '/guides',              desc: 'In-depth guides for every aspect of the game',        gradient: 'from-purple-950/60 to-gray-900', glow: 'bg-purple-500/10', accent: 'text-purple-400' },
  { name: 'Money Making',    icon: '💰', href: '/guides/money-making', desc: 'Best methods to earn Pokéyen fast',                   gradient: 'from-amber-950/60 to-gray-900',  glow: 'bg-amber-500/10',  accent: 'text-amber-400'  },
  { name: 'PvP',             icon: '⚔️', href: '/pvp',                 desc: 'Competitive builds, tiers and strategies',            gradient: 'from-orange-950/60 to-gray-900', glow: 'bg-orange-500/10', accent: 'text-orange-400' },
  { name: 'PokéMMO Updates', icon: '📢', href: '/updates',             desc: 'Latest patch notes and changelogs',                   gradient: 'from-blue-950/60 to-gray-900',   glow: 'bg-blue-500/10',   accent: 'text-blue-400'   },
  { name: 'Team Builder',    icon: '🗂️', href: '/team-builder',        desc: 'Build and share your PokéMMO teams',                  gradient: 'from-cyan-950/60 to-gray-900',   glow: 'bg-cyan-500/10',   accent: 'text-cyan-400'   },
  { name: 'Swarms',          icon: '🔥', href: '/swarms',              desc: 'Daily swarm locations and Pokémon',                   gradient: 'from-red-950/60 to-gray-900',    glow: 'bg-red-500/10',    accent: 'text-red-400'    },
  { name: 'NPCs',            icon: '👤', href: '/npcs',                desc: 'NPC trainers, their teams and locations',             gradient: 'from-violet-950/60 to-gray-900', glow: 'bg-violet-500/10', accent: 'text-violet-400' },
];

export default async function Home() {
  const { data: recentPages } = await supabase
    .from('pages')
    .select('title, slug, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-800">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(239,68,68,0.08),transparent)]" />

        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-3">
            PokéMMO <span className="text-red-400">Wiki</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            The community-driven knowledge base for everything PokéMMO.
          </p>
          <HomeSearchBar />

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 text-sm mt-8">
            {[
              { value: '2,900+', label: 'pages'   },
              { value: 'Community', label: 'driven'  },
              { value: 'Always',    label: 'updated' },
            ].map(({ value, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="font-semibold text-white">{value}</span>
                <span className="text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-5">
          Browse Categories
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className={`group rounded-2xl bg-gradient-to-b ${cat.gradient} border border-gray-800 p-6 flex flex-col gap-3 hover:border-gray-600 transition-all`}
            >
              <div className={`w-12 h-12 rounded-xl ${cat.glow} flex items-center justify-center text-2xl shrink-0`}>
                {cat.icon}
              </div>
              <div>
                <h3 className={`text-base font-bold ${cat.accent}`}>{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recently updated strip */}
      {recentPages && recentPages.length > 0 && (
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
    </div>
  );
}
