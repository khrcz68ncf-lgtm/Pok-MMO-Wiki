import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarkdownContent from './MarkdownContent';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Wiki', href: '/wiki' },
  { label: 'Guides', href: '/guides' },
  { label: 'Community', href: '/community' },
];

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: page, error } = await supabase
    .from('pages')
    .select('title, content, category, updated_at')
    .eq('slug', slug)
    .single();

  if (error || !page) {
    notFound();
  }

  const updatedAt = new Date(page.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-red-400">PokéMMO Wiki</Link>
          <div className="flex gap-8 text-sm text-gray-300">
            {navLinks.map(({ label, href }) => (
              <Link key={label} href={href} className="hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/wiki" className="hover:text-gray-300 transition-colors">Wiki</Link>
          <span>/</span>
          <span className="text-gray-300">{page.title}</span>
        </nav>

        <div className="flex gap-10">
          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Title + badge */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight">{page.title}</h1>
              {page.category && (
                <span className="rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-sm font-medium text-red-400">
                  {page.category}
                </span>
              )}
            </div>

            {/* Markdown body */}
            <div className="prose-invert">
              <MarkdownContent content={page.content} />
            </div>

            {/* Community Updates */}
            <section className="mt-16 border-t border-gray-800 pt-10">
              <h2 className="text-2xl font-semibold mb-4">Community Updates</h2>
              <p className="text-gray-500 text-sm">No community updates yet.</p>
            </section>
          </main>

          {/* Sidebar */}
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
      </div>
    </div>
  );
}
