import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';

type GuideCard = {
  title: string;
  href: string;
  desc?: string;
};

type GuideSection = {
  title: string;
  cards: GuideCard[];
};

const sections: GuideSection[] = [
  {
    title: 'Money Making',
    cards: [
      { title: 'Berry Farming',  href: '/berries',              desc: 'Full berry guide, yields & harvest calculator' },
      { title: 'Boss Fights',    href: '/wiki/boss-fights',     desc: 'Coming soon' },
      { title: 'Item Flipping',  href: '/wiki/item-flipping',   desc: 'Coming soon' },
    ],
  },
  {
    title: 'PvP',
    cards: [
      { title: 'Tier List',            href: '/pvp',                        desc: 'Community-maintained PvP tier list' },
      { title: 'Teambuilding Guide',   href: '/wiki/teambuilding-guide',    desc: 'Coming soon' },
      { title: 'Common Sets',          href: '/wiki/common-sets',           desc: 'Coming soon' },
    ],
  },
  {
    title: 'Quests',
    cards: [
      { title: 'Main Story',    href: '/wiki/main-story',    desc: 'Coming soon' },
      { title: 'Side Quests',   href: '/wiki/side-quests',   desc: 'Coming soon' },
      { title: 'Daily Quests',  href: '/wiki/daily-quests',  desc: 'Coming soon' },
    ],
  },
  {
    title: 'Breeding',
    cards: [
      { title: 'Breeding Calculator', href: '/breeding-calculator',   desc: 'IV chains, costs and power items' },
      { title: 'EV Training',         href: '/wiki/ev-training',      desc: 'Coming soon' },
      { title: 'Egg Moves',           href: '/wiki/egg-moves',        desc: 'Coming soon' },
    ],
  },
  {
    title: 'EV Training',
    cards: [
      { title: 'EV Spots',     href: '/wiki/ev-spots',     desc: 'Coming soon' },
      { title: 'EV Items',     href: '/wiki/ev-items',     desc: 'Coming soon' },
      { title: 'EV Resetting', href: '/wiki/ev-resetting', desc: 'Coming soon' },
    ],
  },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Guides' },
        ]} />

        <h1 className="text-3xl font-extrabold mb-2">Guides Hub</h1>
        <p className="text-gray-400 text-sm mb-10">Community guides for all aspects of PokéMMO.</p>

        <div className="flex flex-col gap-12">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold mb-4 text-gray-200">{section.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.cards.map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group rounded-xl bg-gray-900 border border-gray-800 p-5 hover:border-gray-600 transition-all"
                  >
                    <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-600">{card.desc ?? 'Coming soon'}</p>
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
