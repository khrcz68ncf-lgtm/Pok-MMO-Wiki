import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import Link from 'next/link';

export default function TeamBuilderPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Team Builder' },
        ]} />
        <div className="text-6xl mb-6">🗂️</div>
        <h1 className="text-3xl font-extrabold mb-3">Team Builder</h1>
        <p className="text-gray-400 mb-8">Build and share your PokéMMO teams. Coming soon.</p>
        <Link href="/" className="rounded-lg bg-red-500 hover:bg-red-600 px-5 py-2.5 font-semibold transition-colors text-sm">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
