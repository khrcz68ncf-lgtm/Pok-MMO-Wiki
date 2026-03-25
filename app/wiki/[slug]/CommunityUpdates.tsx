'use client';

/**
 * CommunityUpdates — requires these Supabase tables:
 *
 * community_edits (
 *   id              uuid primary key default gen_random_uuid(),
 *   page_slug       text not null,
 *   page_title      text not null,
 *   author_id       uuid,
 *   author_username text not null,
 *   title           text not null,
 *   content         text not null,
 *   status          text not null default 'pending',  -- pending | approved | rejected
 *   views           int  not null default 0,
 *   created_at      timestamptz not null default now()
 * );
 *
 * community_edit_votes (
 *   id         uuid primary key default gen_random_uuid(),
 *   edit_id    uuid references community_edits(id) on delete cascade,
 *   user_id    uuid not null,
 *   vote_type  text not null check (vote_type in ('up','down')),
 *   created_at timestamptz not null default now(),
 *   unique(edit_id, user_id)
 * );
 */

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

type CEdit = {
  id:               string;
  page_slug:        string;
  page_title:       string;
  author_id:        string;
  author_username:  string;
  title:            string;
  content:          string;
  status:           'pending' | 'approved' | 'rejected';
  views:            number;
  created_at:       string;
  votes_up:         number;
  votes_down:       number;
  user_vote?:       'up' | 'down' | null;
};

type SortBy = 'likes' | 'recent' | 'views';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  approved: 'bg-green-500/10  border-green-500/30  text-green-400',
  rejected: 'bg-red-500/10    border-red-500/30    text-red-400',
};

// ── Submit Modal ──────────────────────────────────────────────────────────────

