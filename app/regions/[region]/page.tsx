import { supabase } from '@/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import MarkdownContent from '@/app/wiki/[slug]/MarkdownContent';

const VALID_REGIONS = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova'];

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;

  const regionName = region.charAt(0).toUpperCase() + region.slice(1);

  if (!VALID_REGIONS.includes(region.toLowerCase())) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="text-3xl font-extrabold mb-3">Region Not Found</h1>
          <p className="text-gray-400 mb-8">That region does not exist in PokéMMO.</p>
          <Link href="/regions" className="text-red-400 hover:text-red-300 transition-colors text-sm">
            ← Back to Regions
          </Link>
        </div>
      </div>
    );
  }

  const { data: page } = await supabase
    .from('pages')
    .select('title, slug, content, updated_at')
    .eq('slug', region.toLowerCase())
    .maybeSingle();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/regions" className="hover:text-gray-400 transition-colors">Regions</Link>
          <span>/</span>
          <span className="text-gray-500">{regionName}</span>
        </nav>

        <h1 className="text-4xl font-extrabold mb-6">{regionName}</h1>

        {page ? (
          <>
            <MarkdownContent content={page.content} />

            {/* Cities & Routes placeholder */}
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-4">Cities &amp; Routes</h2>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-8 text-center">
                <p className="text-gray-500 text-sm">
                  Cities and routes for {regionName} are coming soon.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-12 text-center">
            <p className="text-gray-400 mb-2">No wiki page for {regionName} yet.</p>
            <p className="text-gray-600 text-sm">Check back later or contribute to the wiki.</p>

            {/* Cities & Routes placeholder */}
            <div className="mt-10">
              <h2 className="text-xl font-bold text-left mb-4">Cities &amp; Routes</h2>
              <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-8 text-center">
                <p className="text-gray-500 text-sm">
                  Cities and routes for {regionName} are coming soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
