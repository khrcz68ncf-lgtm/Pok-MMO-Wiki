import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarkdownContent from './MarkdownContent';
import PokemonTemplate from './PokemonTemplate';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: page, error } = await supabase
    .from('pages')
    .select('title, content, category, updated_at, template_type, metadata')
    .eq('slug', slug)
    .single();

  if (error || !page) notFound();

  const updatedAt = new Date(page.updated_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const isPokemon = page.template_type === 'pokemon';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Wiki', href: '/wiki' },
          { label: page.title },
        ]} />

        {isPokemon ? (
          // ── Pokémon template ──────────────────────────────────────────────
          <PokemonTemplate page={page as any} />
        ) : (
          // ── Free markdown template ────────────────────────────────────────
          <div className="flex gap-10">
            <main className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight">{page.title}</h1>
                {page.category && (
                  <span className="rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-sm font-medium text-red-400">
                    {page.category}
                  </span>
                )}
              </div>
              <div className="prose-invert">
                <MarkdownContent content={page.content} />
              </div>
              <section className="mt-16 border-t border-gray-800 pt-10">
                <h2 className="text-2xl font-semibold mb-4">Community Updates</h2>
                <p className="text-gray-500 text-sm">No community updates yet.</p>
              </section>
            </main>

            <aside className="w-56 shrink-0 hidden lg:block">
              <div className="sticky top-8 rounded-xl bg-gray-900 border border-gray-800 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                  Page Info
                </h3>
                <div className="text-sm text-gray-400">
                  <p className="text-gray-500 text-xs mb-1">Last updated</p>
                  <p className="text-gray-200 font-medium">{updatedAt}</p>
                </div>
                {page.category && (
                  <div className="mt-4 text-sm text-gray-400">
                    <p className="text-gray-500 text-xs mb-1">Category</p>
                    <Link
                      href={`/wiki?category=${page.category.toLowerCase()}`}
                      className="text-gray-200 font-medium hover:text-red-400 transition-colors"
                    >
                      {page.category}
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