function SubmitModal({
  onClose,
  onSubmit,
}: {
  onClose:  () => void;
  onSubmit: (title: string, content: string) => Promise<void>;
}) {
  const [title,    setTitle]   = useState('');
  const [content,  setContent] = useState('');
  const [preview,  setPreview] = useState(false);
  const [saving,   setSaving]  = useState(false);
  const [err,      setErr]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setErr('Title and content are required.'); return; }
    setSaving(true);
    setErr('');
    try { await onSubmit(title.trim(), content.trim()); }
    catch (ex: unknown) { setErr(ex instanceof Error ? ex.message : 'Failed to submit.'); setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">Suggest an Edit</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {err && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</p>
          )}

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Short description of the change…"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-widest">Content (Markdown)</label>
              <button
                type="button"
                onClick={() => setPreview(p => !p)}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                {preview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {preview ? (
              <div className="min-h-[200px] rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-gray-300 prose prose-invert prose-sm max-w-none leading-relaxed overflow-auto">
                <ReactMarkdown>{content || '_Nothing to preview yet._'}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={9}
                placeholder="Write your edit here using Markdown…"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors resize-none font-mono"
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-sm font-semibold transition-colors"
            >
              {saving ? 'Submitting…' : 'Submit Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Card ─────────────────────────────────────────────────────────────────

function EditCard({
  edit,
  userId,
  isAdmin,
  onVote,
  onApply,
  onReject,
}: {
  edit:     CEdit;
  userId:   string | null;
  isAdmin:  boolean;
  onVote:   (editId: string, voteType: 'up' | 'down') => void;
  onApply:  (edit: CEdit) => Promise<void>;
  onReject: (editId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [viewed,   setViewed]   = useState(false);
  const [applying, setApplying] = useState(false);

  function handleExpand() {
    setExpanded(e => !e);
    if (!expanded && !viewed) {
      setViewed(true);
      supabase
        .from('community_edits')
        .update({ views: edit.views + 1 })
        .eq('id', edit.id)
        .then(() => {/* fire and forget */});
    }
  }

  async function handleApply() {
    setApplying(true);
    await onApply(edit);
    setApplying(false);
  }

  const canVote = !!userId && userId !== edit.author_id;

  const borderColor = edit.status === 'approved' ? 'border-green-500/30' : edit.status === 'rejected' ? 'border-red-500/20' : 'border-gray-800';
  const leftBar     = edit.status === 'approved' ? 'bg-green-500' : edit.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-600';

  return (
    <div className={`rounded-xl border ${borderColor} bg-gray-900 overflow-hidden flex`}>
      {/* Status bar */}
      <div className={`w-1 shrink-0 ${leftBar}`} />

      {/* Applied banner + content wrapper */}
      <div className="flex-1 min-w-0">
      {edit.status === 'approved' && (
        <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-1.5 text-xs text-green-400 font-medium flex items-center gap-1.5">
          <span>✓</span> Applied to page
        </div>
      )}

      <div className="px-4 py-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white leading-snug">{edit.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              by <span className="text-gray-300">{edit.author_username}</span>
              {' · '}{timeAgo(edit.created_at)}
              {' · '}{edit.views} views
            </p>
          </div>
          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded border font-medium ${STATUS_STYLES[edit.status] ?? STATUS_STYLES.pending}`}>
            {edit.status}
          </span>
        </div>

        {/* Collapsed preview */}
        {!expanded && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {edit.content.slice(0, 160)}{edit.content.length > 160 ? '…' : ''}
          </p>
        )}

        {/* Expanded content */}
        {expanded && (
          <div className="mt-2 mb-4 rounded-lg bg-gray-800/50 border border-gray-800 px-4 py-3 text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{edit.content}</ReactMarkdown>
          </div>
        )}

        {/* Footer: show more + votes + admin */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExpand}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            {expanded ? '▲ Show less' : '▼ Show more'}
          </button>

          {/* Votes */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              disabled={!canVote}
              onClick={() => canVote && onVote(edit.id, 'up')}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                edit.user_vote === 'up'
                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              👍 {edit.votes_up}
            </button>
            <button
              disabled={!canVote}
              onClick={() => canVote && onVote(edit.id, 'down')}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                edit.user_vote === 'down'
                  ? 'bg-red-500/10 border-red-500/40 text-red-400'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              👎 {edit.votes_down}
            </button>
          </div>

          {/* Admin actions */}
          {isAdmin && edit.status !== 'approved' && (
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                disabled={applying}
                className="text-xs px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
              >
                {applying ? '…' : '✓ Apply'}
              </button>
              <button
                onClick={() => onReject(edit.id)}
                className="text-xs px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                ✕ Reject
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CommunityUpdates({
  pageSlug,
  pageTitle,
}: {
  pageSlug:  string;
  pageTitle: string;
}) {
  const [user,       setUser]       = useState<{ id: string } | null>(null);
  const [profile,    setProfile]    = useState<{ username: string; role: string } | null>(null);
  const [edits,      setEdits]      = useState<CEdit[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [sortBy,     setSortBy]     = useState<SortBy>('likes');
  const [showModal,  setShowModal]  = useState(false);
  const [toast,      setToast]      = useState('');

  // ── Auth ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles').select('username, role').eq('id', userId).single();
    setProfile(data);
  }

  // ── Fetch edits ────────────────────────────────────────────────────────────

  const fetchEdits = useCallback(async () => {
    setLoading(true);

    const { data: rows } = await supabase
      .from('community_edits')
      .select('*')
      .eq('page_slug', pageSlug)
      .neq('status', 'rejected')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setEdits([]); setLoading(false); return; }

    const ids = rows.map(r => r.id);
    const { data: votes } = await supabase
      .from('community_edit_votes')
      .select('edit_id, user_id, vote_type')
      .in('edit_id', ids);

    const userId = (await supabase.auth.getSession()).data.session?.user.id ?? null;

    const merged: CEdit[] = rows.map(r => {
      const rv = (votes ?? []).filter(v => v.edit_id === r.id);
      const up   = rv.filter(v => v.vote_type === 'up').length;
      const down = rv.filter(v => v.vote_type === 'down').length;
      const myV  = rv.find(v => v.user_id === userId);
      return { ...r, votes_up: up, votes_down: down, user_vote: myV?.vote_type ?? null };
    });

    setEdits(merged);
    setLoading(false);
  }, [pageSlug]);

  useEffect(() => { fetchEdits(); }, [fetchEdits]);

  // ── Sorted edits ───────────────────────────────────────────────────────────

  const sorted = [...edits].sort((a, b) => {
    if (sortBy === 'likes')  return (b.votes_up - b.votes_down) - (a.votes_up - a.votes_down);
    if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'views')  return b.views - a.views;
    return 0;
  });

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(title: string, content: string) {
    if (!user || !profile) throw new Error('Not logged in.');
    const { error } = await supabase.from('community_edits').insert({
      page_slug:       pageSlug,
      page_title:      pageTitle,
      author_id:       user.id,
      author_username: profile.username,
      title,
      content,
      status: 'pending',
    });
    if (error) throw new Error(error.message);
    setShowModal(false);
    showToast('Edit submitted! It will appear once reviewed.');
    fetchEdits();
  }

  // ── Vote ───────────────────────────────────────────────────────────────────

  async function handleVote(editId: string, voteType: 'up' | 'down') {
    if (!user) return;
    const edit = edits.find(e => e.id === editId);
    if (!edit) return;

    const same = edit.user_vote === voteType;

    // Optimistic update
    setEdits(prev => prev.map(e => {
      if (e.id !== editId) return e;
      let up   = e.votes_up;
      let down = e.votes_down;
      if (same) {
        // Toggle off
        if (voteType === 'up')   up   = Math.max(0, up - 1);
        else                     down = Math.max(0, down - 1);
        return { ...e, votes_up: up, votes_down: down, user_vote: null };
      } else {
        // Switch or new vote
        if (e.user_vote === 'up')   up   = Math.max(0, up - 1);
        if (e.user_vote === 'down') down = Math.max(0, down - 1);
        if (voteType === 'up')   up++;
        else                     down++;
        return { ...e, votes_up: up, votes_down: down, user_vote: voteType };
      }
    }));

    if (same) {
      await supabase.from('community_edit_votes')
        .delete().eq('edit_id', editId).eq('user_id', user.id);
    } else {
      await supabase.from('community_edit_votes').upsert(
        { edit_id: editId, user_id: user.id, vote_type: voteType },
        { onConflict: 'edit_id,user_id' }
      );
    }
  }

  // ── Admin: Apply ───────────────────────────────────────────────────────────

  async function handleApply(edit: CEdit) {
    // Archive current page content
    const { data: currentPage } = await supabase
      .from('pages').select('content, title').eq('slug', pageSlug).single();

    if (currentPage) {
      await supabase.from('page_archives').insert({
        page_slug:   pageSlug,
        title:       currentPage.title,
        content:     currentPage.content,
        archived_at: new Date().toISOString(),
      });
      await supabase.from('pages')
        .update({ content: edit.content, updated_at: new Date().toISOString() })
        .eq('slug', pageSlug);
    }

    await supabase.from('community_edits')
      .update({ status: 'approved' }).eq('id', edit.id);

    setEdits(prev => prev.map(e => e.id === edit.id ? { ...e, status: 'approved' } : e));
    showToast('Edit applied to page.');
  }

  // ── Admin: Reject ──────────────────────────────────────────────────────────

  async function handleReject(editId: string) {
    await supabase.from('community_edits')
      .update({ status: 'rejected' }).eq('id', editId);
    setEdits(prev => prev.filter(e => e.id !== editId));
    showToast('Edit rejected.');
  }

  // ── Toast ──────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  const isAdmin = profile?.role === 'admin';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="mt-16 border-t border-gray-800 pt-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2.5">
            <span className="text-xl">✏️</span>
            Community Edits
            {edits.length > 0 && (
              <span className="text-sm font-normal bg-gray-800 border border-gray-700 text-gray-400 rounded-full px-2 py-0.5 leading-none">
                {edits.length}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Player-submitted improvements to this page. Upvote edits you find accurate or helpful.
          </p>
        </div>

        {user ? (
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-sm font-medium text-white transition-colors flex items-center gap-2"
          >
            <span>✏️</span> Suggest an Edit
          </button>
        ) : (
          <p className="text-sm text-gray-500 shrink-0">
            <a href="/auth/login" className="text-red-400 hover:underline">Log in</a> to suggest an edit
          </p>
        )}
      </div>

      {/* Sort tabs */}
      {edits.length > 1 && (
        <div className="flex gap-1 mt-5 mb-4">
          {(['likes', 'recent', 'views'] as SortBy[]).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === s ? 'bg-gray-700 text-white border border-gray-600' : 'text-gray-500 hover:text-white'
              }`}
            >
              {s === 'likes' ? '👍 Most liked' : s === 'recent' ? '🕐 Most recent' : '👁 Most viewed'}
            </button>
          ))}
        </div>
      )}

      {/* Edit cards */}
      <div className="mt-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-10 text-center">
            <p className="text-2xl mb-3">📝</p>
            <p className="text-sm font-medium text-gray-300 mb-1">No community edits yet</p>
            <p className="text-xs text-gray-500 mb-4">
              Be the first to suggest an improvement to this page!
            </p>
            {!user && (
              <a href="/auth/login" className="inline-block text-xs text-red-400 hover:text-red-300 transition-colors">
                Log in to contribute →
              </a>
            )}
            {user && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-block text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Write the first edit →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(edit => (
              <EditCard
                key={edit.id}
                edit={edit}
                userId={user?.id ?? null}
                isAdmin={isAdmin}
                onVote={handleVote}
                onApply={handleApply}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit modal */}
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-gray-700 rounded-lg px-5 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </section>
  );
}
