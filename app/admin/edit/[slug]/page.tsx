import { requireAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import EditPageClient from './EditPageClient';
import Breadcrumb from '@/app/components/Breadcrumb';

async function savePageAction(formData: FormData) {
  'use server';
  const originalSlug = formData.get('original_slug') as string;
  const title = formData.get('title') as string;
  const category = formData.get('category') as string;
  const category_id = formData.get('category_id') as string | null;
  const content = formData.get('content') as string;
  const pokemon_number = formData.get('pokemon_number') as string;
  const types = formData.get('types') as string;
  const hp = formData.get('hp') as string;
  const attack = formData.get('attack') as string;
  const defense = formData.get('defense') as string;
  const special_attack = formData.get('special_attack') as string;
  const special_defense = formData.get('special_defense') as string;
  const speed = formData.get('speed') as string;
  const sprite_url = formData.get('sprite_url') as string;

  // Fetch current version for archiving
  const { data: current } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', originalSlug)
    .single();

  if (current) {
    await supabase.from('page_archives').insert({
      page_slug: originalSlug,
      title: current.title,
      content: current.content,
      category: current.category,
      archived_at: new Date().toISOString(),
    });
  }

  const metadata = {
    pokemon_number: pokemon_number || null,
    types: types ? types.split(',').map((t) => t.trim()).filter(Boolean) : [],
    hp: hp ? Number(hp) : null,
    attack: attack ? Number(attack) : null,
    defense: defense ? Number(defense) : null,
    special_attack: special_attack ? Number(special_attack) : null,
    special_defense: special_defense ? Number(special_defense) : null,
    speed: speed ? Number(speed) : null,
    sprite_url: sprite_url || null,
  };

  await supabase
    .from('pages')
    .update({
      title,
      category,
      category_id: category_id || null,
      content,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', originalSlug);

  redirect(`/admin/edit/${originalSlug}?saved=1`);
}

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await requireAdmin();

  const { slug } = await params;
  const { saved } = await searchParams;

  const [{ data: page }, { data: categories }] = await Promise.all([
    supabase
      .from('pages')
      .select('title, content, category, category_id, updated_at, metadata')
      .eq('slug', slug)
      .single(),
    supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true }),
  ]);

  if (!page) notFound();

  const meta = (page.metadata as Record<string, unknown>) ?? {};

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Admin
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-sm text-gray-300 font-medium truncate max-w-xs">{page.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/wiki/${slug}`}
              target="_blank"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              View page ↗
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Admin', href: '/admin' },
          { label: 'Edit', href: '/admin' },
          { label: slug },
        ]} />
        {saved && (
          <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3">
            Page saved successfully.
          </div>
        )}

        <form action={savePageAction}>
          <input type="hidden" name="original_slug" value={slug} />

          {/* Top fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Title
              </label>
              <input
                name="title"
                defaultValue={page.title}
                required
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white focus:outline-none focus:border-red-400 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Category (text)
              </label>
              <input
                name="category"
                defaultValue={page.category ?? ''}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white focus:outline-none focus:border-red-400 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Category ID
              </label>
              <select
                name="category_id"
                defaultValue={page.category_id ?? ''}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white focus:outline-none focus:border-red-400 transition-colors text-sm"
              >
                <option value="">— None —</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Pokémon Metadata
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: 'pokemon_number', label: 'Pokémon #', placeholder: '001' },
                { name: 'types', label: 'Types (comma-sep)', placeholder: 'Fire, Flying' },
                { name: 'hp', label: 'HP', placeholder: '45' },
                { name: 'attack', label: 'Attack', placeholder: '49' },
                { name: 'defense', label: 'Defense', placeholder: '49' },
                { name: 'special_attack', label: 'Sp. Attack', placeholder: '65' },
                { name: 'special_defense', label: 'Sp. Defense', placeholder: '65' },
                { name: 'speed', label: 'Speed', placeholder: '45' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    name={name}
                    defaultValue={
                      name === 'types' && Array.isArray(meta[name])
                        ? (meta[name] as string[]).join(', ')
                        : (meta[name] as string) ?? ''
                    }
                    placeholder={placeholder}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-400 transition-colors text-sm"
                  />
                </div>
              ))}
              <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                <label className="block text-xs text-gray-500 mb-1">Sprite URL</label>
                <input
                  name="sprite_url"
                  defaultValue={(meta.sprite_url as string) ?? ''}
                  placeholder="https://..."
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-400 transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Split editor / preview */}
          <EditPageClient initialContent={page.content} />

          {/* Save */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-red-500 hover:bg-red-600 px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
