import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

type GuideCard = {
  title: string;
  slug: string;
};

type GuideSection = {
  title: string;
  cards: GuideCard[];
};

const sections: GuideSection[] = [
  {
    title: 'Money Making',
    cards: [
      { title: 'Berry Farming',  slug: 'berry-farming'  },
      { title: 'Boss Fights',    slug: 'boss-fights'    },
      { title: 'Item Flipping',  slug: 'item-flipping'  },
    ],
  },
  {
    title: 'PvP',
    cards: [
      { title: 'Competitive Tiers',    slug: 'competitive-tiers'    },
      { title: 'Teambuilding Guide',   slug: 'teambuilding-guide'   },
      { title: 'Common Sets',          slug: 'common-sets'          },
    ],
  },
  {
    title: 'Quests',
    cards: [
      { title: 'Main Story',    slug: 'main-story'    },
      { title: 'Side Quests',   slug: 'side-quests'   },
      { title: 'Daily Quests',  slug: 'daily-quests'  },
    ],
  },
  {
    title: 'Breeding',
    cards: [
      { title: 'IV Breeding',  slug: 'iv-breeding'  },
      { title: 'EV Training',  slug: 'ev-training'  },
      { title: 'Egg Moves',    slug: 'egg-moves'    },
    ],
  },
  {
    title: 'EV Training',
    cards: [
      { title: 'EV Spots',     slug: 'ev-spots'     },
      { title: 'EV Items',     slug: 'ev-items'     },
      { title: 'EV Resetting', slug: 'ev-resetting' },
    ],
  },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-500">Guides</span>
        </nav>

        <h1 className="text-3xl font-extrabold mb-2">Guides Hub</h1>
        <p className="text-gray-400 text-sm mb-10">Community guides for all aspects of PokéMMO.</p>

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
