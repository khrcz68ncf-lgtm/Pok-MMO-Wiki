'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type ShinySubmission = {
  id:           string;
  user_id:      string;
  username:     string;
  pokemon_name: string;
  pokemon_id:   number;
  method:       string;
  region:       string | null;
  location:     string | null;
  notes:        string | null;
  image_url:    string | null;
  approved:     boolean;
  created_at:   string;
};

type Profile = { username: string; role: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const METHODS = ['wild', 'breeding', 'horde', 'fishing'] as const;
const REGIONS = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova'] as const;

const METHOD_BADGE: Record<string, string> = {
  wild:     'bg-blue-500/15 border-blue-500/30 text-blue-400',
  breeding: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  horde:    'bg-green-500/15 border-green-500/30 text-green-400',
  fishing:  'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
};

function shinySprite(pokemonId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${pokemonId}.gif`;
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────

type PokemonOption = { name: string; id: number };

function SubmitModal({
  username,
  onClose,
  onSubmitted,
}: {
  username: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [search,    setSearch]    = useState('');
  const [options,   setOptions]   = useState<PokemonOption[]>([]);
  const [selected,  setSelected]  = useState<PokemonOption | null>(null);
  const [method,    setMethod]    = useState('');
  const [region,    setRegion]    = useState('');
  const [location,  setLocation]  = useState('');
  const [notes,     setNotes]     = useState('');
  const [imageUrl,  setImageUrl]  = useState('');
  const [status,    setStatus]    = useState<'idle' | 'submitting' | 'done' | 'err'>('idle');

  // Pokémon search
  useEffect(() => {
    if (search.length < 2) { setOptions([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('pages')
        .select('title, metadata')
        .eq('template_type', 'pokemon')
        .ilike('title', `%${search}%`)
        .limit(8);
      setOptions(
        (data ?? [])
          .filter(p => p.metadata?.pokemon_id)
          .map(p => ({ name: p.metadata.name || p.title, id: p.metadata.pokemon_id })),
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !method) return;
    setStatus('submitting');

    const { error } = await supabase.from('shiny_submissions').insert({
      username,
      pokemon_name: selected.name,
      pokemon_id:   selected.id,
      method,
      region:    region || null,
      location:  location || null,
      notes:     notes || null,
      image_url: imageUrl || null,
      approved:  false,
    });

    setStatus(error ? 'err' : 'done');
  }

  const inputCls = 'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-bold">✨ Submit your shiny</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {status === 'done' ? (
          <div className="px-5 py-12 text-center">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-green-400 font-semibold mb-1">Submitted for review!</p>
            <p className="text-gray-500 text-sm mb-6">Your shiny will appear once an admin approves it.</p>
            <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            {status === 'err' && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                Failed to submit, please try again.
              </p>
            )}

            {/* Pokémon search */}
            <div className="relative">
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Pokémon *</label>
              {selected ? (
                <div className="flex items-center gap-3 bg-gray-800 border border-yellow-500/40 rounded-lg px-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shinySprite(selected.id)} alt={selected.name} className="w-8 h-8 object-contain" />
                  <span className="text-sm font-semibold capitalize text-white">{selected.name}</span>
                  <button type="button" onClick={() => { setSelected(null); setSearch(''); }}
                    className="ml-auto text-gray-500 hover:text-white text-sm">✕</button>
                </div>
              ) : (
                <>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search Pokémon name…"
                    className={inputCls}
                  />
                  {options.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                      {options.map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => { setSelected(o); setSearch(o.name); setOptions([]); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 transition-colors text-left"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={shinySprite(o.id)} alt={o.name} className="w-7 h-7 object-contain" />
                          <span className="text-sm capitalize text-gray-200">{o.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Method */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Method *</label>
              <div className="flex gap-2 flex-wrap">
                {METHODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all ${
                      method === m
                        ? METHOD_BADGE[m]
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Region</label>
              <div className="flex gap-2 flex-wrap">
                {REGIONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegion(region === r ? '' : r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      region === r
                        ? 'bg-gray-600 border-gray-400 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Route 114, Victory Road…" className={inputCls} />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} placeholder="Any extra info…"
                className={`${inputCls} resize-none`} />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Screenshot URL <span className="normal-case text-gray-600">(optional)</span></label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://…" className={inputCls} />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selected || !method || status === 'submitting'}
                className="px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition-colors disabled:opacity-50"
              >
                {status === 'submitting' ? 'Submitting…' : '✨ Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Shiny Card ───────────────────────────────────────────────────────────────

function ShinyCard({
  s,
  isAdmin,
  onApprove,
  onReject,
}: {
  s: ShinySubmission;
  isAdmin: boolean;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
}) {
  const badge = METHOD_BADGE[s.method] ?? 'bg-gray-500/15 border-gray-500/30 text-gray-400';
  const num   = String(s.pokemon_id).padStart(3, '0');

  return (
    <div className={`rounded-2xl bg-gray-900 border flex flex-col overflow-hidden transition-all ${s.approved ? 'border-gray-800 hover:border-gray-600' : 'border-yellow-900/40 opacity-70'}`}>
      {/* Sprite panel */}
      <div className="flex items-center justify-center bg-gray-800/60 py-6 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shinySprite(s.pokemon_id)}
          alt={s.pokemon_name}
          className="w-24 h-24 object-contain drop-shadow-lg"
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />
        {!s.approved && (
          <span className="absolute top-2 right-2 text-[10px] bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
            Pending
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-xs text-gray-500 font-mono">#{num}</p>
          <p className="text-base font-bold capitalize text-white leading-tight">{s.pokemon_name}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${badge}`}>
            {s.method}
          </span>
          {s.region && (
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{s.region}</span>
          )}
        </div>

        {s.location && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>📍</span> {s.location}
          </p>
        )}

        <p className="text-xs text-gray-400">
          Found by <span className="text-gray-200 font-semibold">{s.username}</span>
        </p>

        {s.notes && (
          <p className="text-xs text-gray-500 italic leading-relaxed">{s.notes}</p>
        )}

        {s.image_url && (
          <a href={s.image_url} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
            View screenshot ↗
          </a>
        )}

        <p className="text-[10px] text-gray-600 mt-auto pt-1">
          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-800">
            {!s.approved && (
              <button onClick={() => onApprove(s.id)}
                className="flex-1 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 text-xs font-semibold py-1.5 transition-all">
                ✓ Approve
              </button>
            )}
            <button onClick={() => onReject(s.id)}
              className="flex-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold py-1.5 transition-all">
              ✕ {s.approved ? 'Remove' : 'Reject'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShiniesPage() {
  const [shinies,    setShinies]    = useState<ShinySubmission[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState<{ id: string } | null | undefined>(undefined);
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [showModal,  setShowModal]  = useState(false);

  // Filters
  const [search,        setSearch]        = useState('');
  const [regionFilter,  setRegionFilter]  = useState('');
  const [methodFilter,  setMethodFilter]  = useState('');
  const [sortMode,      setSortMode]      = useState<'recent' | 'oldest'>('recent');

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('username, role').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  function loadShinies() {
    let q = supabase.from('shiny_submissions').select('*').order('created_at', { ascending: false });
    if (profile?.role !== 'admin') q = q.eq('approved', true);
    q.then(({ data }) => { setShinies(data ?? []); setLoading(false); });
  }

  useEffect(() => {
    // Load approved shinies (and all if admin)
    let q = supabase.from('shiny_submissions').select('*').order('created_at', { ascending: false });
    q = q.eq('approved', true); // overridden below when profile loads
    q.then(({ data }) => { setShinies(data ?? []); setLoading(false); });
  }, []);

  // Reload when profile is known (admin sees pending too)
  useEffect(() => {
    if (profile?.role === 'admin') {
      supabase.from('shiny_submissions').select('*').order('created_at', { ascending: false })
        .then(({ data }) => setShinies(data ?? []));
    }
  }, [profile]);

  async function handleApprove(id: string) {
    await supabase.from('shiny_submissions').update({ approved: true }).eq('id', id);
    setShinies(prev => prev.map(s => s.id === id ? { ...s, approved: true } : s));
  }

  async function handleReject(id: string) {
    if (!window.confirm('Remove this shiny submission?')) return;
    await supabase.from('shiny_submissions').delete().eq('id', id);
    setShinies(prev => prev.filter(s => s.id !== id));
  }

  const filtered = useMemo(() => {
    let list = shinies;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.pokemon_name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q));
    }
    if (regionFilter) list = list.filter(s => s.region === regionFilter);
    if (methodFilter) list = list.filter(s => s.method === methodFilter);
    if (sortMode === 'oldest') list = [...list].reverse();
    return list;
  }, [shinies, search, regionFilter, methodFilter, sortMode]);

  const approvedCount = shinies.filter(s => s.approved).length;
  const isAdmin       = profile?.role === 'admin';

  const filterBtn = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
      active
        ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
    }`;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-800">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(234,179,8,0.08),transparent)]" />

        <div className="relative mx-auto max-w-4xl px-6 py-14 text-center">
          <nav className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-8">
            <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-500">Shiny Hall of Fame</span>
          </nav>

          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            ✨ Shiny <span className="text-yellow-400">Hall of Fame</span>
          </h1>
          <p className="text-gray-400 mb-4">
            Community-submitted shiny Pokémon from across all PokéMMO regions.
          </p>
          <p className="text-2xl font-bold text-yellow-400 mb-6">
            {loading ? '…' : approvedCount.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-2">shinies found</span>
          </p>

          {user ? (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 px-6 py-2.5 text-sm font-bold text-black transition-colors"
            >
              ✨ Submit your shiny
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 px-6 py-2.5 text-sm font-semibold text-gray-300 transition-colors"
            >
              Login to submit your shiny
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mx-auto max-w-6xl px-6 py-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search Pokémon or user…"
          className="flex-1 min-w-[180px] rounded-xl bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
        />

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setRegionFilter('')} className={filterBtn(!regionFilter)}>All regions</button>
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegionFilter(regionFilter === r ? '' : r)} className={filterBtn(regionFilter === r)}>{r}</button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setMethodFilter('')} className={filterBtn(!methodFilter)}>All methods</button>
          {METHODS.map(m => (
            <button key={m} onClick={() => setMethodFilter(methodFilter === m ? '' : m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border capitalize transition-all ${
                methodFilter === m ? METHOD_BADGE[m] : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}>
              {m}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={() => setSortMode('recent')} className={filterBtn(sortMode === 'recent')}>Most recent</button>
          <button onClick={() => setSortMode('oldest')} className={filterBtn(sortMode === 'oldest')}>Oldest</button>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 py-20 text-center">
            <p className="text-4xl mb-4">✨</p>
            <p className="text-gray-500 mb-2">No shinies found yet.</p>
            {user ? (
              <button onClick={() => setShowModal(true)}
                className="mt-4 px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition-colors">
                Be the first to submit!
              </button>
            ) : (
              <Link href="/auth/login" className="mt-4 inline-block text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                Login to submit yours →
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600 mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(s => (
                <ShinyCard
                  key={s.id}
                  s={s}
                  isAdmin={isAdmin}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Submit modal */}
      {showModal && profile && (
        <SubmitModal
          username={profile.username}
          onClose={() => setShowModal(false)}
          onSubmitted={() => { setShowModal(false); loadShinies(); }}
        />
      )}
    </div>
  );
}
