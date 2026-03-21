import { requireAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DeleteButton from '../DeleteButton';
import Breadcrumb from '@/app/components/Breadcrumb';

async function createCategoryAction(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const parent_id = formData.get('parent_id') as string | null;
  const description = formData.get('description') as string;

  await supabase.from('categories').insert({
    name,
    slug,
    parent_id: parent_id || null,
    description: description || null,
  });

  redirect('/admin/categories');
}

async function deleteCategoryAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await supabase.from('categories').delete().eq('id', id);
  redirect('/admin/categories');
}

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
};

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, description')
    .order('name', { ascending: true });

  const categoryMap = new Map<string, string>(
    (categories ?? []).map((c: Category) => [c.id, c.name])
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Admin
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-gray-300 font-medium">Categories</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Admin', href: '/admin' },
          { label: 'Categories' },
        ]} />
        <h1 className="text-3xl font-extrabold mb-8">Categories</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Category list */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Existing categories
            </h2>
            {categories && categories.length > 0 ? (
              <div className="rounded-xl border border-gray-800 overflow-hidden">
                {(categories as Category[]).map((cat, i) => (
                  <div
                    key={cat.id}
                    className={`flex items-start gap-4 px-5 py-4 border-b border-gray-800 last:border-0 ${
                      i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{cat.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        slug: <span className="font-mono text-gray-400">{cat.slug}</span>
                        {cat.parent_id && (
                          <span className="ml-3">
                            parent: <span className="text-gray-400">{categoryMap.get(cat.parent_id) ?? cat.parent_id}</span>
                          </span>
                        )}
                      </p>
                      {cat.description && (
                        <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                      )}
                    </div>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={cat.id} />
                      <DeleteButton confirmMessage={`Delete category "${cat.name}"?`} />
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500 text-sm">
                No categories yet.
              </div>
            )}
          </div>

          {/* Create form */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
              New category
            </h2>
            <form
              action={createCategoryAction}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Kanto Pokémon"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-red-400 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Slug *</label>
                <input
                  name="slug"
                  required
                  placeholder="e.g. kanto-pokemon"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-red-400 transition-colors text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Parent category</label>
                <select
                  name="parent_id"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white focus:outline-none focus:border-red-400 transition-colors text-sm"
                >
                  <option value="">— None (top-level) —</option>
                  {(categories as Category[] | null)?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Optional short description..."
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-red-400 transition-colors text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                Create category
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
