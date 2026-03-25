import { requireAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DeleteButton from './DeleteButton';
import Breadcrumb from '@/app/components/Breadcrumb';

async function logoutAction() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('ADMIN_SECRET');
  redirect('/admin/login');
}

async function deletePageAction(formData: FormData) {
  'use server';
  const slug = formData.get('slug') as string;
  await supabase.from('pages').delete().eq('slug', slug);
  redirect('/admin');
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await requireAdmin();

  const { q } = await searchParams;

  let query = supabase
    .from('pages')
    .select('title, category, slug, updated_at')
    .order('title', { ascending: true });

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  const { data: pages } = await query;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-red-400 font-bold">PokéMMO Wiki</Link>
            <span className="text-gray-600">/</span>
            <span className="text-sm text-gray-300 font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/community-updates"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Community Updates
            </Link>
            <Link
              href="/admin/categories"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Categories
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Admin' },
        ]} />
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold">Wiki Pages</h1>
          <span className="text-sm text-gray-500">{pages?.length ?? 0} pages</span>
        </div>

        {/* Search */}
        <form method="GET" className="mb-6 flex gap-2 max-w-md">
          <input
            name="q"
            defaultValue={q}
            type="text"
            placeholder="Search by title..."
            className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 text-sm transition-colors"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Search
          </button>
          {q && (
            <Link
              href="/admin"
              className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </Link>
          )}
        </form>

        {/* Table */}
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-gray-500 font-semibold">Title</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-gray-500 font-semibold">Category</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-gray-500 font-semibold">Last Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pages && pages.length > 0 ? (
                pages.map((page, i) => (
                  <tr
                    key={page.slug}
                    className={`border-b border-gray-800 last:border-0 ${i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/40'}`}
                  >
                    <td className="px-5 py-3.5 font-medium text-white">{page.title}</td>
                    <td className="px-5 py-3.5 text-gray-400">{page.category ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {page.updated_at
                        ? new Date(page.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/edit/${page.slug}`}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Edit
                        </Link>
                        <form action={deletePageAction}>
                          <input type="hidden" name="slug" value={page.slug} />
                          <DeleteButton confirmMessage={`Delete "${page.title}"?`} />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                    {q ? `No pages matching "${q}"` : 'No pages yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
