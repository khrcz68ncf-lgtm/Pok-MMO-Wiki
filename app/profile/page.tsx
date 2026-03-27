'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/lib/supabase';
import type { Team, TeamPokemon } from '@/app/team-builder/types';
import type { Trade } from '@/app/trading/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = { username: string; role: string; created_at?: string };

type CommunityEdit = {
  id:              string;
  page_slug:       string;
  page_title:      string;
  title:           string;
  status:          string;
  created_at:      string;
};

type ShinySubmission = {
  id:           string;
  pokemon_name: string;
  pokemon_id:   number;
  method:       string;
  approved:     boolean;
  created_at:   string;
};

type TrackerEntry = { caught: boolean; shiny: boolean };

type Tab = 'pokedex' | 'teams' | 'contributions' | 'trades' | 'shinies';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-red-500 to-orange-500',
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-teal-500',
  'from-yellow-500 to-amber-500',
];

function avatarColor(username: string) {
  const i = username.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

function shinySprite(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${id}.gif`;
}

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  approved: 'bg-green-500/15  border-green-500/30  text-green-400',
  rejected: 'bg-red-500/15    border-red-500/30    text-red-400',
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 px-4 py-4 text-center">
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs font-semibold text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  const [user,    setUser]    = useState<{ id: string; created_at?: string } | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const [activeTab, setActiveTab] = useState<Tab>('pokedex');

  // Tab data
  const [tracker,       setTracker]       = useState<Record<number, TrackerEntry>>({});
  const [trackerLoaded, setTrackerLoaded] = useState(false);
  const [teams,         setTeams]         = useState<(Team & { team_pokemon?: TeamPokemon[] })[]>([]);
  const [teamsLoaded,   setTeamsLoaded]   = useState(false);
  const [edits,         setEdits]         = useState<CommunityEdit[]>([]);
  const [editsLoaded,   setEditsLoaded]   = useState(false);
  const [trades,        setTrades]        = useState<Trade[]>([]);
  const [tradesLoaded,  setTradesLoaded]  = useState(false);
  const [myShines,      setMyShines]      = useState<ShinySubmission[]>([]);
  const [shinesLoaded,  setShinesLoaded]  = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return; }
      setUser(session.user as { id: string; created_at?: string });
      supabase.from('profiles').select('username, role, created_at').eq('id', session.user.id).single()
        .then(({ data }) => { setProfile(data); if (data) setNewName(data.username); });
    });
  }, [router]);

  // Load tab data lazily
  useEffect(() => {
    if (!user) return;

    if (activeTab === 'pokedex' && !trackerLoaded) {
      supabase.from('pokedex_tracker').select('pokemon_id, caught, shiny').eq('user_id', user.id)
        .then(({ data }) => {
          const map: Record<number, TrackerEntry> = {};
          (data ?? []).forEach(r => { map[r.pokemon_id] = { caught: r.caught, shiny: r.shiny }; });
          setTracker(map);
          setTrackerLoaded(true);
        });
    }

    if (activeTab === 'teams' && !teamsLoaded) {
      supabase.from('teams').select('*, team_pokemon(*)').eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { setTeams((data as any) ?? []); setTeamsLoaded(true); });
    }

    if (activeTab === 'contributions' && !editsLoaded) {
      supabase.from('community_edits').select('id, page_slug, page_title, title, status, created_at')
        .eq('author_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => { setEdits(data ?? []); setEditsLoaded(true); });
    }

    if (activeTab === 'trades' && !tradesLoaded) {
      supabase.from('trades').select('*').eq('user_id', user.id)
        .then(({ data }) => { setTrades((data as Trade[]) ?? []); setTradesLoaded(true); });
    }

    if (activeTab === 'shinies' && !shinesLoaded) {
      supabase.from('shiny_submissions')
        .select('id, pokemon_name, pokemon_id, method, approved, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => { setMyShines(data ?? []); setShinesLoaded(true); });
    }
  }, [activeTab, user, trackerLoaded, teamsLoaded, editsLoaded, tradesLoaded, shinesLoaded]);

  async function saveUsername() {
    if (!user || !newName.trim()) return;
    const { error } = await supabase.from('profiles').update({ username: newName.trim() }).eq('id', user.id);
    if (error) { setSaveMsg('Error: ' + error.message); return; }
    setProfile(p => p ? { ...p, username: newName.trim() } : p);
    setEditing(false);
    setSaveMsg('Username updated!');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  // Derived stats
  const caughtCount = Object.values(tracker).filter(e => e.caught).length;
  const shinyCount  = Object.values(tracker).filter(e => e.shiny).length;
  const DEX_TOTAL   = 649;

  const completedTrades = trades.filter(t => t.status === 'completed');
  const totalProfit = completedTrades.reduce((sum, t) => {
    if (!t.sell_price_per_unit || !t.buy_price_per_unit) return sum;
    return sum + ((t.sell_price_per_unit - t.buy_price_per_unit - (t.tax_per_unit ?? 0)) * t.quantity);
  }, 0);
  const bestTrade = completedTrades.reduce<Trade | null>((best, t) => {
    if (!t.sell_price_per_unit || !t.buy_price_per_unit) return best;
    const profit = (t.sell_price_per_unit - t.buy_price_per_unit - (t.tax_per_unit ?? 0)) * t.quantity;
    if (!best || !best.sell_price_per_unit || !best.buy_price_per_unit) return t;
    const bestProfit = (best.sell_price_per_unit - best.buy_price_per_unit - (best.tax_per_unit ?? 0)) * best.quantity;
    return profit > bestProfit ? t : best;
  }, null);

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'pokedex',       label: 'Pokédex',       icon: '📋' },
    { key: 'teams',         label: 'My Teams',      icon: '🗂️' },
    { key: 'contributions', label: 'Contributions', icon: '✏️' },
    { key: 'trades',        label: 'Trades',        icon: '📈' },
    { key: 'shinies',       label: 'My Shinies',    icon: '✨' },
  ];

  // Loading state
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const grad = avatarColor(profile.username);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* ── Profile header ───────────────────────────────────────────────────── */}
      <div className="border-b border-gray-800 bg-gray-900/40">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar */}
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-3xl font-extrabold text-white shrink-0 shadow-lg`}>
              {profile.username.slice(0, 2).toUpperCase()}
            </div>

            {/* Username + meta */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="rounded-lg bg-gray-800 border border-gray-600 px-3 py-1.5 text-white text-lg font-bold focus:outline-none focus:border-red-400 transition-colors"
                    onKeyDown={e => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') setEditing(false); }}
                    autoFocus
                  />
                  <button onClick={saveUsername} className="rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 px-3 py-1.5 text-xs font-semibold transition-all">Save</button>
                  <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-white text-xs px-2 py-1.5 transition-colors">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-extrabold truncate">{profile.username}</h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2.5 py-1 text-xs text-gray-400 hover:text-white transition-all"
                  >
                    ✏️ Edit
                  </button>
                </div>
              )}
              {saveMsg && <p className="text-xs text-green-400 mb-1">{saveMsg}</p>}
              {joinedDate && <p className="text-sm text-gray-500">Member since {joinedDate}</p>}
              {profile.role === 'admin' && (
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* ── Stats row ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <StatCard label="Wiki Edits"   value={editsLoaded ? edits.length : '…'} />
            <StatCard label="Teams"        value={teamsLoaded ? teams.length : '…'} />
            <StatCard label="Trades"       value={tradesLoaded ? trades.length : '…'} />
            <StatCard
              label="Pokédex"
              value={trackerLoaded ? `${caughtCount}/${DEX_TOTAL}` : '…'}
              sub={trackerLoaded ? `${shinyCount} shiny` : undefined}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-800 bg-gray-900/20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === t.key
                    ? 'border-red-400 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* TAB: Pokédex */}
        {activeTab === 'pokedex' && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Caught</span>
                  <span className="text-sm font-bold text-green-400">{caughtCount} <span className="text-gray-600">/ {DEX_TOTAL}</span></span>
                </div>
                <ProgressBar value={caughtCount} max={DEX_TOTAL} color="bg-green-500" />
                <p className="text-xs text-gray-600 mt-1.5">{DEX_TOTAL > 0 ? ((caughtCount / DEX_TOTAL) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Shiny</span>
                  <span className="text-sm font-bold text-yellow-400">{shinyCount} <span className="text-gray-600">/ {DEX_TOTAL}</span></span>
                </div>
                <ProgressBar value={shinyCount} max={DEX_TOTAL} color="bg-yellow-400" />
                <p className="text-xs text-gray-600 mt-1.5">{DEX_TOTAL > 0 ? ((shinyCount / DEX_TOTAL) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>

            {!trackerLoaded ? (
              <div className="grid grid-cols-10 sm:grid-cols-15 gap-1">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : Object.keys(tracker).length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 py-14 text-center">
                <p className="text-gray-500 mb-3">No Pokémon tracked yet.</p>
                <Link href="/pokedex" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Open Pokédex to start tracking →
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {Object.entries(tracker).sort((a, b) => Number(a[0]) - Number(b[0])).map(([idStr, entry]) => {
                  const id = Number(idStr);
                  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
                  return (
                    <div
                      key={id}
                      title={`#${String(id).padStart(3, '0')}`}
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center relative transition-all ${
                        entry.shiny
                          ? 'bg-yellow-500/10 border-yellow-500/40'
                          : entry.caught
                          ? 'bg-green-500/10 border-green-500/40'
                          : 'bg-gray-800 border-gray-700 opacity-40'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={spriteUrl} alt={`#${id}`} className="w-9 h-9 object-contain" style={{ imageRendering: 'pixelated' }} />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/40 inline-block" /> Caught</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500/40 inline-block" /> Shiny</span>
            </div>
          </div>
        )}

        {/* TAB: Teams */}
        {activeTab === 'teams' && (
          <div>
            {!teamsLoaded ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />)}
              </div>
            ) : teams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 py-14 text-center">
                <p className="text-gray-500 mb-3">No teams yet.</p>
                <Link href="/team-builder" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Create your first team →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map(team => (
                  <div key={team.id} className="rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 px-5 py-4 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-200 truncate">{team.name || 'Unnamed Team'}</p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">#{team.share_code}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/team-builder/share/${team.share_code}`}
                          className="rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-all">
                          View
                        </Link>
                        <Link href="/team-builder"
                          className="rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-all">
                          Edit
                        </Link>
                      </div>
                    </div>
                    {/* Pokémon sprites */}
                    <div className="flex gap-1.5 mt-3">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const poke = team.team_pokemon?.find(p => p.slot === i + 1);
                        return (
                          <div key={i} className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                            {poke?.sprite_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={poke.sprite_url} alt={poke.pokemon_name ?? ''} className="w-9 h-9 object-contain" style={{ imageRendering: 'pixelated' }} />
                            ) : poke?.pokemon_id ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${poke.pokemon_id}.gif`}
                                alt={poke.pokemon_name ?? ''}
                                className="w-9 h-9 object-contain"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            ) : (
                              <span className="text-gray-600 text-xs">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2">
                      {new Date(team.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Contributions */}
        {activeTab === 'contributions' && (
          <div>
            {!editsLoaded ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />)}
              </div>
            ) : edits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 py-14 text-center">
                <p className="text-gray-500 mb-3">No contributions yet.</p>
                <Link href="/wiki" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Browse the wiki to contribute →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {edits.map(edit => (
                  <div key={edit.id} className="flex items-center gap-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 px-5 py-3.5 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-200 truncate">{edit.title || 'Untitled edit'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        on{' '}
                        <Link href={`/wiki/${edit.page_slug}`} className="text-gray-400 hover:text-red-400 transition-colors">
                          {edit.page_title || edit.page_slug}
                        </Link>
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_BADGE[edit.status] ?? STATUS_BADGE.pending}`}>
                      {edit.status}
                    </span>
                    <p className="text-[10px] text-gray-600 shrink-0">
                      {new Date(edit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Trades */}
        {activeTab === 'trades' && (
          <div>
            {!tradesLoaded ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  <StatCard label="Total Trades"    value={trades.length} />
                  <StatCard label="Completed"       value={completedTrades.length} />
                  <StatCard label="Total Profit"    value={totalProfit >= 0 ? `+${(totalProfit / 1000).toFixed(0)}k ₽` : `${(totalProfit / 1000).toFixed(0)}k ₽`} />
                  <StatCard
                    label="Best Trade"
                    value={bestTrade ? bestTrade.item_name : '—'}
                    sub={bestTrade && bestTrade.sell_price_per_unit && bestTrade.buy_price_per_unit
                      ? `+${(((bestTrade.sell_price_per_unit - bestTrade.buy_price_per_unit - (bestTrade.tax_per_unit ?? 0)) * bestTrade.quantity) / 1000).toFixed(0)}k ₽`
                      : undefined
                    }
                  />
                </div>

                {trades.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 py-14 text-center">
                    <p className="text-gray-500 mb-3">No trades recorded yet.</p>
                    <Link href="/trading" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                      Open Invest Manager →
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-900 border-b border-gray-800">
                          {['Item', 'Qty', 'Buy', 'Sell', 'Status', 'Date'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {trades.slice(0, 20).map(t => (
                          <tr key={t.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                            <td className="px-4 py-3 text-gray-200 font-medium truncate max-w-[160px]">{t.item_name}</td>
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.quantity}</td>
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.buy_price_per_unit ? `${t.buy_price_per_unit.toLocaleString()} ₽` : '—'}</td>
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.sell_price_per_unit ? `${t.sell_price_per_unit.toLocaleString()} ₽` : '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[t.status] ?? 'bg-gray-500/15 border-gray-500/30 text-gray-400'}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[10px] text-gray-600">
                              {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB: My Shinies */}
        {activeTab === 'shinies' && (
          <div>
            {!shinesLoaded ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-36 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />)}
              </div>
            ) : myShines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 py-14 text-center">
                <p className="text-4xl mb-3">✨</p>
                <p className="text-gray-500 mb-3">No shiny submissions yet.</p>
                <Link href="/shinies" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                  Submit your first shiny →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {myShines.map(s => (
                  <div key={s.id} className={`rounded-xl bg-gray-900 border flex flex-col items-center gap-2 p-4 text-center transition-all ${s.approved ? 'border-gray-800' : 'border-yellow-900/30'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shinySprite(s.pokemon_id)} alt={s.pokemon_name}
                      className="w-16 h-16 object-contain" style={{ imageRendering: 'pixelated' }} />
                    <p className="text-xs font-semibold text-gray-200 capitalize leading-tight">{s.pokemon_name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${s.approved ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'}`}>
                      {s.approved ? 'Approved' : 'Pending'}
                    </span>
                    <p className="text-[10px] text-gray-600">
                      {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
