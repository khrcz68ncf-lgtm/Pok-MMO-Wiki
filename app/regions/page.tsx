import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

const regions = [
  { name: 'Kanto',  slug: 'kanto',  color: 'from-red-950/60',    accent: 'text-red-400',    desc: 'The original region. Home to the first 151 Pokémon.' },
  { name: 'Johto',  slug: 'johto',  color: 'from-yellow-950/60', accent: 'text-yellow-400', desc: 'A land of tradition and mystery, home to ancient legends.' },
  { name: 'Hoenn',  slug: 'hoenn',  color: 'from-blue-950/60',   accent: 'text-blue-400',   desc: 'A tropical paradise of sea and land.' },
  { name: 'Sinnoh', slug: 'sinnoh', color: 'from-purple-950/60', accent: 'text-purple-400', desc: 'A northern region with a rich mythology.' },
  { name: 'Unova',  slug: 'unova',  color: 'from-gray-800/60',   accent: 'text-gray-300',   desc: 'A diverse metropolitan region far from the others.' },
];

export default function RegionsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-500">Regions</span>
        </nav>

        <h1 className="text-3xl font-extrabold mb-2">Regions</h1>
        <p className="text-gray-400 text-sm mb-8">Explore the five regions available in PokéMMO.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.map((region) => (
            <Link
              key={region.slug}
              href={`/regions/${region.slug}`}
              className={`group rounded-2xl bg-gradient-to-b ${region.color} to-gray-900 border border-gray-800 p-8 hover:border-gray-600 transition-all flex flex-col gap-3`}
            >
              <h2 className={`text-2xl font-extrabold ${region.accent}`}>{region.name}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{region.desc}</p>
              <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors mt-auto pt-2">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
