'use client';

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminEdit = {
  id:              string;
  page_slug:       string;
  page_title:      string;
  author_username: string;
  title:           string;
  content:         string;
  status:          'pending' | 'approved' | 'rejected';
  views:           number;
  votes_up:        number;
  votes_down:      number;
  created_at:      string;
};

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type SortCol      = 'votes_up' | 'votes_down' | 'created_at' | 'views';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  approved: 'bg-green-500/10  border-green-500/30  text-green-400',
  rejected: 'bg-red-500/10    border-red-500/30    text-red-400',
};

// ── View Modal ────────────────────────────────────────────────────────────────

function ViewModal({ edit, onClose }: { edit: AdminEdit; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-base font-bold text-white">{edit.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              by {edit.author_username} · on{' '}
              <Link href={`/wiki/${edit.page_slug}`} target="_blank" className="text-red-400 hover:underline">
                {edit.page_title}
              </Link>
              {' · '}{timeAgo(edit.created_at)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none ml-4">×</button>
        </div>
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="rounded-lg bg-gray-800/50 border border-gray-700 px-4 py-4 text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{edit.content}</ReactMarkdown>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CommunityUpdatesAdmin({
  initialEdits,
  onApply,
  onReject,
  onDelete,
}: {
  initialEdits: AdminEdit[];
  onApply:      (editId: string, editContent: string, pageSlug: string) => Promise<void>;
  onReject:     (editId: string) => Promise<void>;
  onDelete:     (editId: string) => Promise<void>;
}) {
  const [edits,        setEdits]        = useState<AdminEdit[]>(initialEdits);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pageFilter,   setPageFilter]   = useState('');
  const [search,       setSearch]       = useState('');
  const [sortCol,      setSortCol]      = useState<SortCol>('created_at');
  const [sortAsc,      setSortAsc]      = useState(false);
  const [viewEdit,     setViewEdit]     = useState<AdminEdit | null>(null);
  const [toast,        setToast]        = useState('');
  const [busy,         setBusy]         = useState<string | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const pending  = edits.filter(e => e.status === 'pending').length;
  const approved = edits.filter(e => e.status === 'approved').length;
  const rejected = edits.filter(e => e.status === 'rejected').length;

  // ── Unique pages for filter ────────────────────────────────────────────────

  const uniquePages = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of edits) map.set(e.page_slug, e.page_title);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [edits]);

  // ── Filtered + sorted ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let rows = edits;
    if (statusFilter !== 'all')   rows = rows.filter(e => e.status === statusFilter);
    if (pageFilter)               rows = rows.filter(e => e.page_slug === pageFilter);
    if (search.trim())            rows = rows.filter(e =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.author_username.toLowerCase().includes(search.toLowerCase())
    );
    return [...rows].sort((a, b) => {
      const av = a[sortCol] as number | string;
      const bv = b[sortCol] as number | string;
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortAsc ? cmp : -cmp;
    });
  }, [edits, statusFilter, pageFilter, search, sortCol, sortAsc]);

  // ── Sort toggle ────────────────────────────────────────────────────────────

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(false); }
  }

  function sortIndicator(col: SortCol) {
    if (sortCol !== col) return <span className="text-gray-700 ml-1">↕</span>;
    return <span className="text-red-400 ml-1">{sortAsc ? '↑' : '↓'}</span>;
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleApply(edit: AdminEdit) {
    setBusy(edit.id);
    try {
      await onApply(edit.id, edit.content, edit.page_slug);
      setEdits(prev => prev.map(e => e.id === edit.id ? { ...e, status: 'approved' } : e));
      showToast(`Applied "${edit.title}" to page.`);
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setBusy(null);
  }

  async function handleReject(edit: AdminEdit) {
    setBusy(edit.id);
    try {
      await onReject(edit.id);
      setEdits(prev => prev.map(e => e.id === edit.id ? { ...e, status: 'rejected' } : e));
      showToast(`Rejected "${edit.title}".`);
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setBusy(null);
  }

  async function handleDelete(edit: AdminEdit) {
    if (!window.confirm(`Are you sure you want to delete "${edit.title}"?`)) return;
    setBusy(edit.id);
    try {
      await onDelete(edit.id);
      setEdits(prev => prev.filter(e => e.id !== edit.id));
      showToast(`Deleted "${edit.title}".`);
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setBusy(null);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending',  value: pending,  color: 'text-yellow-400' },
          { label: 'Approved', value: approved, color: 'text-green-400'  },
          { label: 'Rejected', value: rejected, color: 'text-red-400'    },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Status */}
        <div className="flex gap-1">
          {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === f ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Page filter */}
        <select
          value={pageFilter}
          onChange={e => setPageFilter(e.target.value)}
          className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-red-400 transition-colors"
        >
          <option value="">All pages</option>
          {uniquePages.map(([slug, title]) => (
            <option key={slug} value={slug}>{title}</option>
          ))}
        </select>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or author…"
          className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-400 transition-colors min-w-[200px]"
        />

        <span className="text-xs text-gray-600 self-center ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Page</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Edit</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Author</th>
                <th
                  className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('created_at')}
                >
                  Submitted{sortIndicator('created_at')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('votes_up')}
                >
                  👍{sortIndicator('votes_up')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('votes_down')}
                >
                  👎{sortIndicator('votes_down')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('views')}
                >
                  Views{sortIndicator('views')}
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500 text-sm">
                    No community edits found.
                  </td>
                </tr>
              ) : (
                filtered.map((edit, i) => (
                  <tr key={edit.id} className={`border-b border-gray-800 last:border-0 ${i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/40'}`}>
                    <td className="px-4 py-3">
                      <Link href={`/wiki/${edit.page_slug}`} target="_blank" className="text-xs text-gray-400 hover:text-red-400 transition-colors truncate max-w-[120px] block">
                        {edit.page_title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-xs font-medium text-white truncate">{edit.title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{edit.author_username}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{timeAgo(edit.created_at)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-300 font-mono">{edit.votes_up}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-300 font-mono">{edit.votes_down}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-300 font-mono">{edit.views}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${STATUS_STYLES[edit.status]}`}>
                        {edit.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewEdit(edit)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View
                        </button>
                        {edit.status !== 'approved' && (
                          <button
                            onClick={() => handleApply(edit)}
                            disabled={busy === edit.id}
                            className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
                          >
                            {busy === edit.id ? '…' : 'Apply'}
                          </button>
                        )}
                        {edit.status !== 'rejected' && (
                          <button
                            onClick={() => handleReject(edit)}
                            disabled={busy === edit.id}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(edit)}
                          disabled={busy === edit.id}
                          className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                          title="Delete permanently"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View modal */}
      {viewEdit && <ViewModal edit={viewEdit} onClose={() => setViewEdit(null)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-gray-700 rounded-lg px-5 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
