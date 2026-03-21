export default function Home() {
  const categories = [
    { name: 'Starters', icon: '🌱', description: 'Choose your starter Pokémon and begin your journey.' },
    { name: 'Moves', icon: '⚡', description: 'Browse all moves, their power, accuracy, and effects.' },
    { name: 'Items', icon: '🎒', description: 'Find every item, berry, and held item in the game.' },
    { name: 'Farming', icon: '💰', description: 'Guides for grinding money, items, and experience.' },
    { name: 'Guides', icon: '📖', description: 'In-depth walkthroughs for every region and mechanic.' },
    { name: 'PvP', icon: '⚔️', description: 'Competitive builds, tier lists, and battle strategies.' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-red-400">PokéMMO Wiki</span>
          <div className="flex gap-8 text-sm text-gray-300">
            {['Home', 'Wiki', 'Guides', 'Community'].map((item) => (
              <a
                key={item}
                href="#"
                className="hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-6 py-24 flex flex-col items-center text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          PokéMMO Wiki
        </h1>
        <p className="text-gray-400 text-lg mb-10">
          Your community-driven guide to everything PokéMMO.
        </p>

        {/* Search */}
        <div className="w-full max-w-xl flex gap-2">
          <input
            type="text"
            placeholder="Search Pokémon, moves, items..."
            className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors"
          />
          <button className="rounded-lg bg-red-500 hover:bg-red-600 px-5 py-3 font-semibold transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-xl font-semibold text-gray-300 mb-6">Browse Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className="group rounded-xl bg-gray-900 border border-gray-800 p-6 hover:border-red-500 hover:bg-gray-800 transition-all"
            >
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="text-lg font-semibold mb-1 group-hover:text-red-400 transition-colors">
                {cat.name}
              </h3>
              <p className="text-sm text-gray-400">{cat.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
