import { supabase } from '@/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import Link from 'next/link';

export default async function UpdatesPage() {
  const { data } = await supabase
    .from('pages')
    .select('title, slug, updated_at')
    .or('title.ilike.%changelog%,title.ilike.%update%')
    .order('updated_at', { ascending: false });

  const pages = data ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Updates' },
        ]} />

        <h1 className="text-3xl font-extrabold mb-2">PokéMMO Updates</h1>
        <p className="text-gray-400 text-sm mb-8">Changelogs and update notes for PokéMMO.</p>

        {pages.length > 0 ? (
          <div className="flex flex-col divide-y divide-gray-800">
            {pages.map((page) => (
              <div key={page.slug} className="flex items-start gap-6 py-4">
                <span className="text-xs text-gray-600 whitespace-nowrap pt-0.5 w-20 shrink-0">
                  {new Date(page.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <Link
                  href={`/wiki/${page.slug}`}
                  className="text-sm font-medium text-gray-300 hover:text-white capitalize transition-colors"
                >
                  {page.title}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-12 text-center">
            <p className="text-gray-500 mb-2">No update pages found.</p>
            <p className="text-gray-600 text-sm">Check back later for PokéMMO changelogs and patch notes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
