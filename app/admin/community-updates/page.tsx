import { requireAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import CommunityUpdatesAdmin, { type AdminEdit } from './CommunityUpdatesAdmin';

// ── Server Actions ────────────────────────────────────────────────────────────

async function applyEditAction(editId: string, editContent: string, pageSlug: string) {
  'use server';

  // Archive current page content
  const { data: currentPage } = await supabase
    .from('pages')
    .select('content, title')
    .eq('slug', pageSlug)
    .single();

  if (currentPage) {
    await supabase.from('page_archives').insert({
      page_slug:   pageSlug,
      title:       currentPage.title,
      content:     currentPage.content,
      archived_at: new Date().toISOString(),
    });
    await supabase.from('pages')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('slug', pageSlug);
  }

  await supabase.from('community_edits')
    .update({ status: 'approved' })
    .eq('id', editId);
}

async function rejectEditAction(editId: string) {
  'use server';
  await supabase.from('community_edits')
    .update({ status: 'rejected' })
    .eq('id', editId);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CommunityUpdatesAdminPage() {
  await requireAdmin();

  // Fetch all community edits
  const { data: rawEdits } = await supabase
    .from('community_edits')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch vote counts for all edits
  const editIds = (rawEdits ?? []).map(e => e.id);
  const { data: votes } = editIds.length > 0
    ? await supabase
        .from('community_edit_votes')
        .select('edit_id, vote_type')
        .in('edit_id', editIds)
    : { data: [] };

  const edits: AdminEdit[] = (rawEdits ?? []).map(r => {
    const rv   = (votes ?? []).filter(v => v.edit_id === r.id);
    const up   = rv.filter(v => v.vote_type === 'up').length;
    const down = rv.filter(v => v.vote_type === 'down').length;
    return { ...r, votes_up: up, votes_down: down };
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Admin
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-sm text-gray-300 font-medium">Community Updates</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-8">Community Updates</h1>

        <CommunityUpdatesAdmin
          initialEdits={edits}
          onApply={applyEditAction}
          onReject={rejectEditAction}
        />
      </div>
    </div>
  );
}
