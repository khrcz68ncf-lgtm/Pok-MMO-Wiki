'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/lib/supabase';
import TradeModal from './TradeModal';
import type { Trade, TradeTag } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function profitPerUnit(t: Trade): number {
  if (t.is_direct_trade) return (t.sell_price_per_unit ?? 0) - (t.buy_price_per_unit ?? 0);
  return (t.sell_price_per_unit ?? 0) - (t.buy_price_per_unit ?? 0) - (t.tax_per_unit ?? 0);
}

function totalProfit(t: Trade): number {
  return profitPerUnit(t) * (t.quantity ?? 1);
}

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtProfit(n: number) {
  return `${n >= 0 ? '+' : ''}${fmt(n)} ₽`;
}

function profitColor(n: number) {
  if (n > 0) return 'text-green-400';
  if (n < 0) return 'text-red-400';
  return 'text-gray-400';
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  listed:    'bg-blue-500/20   text-blue-400   border-blue-500/40',
  sold:      'bg-green-500/20  text-green-400  border-green-500/40',
  cancelled: 'bg-gray-700      text-gray-400   border-gray-600',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[status] ?? STATUS_COLORS.cancelled}`}>
      {status}
    </span>
  );
}

function TagPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium border"
      style={{ borderColor: color, backgroundColor: color + '25', color }}
    >
      {name}
    </span>
  );
}

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 px-4 py-3">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

type ChartPeriod = 'daily' | 'weekly' | 'monthly';

function periodKey(date: Date, period: ChartPeriod): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (period === 'monthly') return `${y}-${m}`;
  if (period === 'weekly') {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  }
  return `${y}-${m}-${d}`;
}

function ProfitChart({ trades }: { trades: Trade[] }) {
  const [period, setPeriod] = useState<ChartPeriod>('daily');

  const chartData = useMemo(() => {
    const sold = trades.filter((t) => t.status === 'sold' && t.sold_at);
    const map = new Map<string, number>();
    for (const t of sold) {
      const key = periodKey(new Date(t.sold_at!), period);
      map.set(key, (map.get(key) ?? 0) + totalProfit(t));
    }
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    let cumulative = 0;
    return sorted.map(([key, profit]) => {
      cumulative += profit;
      return { label: key, profit, cumulative };
    });
  }, [trades, period]);

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">Profit Over Time</p>
        <div className="flex gap-1">
          {(['daily', 'weekly', 'monthly'] as ChartPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                period === p ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
          No sold trades yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af', fontSize: 11 }}
              formatter={(v: unknown) => [`${fmt(Number(v))} ₽`, 'Cumulative']}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Tag Manager ─────────────────────────────────────────────────────────────

function TagManager({ tags, userId, onChanged }: { tags: TradeTag[]; userId: string; onChanged: () => void }) {
  const [newName,  setNewName]  = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [saving,   setSaving]   = useState(false);

  async function createTag() {
    if (!newName.trim()) return;
    setSaving(true);
    await supabase.from('trade_tags').insert({ user_id: userId, name: newName.trim(), color: newColor });
    setSaving(false);
    setNewName('');
    onChanged();
  }

  async function deleteTag(id: string) {
    await supabase.from('trade_tags').delete().eq('id', id);
    onChanged();
  }

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <p className="text-sm font-semibold text-white mb-4">Tag Manager</p>

      {/* Existing tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.length === 0 && <p className="text-xs text-gray-600">No tags yet.</p>}
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1.5 rounded-full border pl-2 pr-1 py-0.5" style={{ borderColor: tag.color, backgroundColor: tag.color + '20' }}>
            <span className="text-xs font-medium" style={{ color: tag.color }}>{tag.name}</span>
            <button
              onClick={() => deleteTag(tag.id)}
              className="w-4 h-4 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors text-xs"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Create new */}
      <div className="flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createTag()}
          placeholder="New tag name…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-400"
        />
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-9 h-9 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer p-0.5"
        />
        <button
          onClick={createTag}
          disabled={saving || !newName.trim()}
          className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-sm font-semibold text-white transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(trades: Trade[]) {
  const headers = ['ID', 'Item', 'Type', 'Qty', 'Buy/u', 'Sell/u', 'Tax/u', 'Profit/u', 'Total Profit', 'Status', 'Traded With', 'Notes', 'Created', 'Sold At'];
  const rows = trades.map((t) => [
    t.id, t.item_name, t.item_type, t.quantity,
    t.buy_price_per_unit ?? '', t.sell_price_per_unit ?? '', t.tax_per_unit ?? '',
    profitPerUnit(t), totalProfit(t),
    t.status, t.traded_with ?? '', t.notes ?? '',
    t.created_at, t.sold_at ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ────────────────────────────────────────────────────────────────

type SortKey = 'date' | 'profit' | 'name' | 'quantity';

export default function TradingPage() {
  const [userId,  setUserId]  = useState<string>('');
  const [trades,  setTrades]  = useState<Trade[]>([]);
  const [tags,    setTags]    = useState<TradeTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('all');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [tagFilter,   setTagFilter]   = useState('all');
  const [sortKey,     setSortKey]     = useState<SortKey>('date');
  const [sortAsc,     setSortAsc]     = useState(false);

  // Modal
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTrade,  setEditTrade]  = useState<Trade | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Tag manager visible
  const [showTags, setShowTags] = useState(false);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;
    setUserId(uid);

    const [{ data: tradeData }, { data: tagData }] = await Promise.all([
      supabase.from('trades').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('trade_tags').select('*').eq('user_id', uid).order('name'),
    ]);

    setTrades((tradeData ?? []) as Trade[]);
    setTags((tagData ?? []) as TradeTag[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const sold = trades.filter((t) => t.status === 'sold');
    const now  = new Date();

    function soldIn(from: Date) {
      return sold
        .filter((t) => t.sold_at && new Date(t.sold_at) >= from)
        .reduce((s, t) => s + totalProfit(t), 0);
    }

    const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week   = new Date(today); week.setDate(today.getDate() - today.getDay());
    const month  = new Date(now.getFullYear(), now.getMonth(), 1);
    const year   = new Date(now.getFullYear(), 0, 1);

    const allTime = sold.reduce((s, t) => s + totalProfit(t), 0);

    let best: { name: string; profit: number } | null = null;
    for (const t of sold) {
      const p = totalProfit(t);
      if (!best || p > best.profit) best = { name: t.item_name, profit: p };
    }

    const itemsTotal    = sold.filter((t) => t.item_type !== 'pokemon').reduce((s, t) => s + totalProfit(t), 0);
    const pokemonTotal  = sold.filter((t) => t.item_type === 'pokemon').reduce((s, t) => s + totalProfit(t), 0);

    return { allTime, today: soldIn(today), week: soldIn(week), month: soldIn(month), year: soldIn(year), best, itemsTotal, pokemonTotal };
  }, [trades]);

  // ── Filtered + sorted trades ──────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = trades;
    if (search.trim())        list = list.filter((t) => t.item_name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    if (typeFilter   !== 'all') list = list.filter((t) => t.item_type === typeFilter);
    if (tagFilter    !== 'all') list = list.filter((t) => t.custom_tags?.includes(tagFilter));

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'date')     diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortKey === 'profit')   diff = totalProfit(a) - totalProfit(b);
      if (sortKey === 'name')     diff = a.item_name.localeCompare(b.item_name);
      if (sortKey === 'quantity') diff = a.quantity - b.quantity;
      return sortAsc ? diff : -diff;
    });
  }, [trades, search, statusFilter, typeFilter, tagFilter, sortKey, sortAsc]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function deleteTrade(id: string) {
    await supabase.from('trades').delete().eq('id', id);
    setDeleteId(null);
    load();
  }

  async function duplicateTrade(t: Trade) {
    const { id: _id, created_at: _ca, updated_at: _ua, sold_at: _sa, ...rest } = t;
    await supabase.from('trades').insert({
      ...rest,
      item_name: `${t.item_name} (copy)`,
      status: 'pending',
      sold_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    load();
  }

  const inputCls = 'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors';
  const selectCls = inputCls + ' cursor-pointer';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Invest Manager</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track your trades and maximize your profits</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTags((s) => !s)}
              className="rounded-xl border border-gray-700 hover:border-gray-500 px-4 py-2 text-sm text-gray-400 hover:text-white transition-all"
            >
              🏷️ Tags
            </button>
            <button
              onClick={() => exportCSV(trades)}
              className="rounded-xl border border-gray-700 hover:border-gray-500 px-4 py-2 text-sm text-gray-400 hover:text-white transition-all"
            >
              ⬇️ Export CSV
            </button>
            <button
              onClick={() => { setEditTrade(null); setModalOpen(true); }}
              className="rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              + New Trade
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard label="All Time" value={fmtProfit(stats.allTime)} color={profitColor(stats.allTime)} />
          <StatCard label="Today"    value={fmtProfit(stats.today)}   color={profitColor(stats.today)}   />
          <StatCard label="This Week"  value={fmtProfit(stats.week)}  color={profitColor(stats.week)}    />
          <StatCard label="This Month" value={fmtProfit(stats.month)} color={profitColor(stats.month)}   />
          <StatCard label="This Year"  value={fmtProfit(stats.year)}  color={profitColor(stats.year)}    />
          <StatCard label="Items"      value={fmtProfit(stats.itemsTotal)}   color={profitColor(stats.itemsTotal)}   />
          <StatCard label="Pokémon"    value={fmtProfit(stats.pokemonTotal)} color={profitColor(stats.pokemonTotal)} />
          <StatCard
            label="Best Trade"
            value={stats.best ? `+${fmt(stats.best.profit)} ₽` : '—'}
            sub={stats.best?.name ?? undefined}
            color="text-green-400"
          />
        </div>

        {/* Chart */}
        <ProfitChart trades={trades} />

        {/* Tag manager */}
        {showTags && (
          <TagManager tags={tags} userId={userId} onChanged={load} />
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item…"
            className={`${inputCls} w-44`}
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="all">All Statuses</option>
            {['pending', 'listed', 'sold', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls}>
            <option value="all">All Types</option>
            <option value="item">Items</option>
            <option value="pokemon">Pokémon</option>
          </select>

          {tags.length > 0 && (
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className={selectCls}>
              <option value="all">All Tags</option>
              {tags.map((tag) => <option key={tag.id} value={tag.name}>{tag.name}</option>)}
            </select>
          )}

          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={selectCls}>
            <option value="date">Sort: Date</option>
            <option value="profit">Sort: Profit</option>
            <option value="name">Sort: Name</option>
            <option value="quantity">Sort: Qty</option>
          </select>

          <button
            onClick={() => setSortAsc((a) => !a)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white hover:border-gray-500 transition-colors"
          >
            {sortAsc ? '↑ Asc' : '↓ Desc'}
          </button>

          <p className="text-xs text-gray-500 ml-auto">
            {filtered.length} / {trades.length} trades
          </p>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                {['Item', 'Type', 'Tags', 'Qty', 'Buy/u', 'Sell/u', 'Tax/u', 'Profit/u', 'Total', 'Status', 'Traded With', 'Notes', ''].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    {Array.from({ length: 13 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-16 text-center text-gray-600">
                    {trades.length === 0 ? 'No trades yet. Click "New Trade" to get started.' : 'No trades match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => {
                  const pu    = profitPerUnit(t);
                  const tp    = totalProfit(t);
                  const allTags = [
                    ...(t.pokemon_tags ?? []),
                    ...(t.custom_tags  ?? []),
                  ];
                  const tagMap = new Map(tags.map((tg) => [tg.name, tg.color]));

                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors ${i % 2 === 1 ? 'bg-gray-900/20' : ''}`}
                    >
                      {/* Item */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {t.item_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.item_image_url} alt="" className="w-8 h-8 object-contain shrink-0" style={{ imageRendering: 'pixelated' }} />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-600 text-xs shrink-0">
                              {t.item_type === 'pokemon' ? '⚡' : '📦'}
                            </div>
                          )}
                          <span className="font-medium text-gray-200 capitalize">{t.item_name}</span>
                          {t.is_recurring && <span className="text-[10px] text-indigo-400">↻</span>}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-3 py-2.5 text-xs text-gray-500 capitalize">{t.item_type}</td>

                      {/* Tags */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {allTags.map((tag) => (
                            <TagPill
                              key={tag}
                              name={tag}
                              color={tagMap.get(tag) ?? '#6366f1'}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-300">{t.quantity}</td>

                      {/* Buy/u */}
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-400">
                        {t.buy_price_per_unit != null ? fmt(t.buy_price_per_unit) : '—'}
                      </td>

                      {/* Sell/u */}
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-400">
                        {t.sell_price_per_unit != null ? fmt(t.sell_price_per_unit) : '—'}
                      </td>

                      {/* Tax/u */}
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
                        {t.is_direct_trade ? <span className="text-gray-600">direct</span> : (t.tax_per_unit != null ? fmt(t.tax_per_unit) : '—')}
                      </td>

                      {/* Profit/u */}
                      <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${profitColor(pu)}`}>
                        {fmtProfit(pu)}
                      </td>

                      {/* Total */}
                      <td className={`px-3 py-2.5 font-mono text-xs font-bold ${profitColor(tp)}`}>
                        {fmtProfit(tp)}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>

                      {/* Traded with */}
                      <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[100px] truncate">
                        {t.traded_with ?? '—'}
                      </td>

                      {/* Notes */}
                      <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[120px] truncate" title={t.notes ?? undefined}>
                        {t.notes ?? '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setEditTrade(t); setModalOpen(true); }}
                            className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => duplicateTrade(t)}
                            className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            Dupe
                          </button>
                          <button
                            onClick={() => setDeleteId(t.id)}
                            className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-red-900/40 text-xs text-gray-400 hover:text-red-400 transition-colors"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-80 shadow-2xl">
            <p className="text-white font-semibold mb-2">Delete this trade?</p>
            <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-gray-700 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTrade(deleteId)}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-2 text-sm font-semibold text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade modal */}
      {modalOpen && (
        <TradeModal
          trade={editTrade}
          tags={tags}
          userId={userId}
          onClose={() => { setModalOpen(false); setEditTrade(null); }}
          onSaved={() => { setModalOpen(false); setEditTrade(null); load(); }}
        />
      )}
    </div>
  );
}
