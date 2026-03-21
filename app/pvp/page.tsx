import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

type PvPCard = {
  title: string;
  slug: string;
};

type PvPSection = {
  title: string;
  cards: PvPCard[];
};

const sections: PvPSection[] = [
  {
    title: 'Tiers',
    cards: [
      { title: 'OU (Overused)',    slug: 'pvp-ou'         },
      { title: 'UU (Underused)',   slug: 'pvp-uu'         },
      { title: 'NU (Neverused)',   slug: 'pvp-nu'         },
    ],
  },
  {
    title: 'Team Building',
    cards: [
      { title: 'Team Building Guide',  slug: 'teambuilding-guide'   },
      { title: 'Common Sets',          slug: 'common-sets'          },
      { title: 'Cores & Synergy',      slug: 'cores-and-synergy'    },
    ],
  },
  {
    title: 'Mechanics',
    cards: [
      { title: 'Battle Mechanics',     slug: 'battle-mechanics'     },
      { title: 'Speed Tiers',          slug: 'speed-tiers'          },
      { title: 'Status Conditions',    slug: 'status-conditions'    },
    ],
  },
  {
    title: 'Tournaments',
    cards: [
      { title: 'Tournament Rules',     slug: 'tournament-rules'     },
      { title: 'Upcoming Events',      slug: 'pvp-events'           },
      { title: 'Past Champions',       slug: 'past-champions'       },
    ],
  },
];

export default function PvPPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-500">PvP</span>
        </nav>

        <h1 className="text-3xl font-extrabold mb-2">PvP Hub</h1>
        <p className="text-gray-400 text-sm mb-10">Everything you need to compete in PokéMMO PvP.</p>

        <div className="flex flex-col gap-12">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold mb-4 text-gray-200">{section.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.cards.map((card) => (
                  <Link
                    key={card.slug}
                    href={`/wiki/${card.slug}`}
                    className="group rounded-xl bg-gray-900 border border-gray-800 p-5 hover:border-gray-600 transition-all"
                  >
                    <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-600">Coming soon</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
