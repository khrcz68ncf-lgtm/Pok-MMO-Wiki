'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
type Role = 'Sweeper' | 'Tank' | 'Support' | 'Revenge Killer' | 'Wall' | 'Wallbreaker' | 'Pivot' | 'Hazard Setter';

type TierEntry = {
  id: string;
  pokemon_name: string;
  pokemon_id: number | null;
  tier: Tier;
  role: string | null;
  notes: string | null;
  updated_at: string;
};

type SearchResult = {
  title: string;
  pokemon_id: number | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D', 'F'];
const ROLES: Role[] = ['Sweeper', 'Tank', 'Support', 'Revenge Killer', 'Wall', 'Wallbreaker', 'Pivot', 'Hazard Setter'];

const TIER_STYLES: Record<Tier, { bg: string; border: string; label: string; labelBg: string }> = {
  S: { bg: 'bg-red-950/40',    border: 'border-red-800/50',    label: 'text-red-400',    labelBg: 'bg-red-900/60'    },
  A: { bg: 'bg-orange-950/40', border: 'border-orange-800/50', label: 'text-orange-400', labelBg: 'bg-orange-900/60' },
  B: { bg: 'bg-yellow-950/40', border: 'border-yellow-800/50', label: 'text-yellow-400', labelBg: 'bg-yellow-900/60' },
  C: { bg: 'bg-green-950/40',  border: 'border-green-800/50',  label: 'text-green-400',  labelBg: 'bg-green-900/60'  },
  D: { bg: 'bg-blue-950/40',   border: 'border-blue-800/50',   label: 'text-blue-400',   labelBg: 'bg-blue-900/60'   },
  F: { bg: 'bg-gray-900/40',   border: 'border-gray-700/50',   label: 'text-gray-400',   labelBg: 'bg-gray-800/60'   },
};

const ROLE_COLORS: Record<string, string> = {
  'Sweeper':       'bg-red-900/60 text-red-300 border-red-800/50',
  'Tank':          'bg-blue-900/60 text-blue-300 border-blue-800/50',
  'Support':       'bg-purple-900/60 text-purple-300 border-purple-800/50',
  'Revenge Killer':'bg-orange-900/60 text-orange-300 border-orange-800/50',
  'Wall':          'bg-green-900/60 text-green-300 border-green-800/50',
  'Wallbreaker':   'bg-yellow-900/60 text-yellow-300 border-yellow-800/50',
  'Pivot':         'bg-cyan-900/60 text-cyan-300 border-cyan-800/50',
  'Hazard Setter': 'bg-pink-900/60 text-pink-300 border-pink-800/50',
};

const SPRITE_URL = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function PokemonCard({
  entry,
  editMode,
  onUpdate,
  onRemove,
}: {
  entry: TierEntry;
  editMode: boolean;
  onUpdate: (id: string, field: string, value: string | Tier | null) => void;
  onRemove: (id: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);

  // Close notes tooltip on outside click
  useEffect(() => {
    if (!showNotes) return;
    function handler(e: MouseEvent) {
      if (notesRef.current && !notesRef.current.contains(e.target as Node)) {
        setShowNotes(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotes]);

  return (
    <div className="relative flex flex-col items-center gap-1 rounded-xl bg-gray-900/80 border border-gray-800 p-3 min-w-[100px] max-w-[110px] shrink-0 hover:border-gray-600 transition-all group">
      {/* Sprite */}
      <div className="h-14 w-14 flex items-center justify-center">
        {entry.pokemon_id ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={SPRITE_URL(entry.pokemon_id)}
            alt={entry.pokemon_name}
            className="h-14 w-14 object-contain pixelated"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center text-2xl">
            ?
          </div>
        )}
      </div>

      {/* Name */}
      <p className="text-xs font-semibold text-gray-200 text-center leading-tight capitalize">
        {entry.pokemon_name}
      </p>

      {/* Role badge */}
      {entry.role && !editMode && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium leading-none ${ROLE_COLORS[entry.role] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
          {entry.role}
        </span>
      )}

      {/* Notes button */}
      {entry.notes && !editMode && (
        <div className="relative" ref={notesRef}>
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors underline decoration-dotted"
          >
            notes
          </button>
          {showNotes && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 rounded-lg bg-gray-800 border border-gray-700 shadow-xl p-3 text-xs text-gray-300 leading-relaxed">
              <p className="font-semibold text-white mb-1 capitalize">{entry.pokemon_name}</p>
              {entry.notes}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-2 h-2 border-l border-b border-gray-700 bg-gray-800 rotate-[-45deg]" />
            </div>
          )}
        </div>
      )}

      {/* Edit controls */}
      {editMode && (
        <div className="flex flex-col gap-1 w-full mt-1">
          <select
            value={entry.tier}
            onChange={(e) => onUpdate(entry.id, 'tier', e.target.value as Tier)}
            className="w-full text-[10px] bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-gray-300"
          >
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={entry.role ?? ''}
            onChange={(e) => onUpdate(entry.id, 'role', e.target.value || null)}
            className="w-full text-[10px] bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-gray-300"
          >
            <option value="">No role</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={() => setEditingNotes((v) => !v)}
            className="text-[10px] text-blue-400 hover:text-blue-300 underline text-left"
          >
            {editingNotes ? 'Close notes' : 'Edit notes'}
          </button>
          {editingNotes && (
            <textarea
              value={entry.notes ?? ''}
              onChange={(e) => onUpdate(entry.id, 'notes', e.target.value)}
              className="w-full text-[10px] bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-gray-300 resize-none"
              rows={3}
              placeholder="Notes…"
            />
          )}
          <button
            onClick={() => onRemove(entry.id)}
            className="text-[10px] text-red-400 hover:text-red-300 transition-colors text-left"
          >
            ✕ Remove
          </button>
        </div>
      )}
    </div>
  );
}

function AddPokemonRow({
  tier,
  onAdd,
}: {
  tier: Tier;
  onAdd: (pokemon: SearchResult, tier: Tier) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('pages')
        .select('title, metadata')
        .eq('template_type', 'pokemon')
        .ilike('title', `%${query}%`)
        .limit(8);
      setResults((data ?? []).map((p) => ({
        title: p.title,
        pokemon_id: (p.metadata as Record<string, unknown>)?.pokemon_id as number | null ?? null,
      })));
      setOpen(true);
    }, 300);
  }, [query]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function select(r: SearchResult) {
    onAdd(r, tier);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative min-w-[140px]">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`+ Add to ${tier}`}
        className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500"
      />
      {open && results.length > 0 && (
        <ul className="absolute top-full left-0 mt-1 z-50 w-48 rounded-xl bg-gray-800 border border-gray-700 shadow-xl overflow-hidden">
          {results.map((r) => (
            <li key={r.title}>
              <button
                onClick={() => select(r)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-left"
              >
                {r.pokemon_id && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={SPRITE_URL(r.pokemon_id)}
                    alt=""
                    className="h-6 w-6 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
                <span className="capitalize truncate">{r.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PvPPage() {
  const [entries, setEntries]     = useState<TierEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editMode, setEditMode]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [isAdmin, setIsAdmin]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  // Pending local changes (before save)
  const [pending, setPending]     = useState<TierEntry[]>([]);

  // Load tiers + check admin
  useEffect(() => {
    async function load() {
      const [{ data: tierData }, { data: { session } }] = await Promise.all([
        supabase.from('pvp_tiers').select('*').order('tier').order('pokemon_name'),
        supabase.auth.getSession(),
      ]);

      const rows = (tierData ?? []) as TierEntry[];
      setEntries(rows);
      setPending(rows);

      const latest = rows.reduce<string | null>((acc, r) => {
        if (!acc || r.updated_at > acc) return r.updated_at;
        return acc;
      }, null);
      setLastUpdated(latest);

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      }

      setLoading(false);
    }
    load();
  }, []);

  const grouped = useCallback(() => {
    const display = editMode ? pending : entries;
    const map: Record<Tier, TierEntry[]> = { S: [], A: [], B: [], C: [], D: [], F: [] };
    for (const e of display) {
      if (e.tier in map) map[e.tier as Tier].push(e);
    }
    return map;
  }, [entries, pending, editMode]);

  function handleUpdate(id: string, field: string, value: string | Tier | null) {
    setPending((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  }

  function handleRemove(id: string) {
    setPending((prev) => prev.filter((e) => e.id !== id));
  }

  function handleAdd(pokemon: SearchResult, tier: Tier) {
    const newEntry: TierEntry = {
      id: `tmp-${Date.now()}`,
      pokemon_name: pokemon.title.toLowerCase(),
      pokemon_id: pokemon.pokemon_id,
      tier,
      role: null,
      notes: null,
      updated_at: new Date().toISOString(),
    };
    setPending((prev) => [...prev, newEntry]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Figure out what changed
      const originalIds = new Set(entries.map((e) => e.id));
      const pendingIds  = new Set(pending.map((e) => e.id));

      // Deleted rows
      const deletedIds = [...originalIds].filter((id) => !pendingIds.has(id));
      if (deletedIds.length) {
        await supabase.from('pvp_tiers').delete().in('id', deletedIds);
      }

      // New rows (tmp- prefix)
      const newRows = pending.filter((e) => e.id.startsWith('tmp-'));
      if (newRows.length) {
        await supabase.from('pvp_tiers').insert(
          newRows.map(({ id: _id, ...rest }) => rest)
        );
      }

      // Updated rows
      const updatedRows = pending.filter((e) => !e.id.startsWith('tmp-') && originalIds.has(e.id));
      for (const row of updatedRows) {
        await supabase.from('pvp_tiers')
          .update({ tier: row.tier, role: row.role, notes: row.notes })
          .eq('id', row.id);
      }

      // Reload fresh data
      const { data } = await supabase.from('pvp_tiers').select('*').order('tier').order('pokemon_name');
      const rows = (data ?? []) as TierEntry[];
      setEntries(rows);
      setPending(rows);
      const latest = rows.reduce<string | null>((acc, r) => (!acc || r.updated_at > acc ? r.updated_at : acc), null);
      setLastUpdated(latest);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setPending(entries);
    setEditMode(false);
  }

  const tierMap = grouped();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'PvP' }]} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">PvP Tier List</h1>
            <p className="text-gray-500 text-sm">
              Community rankings for PokéMMO competitive play.
              {lastUpdated && (
                <span className="ml-2 text-gray-600">
                  Last updated {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </p>
          </div>

          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              {editMode ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="rounded-lg border border-gray-700 hover:border-gray-500 px-4 py-2 text-sm text-gray-400 hover:text-white transition-all"
                >
                  ✏️ Edit Tier List
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tier list */}
        {loading ? (
          <div className="space-y-3">
            {TIERS.map((t) => (
              <div key={t} className="h-24 rounded-2xl bg-gray-900/40 border border-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {TIERS.map((tier) => {
              const style = TIER_STYLES[tier];
              const pokemonInTier = tierMap[tier] ?? [];
              return (
                <div
                  key={tier}
                  className={`rounded-2xl ${style.bg} border ${style.border} flex gap-0 overflow-hidden`}
                >
                  {/* Tier label */}
                  <div className={`flex items-center justify-center ${style.labelBg} shrink-0 w-14 sm:w-16`}>
                    <span className={`text-2xl font-extrabold ${style.label} select-none`}>{tier}</span>
                  </div>

                  {/* Pokémon row */}
                  <div className="flex-1 min-w-0 p-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 items-start flex-wrap sm:flex-nowrap">
                      {pokemonInTier.length === 0 && !editMode && (
                        <p className="text-xs text-gray-700 italic self-center py-4">No Pokémon in this tier yet.</p>
                      )}
                      {pokemonInTier.map((entry) => (
                        <PokemonCard
                          key={entry.id}
                          entry={entry}
                          editMode={editMode}
                          onUpdate={handleUpdate}
                          onRemove={handleRemove}
                        />
                      ))}
                      {editMode && (
                        <div className="self-center shrink-0">
                          <AddPokemonRow tier={tier} onAdd={handleAdd} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(ROLE_COLORS).map(([role, cls]) => (
            <span key={role} className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${cls}`}>
              {role}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-gray-800 pt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-5">
            PvP Tools
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                href: '/team-builder',
                icon: '🗂️',
                label: 'Team Builder',
                desc: 'Build and share your PokéMMO teams',
                accent: 'text-cyan-400',
                glow: 'bg-cyan-500/10',
                gradient: 'from-cyan-950/60 to-gray-900',
                border: 'border-cyan-800/30',
              },
              {
                href: '/damage-calculator',
                icon: '💥',
                label: 'Damage Calculator',
                desc: 'Calculate damage with the Gen 5 formula',
                accent: 'text-rose-400',
                glow: 'bg-rose-500/10',
                gradient: 'from-rose-950/60 to-gray-900',
                border: 'border-rose-800/30',
              },
              {
                href: '/breeding-calculator',
                icon: '🥚',
                label: 'Breeding Calculator',
                desc: 'Plan IV chains and estimate breeding costs',
                accent: 'text-lime-400',
                glow: 'bg-lime-500/10',
                gradient: 'from-lime-950/60 to-gray-900',
                border: 'border-lime-800/30',
              },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group rounded-2xl bg-gradient-to-b ${tool.gradient} border ${tool.border} hover:border-gray-600 p-5 flex items-center gap-4 transition-all`}
              >
                <div className={`w-10 h-10 rounded-xl ${tool.glow} flex items-center justify-center text-xl shrink-0`}>
                  {tool.icon}
                </div>
                <div>
                  <p className={`text-sm font-bold ${tool.accent}`}>{tool.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
