import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

export default function SwarmsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="text-6xl mb-6">🔥</div>
        <h1 className="text-3xl font-extrabold mb-3">Swarms</h1>
        <p className="text-gray-400 mb-8">Daily swarm locations and Pokémon. Coming soon.</p>
        <Link href="/" className="rounded-lg bg-red-500 hover:bg-red-600 px-5 py-2.5 font-semibold transition-colors text-sm">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
