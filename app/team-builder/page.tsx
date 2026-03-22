'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Team, TeamPokemon } from './types';
import { TEAM_TAGS, DEFAULT_IVS, DEFAULT_EVS } from './constants';
import { generateShareCode, exportTeamText, importTeamText } from './utils';
import PokemonSearchModal from './PokemonSearchModal';
import PokemonEditPanel from './PokemonEditPanel';
import TeamAnalysis from './TeamAnalysis';
import {
  Plus, Trash2, Copy, Share2, Download, Upload,
  ChevronRight, Tag, DollarSign, FileText, Users,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type SearchResult = {
  slug:        string;
  title:       string;
  pokemon_id?: number;
  types?:      string[];
  sprite_url?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptySlot(teamId: string, slot: number): TeamPokemon {
  return {
    id: crypto.randomUUID(),
    team_id: teamId,
    slot,
    pokemon_slug: null,
    pokemon_name: null,
    pokemon_id: null,
    sprite_url: null,
    level: 50,
    nature: 'Hardy',
    is_shiny: false,
    ability: null,
    held_item: null,
    description: null,
    ivs: { ...DEFAULT_IVS },
    evs: { ...DEFAULT_EVS },
    moves: [],
  };
}

function SpriteOrDot({ pokemon, size = 48 }: { pokemon: TeamPokemon; size?: number }) {
  if (!pokemon.pokemon_id) {
    return (
      <div
        className="rounded-full border-2 border-dashed border-gray-700 bg-gray-800 flex items-center justify-center text-gray-600"
        style={{ width: size, height: size }}
      >
        <Plus size={size / 3} />
      </div>
    );
  }
  const base = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated`;
  const src  = pokemon.is_shiny ? `${base}/shiny/${pokemon.pokemon_id}.gif` : `${base}/${pokemon.pokemon_id}.gif`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={pokemon.pokemon_name ?? ''} style={{ width: size, height: size }} className="object-contain" />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TeamBuilderPage() {
  const [teams,         setTeams]         = useState<Team[]>([]);
  const [activeTeamId,  setActiveTeamId]  = useState<string | null>(null);
  const [teamPokemon,   setTeamPokemon]   = useState<TeamPokemon[]>([]);
  const [selectedSlot,  setSelectedSlot]  = useState<number | null>(null);
  const [showSearch,    setShowSearch]    = useState(false);
  const [showImport,    setShowImport]    = useState(false);
  const [importText,    setImportText]    = useState('');
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [userId,        setUserId]        = useState<string | null>(null);
  const [shareMsg,      setShareMsg]      = useState('');
  const [editingName,   setEditingName]   = useState(false);
  const [teamName,      setTeamName]      = useState('');
  const [teamDesc,      setTeamDesc]      = useState('');
  const [teamPrice,     setTeamPrice]     = useState('');
  const [teamTags,      setTeamTags]      = useState<string[]>([]);
  const [showTagDrop,   setShowTagDrop]   = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null;

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  // ── Load teams ────────────────────────────────────────────────────────────

  const loadTeams = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('updated_at', { ascending: false });
    setTeams(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  // ── Load team pokemon when active team changes ────────────────────────────

  useEffect(() => {
    if (!activeTeamId) { setTeamPokemon([]); return; }
    supabase
      .from('team_pokemon')
      .select('*')
      .eq('team_id', activeTeamId)
      .order('slot')
      .then(({ data }) => {
        // Build 6-slot array
        const filled: TeamPokemon[] = Array.from({ length: 6 }, (_, i) => {
          return (data ?? []).find(p => p.slot === i + 1) ?? emptySlot(activeTeamId, i + 1);
        });
        setTeamPokemon(filled);
        setSelectedSlot(null);
      });

    const team = teams.find(t => t.id === activeTeamId);
    if (team) {
      setTeamName(team.name);
      setTeamDesc(team.description ?? '');
      setTeamPrice(team.price != null ? String(team.price) : '');
      setTeamTags(team.tags ?? []);
    }
  }, [activeTeamId, teams]);

  // ── Create team ───────────────────────────────────────────────────────────

  async function createTeam() {
    if (!userId) return;
    const code = generateShareCode();
    const { data, error } = await supabase
      .from('teams')
      .insert({ user_id: userId, name: 'New Team', share_code: code })
      .select()
      .single();
    if (!error && data) {
      setTeams(prev => [data, ...prev]);
      setActiveTeamId(data.id);
    }
  }

  // ── Delete team ───────────────────────────────────────────────────────────

  async function deleteTeam(id: string) {
    if (!confirm('Delete this team?')) return;
    await supabase.from('teams').delete().eq('id', id);
    setTeams(prev => prev.filter(t => t.id !== id));
    if (activeTeamId === id) { setActiveTeamId(null); setTeamPokemon([]); }
  }

  // ── Save team metadata ────────────────────────────────────────────────────

  async function saveTeamMeta() {
    if (!activeTeamId) return;
    setSaving(true);
    const price = teamPrice ? parseInt(teamPrice) : null;
    const { data } = await supabase
      .from('teams')
      .update({ name: teamName, description: teamDesc || null, price, tags: teamTags, updated_at: new Date().toISOString() })
      .eq('id', activeTeamId)
      .select()
      .single();
    if (data) setTeams(prev => prev.map(t => t.id === activeTeamId ? data : t));
    setSaving(false);
    setEditingName(false);
  }

  // ── Save/update a single pokemon slot ────────────────────────────────────

  async function savePokemon(p: TeamPokemon) {
    if (!activeTeamId || !p.pokemon_name) return;
    const { id, ...rest } = p;
    // Check if exists in DB (has a real UUID from DB vs local)
    const { data: existing } = await supabase
      .from('team_pokemon')
      .select('id')
      .eq('team_id', activeTeamId)
      .eq('slot', p.slot)
      .single();

    if (existing) {
      await supabase.from('team_pokemon').update({ ...rest, updated_at: new Date().toISOString() } as never).eq('id', existing.id);
    } else {
      const { data } = await supabase.from('team_pokemon').insert({ ...rest }).select().single();
      if (data) {
        setTeamPokemon(prev => prev.map(tp => tp.slot === p.slot ? { ...p, id: data.id } : tp));
      }
    }
    // Touch updated_at on team
    await supabase.from('teams').update({ updated_at: new Date().toISOString() }).eq('id', activeTeamId);
  }

  // ── Remove pokemon from slot ──────────────────────────────────────────────

  async function removePokemon(slot: number) {
    if (!activeTeamId) return;
    await supabase.from('team_pokemon').delete().eq('team_id', activeTeamId).eq('slot', slot);
    setTeamPokemon(prev => prev.map(p => p.slot === slot ? emptySlot(activeTeamId, slot) : p));
    if (selectedSlot === slot) setSelectedSlot(null);
  }

  // ── Add pokemon from search ───────────────────────────────────────────────

  async function addPokemon(result: SearchResult, slot: number) {
    if (!activeTeamId) return;
    const spriteUrl = result.pokemon_id
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${result.pokemon_id}.gif`
      : null;
    const p: TeamPokemon = {
      ...emptySlot(activeTeamId, slot),
      pokemon_slug: result.slug,
      pokemon_name: result.title,
      pokemon_id:   result.pokemon_id ?? null,
      sprite_url:   spriteUrl,
    };
    setTeamPokemon(prev => prev.map(tp => tp.slot === slot ? p : tp));
    setShowSearch(false);
    await savePokemon(p);
  }

  // ── Update pokemon ────────────────────────────────────────────────────────

  function updatePokemon(slot: number, updates: Partial<TeamPokemon>) {
    setTeamPokemon(prev => prev.map(p => p.slot === slot ? { ...p, ...updates } : p));
  }

  async function flushPokemon(slot: number) {
    const p = teamPokemon.find(tp => tp.slot === slot);
    if (p && p.pokemon_name) await savePokemon(p);
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  async function copyShareLink() {
    if (!activeTeam) return;
    const url = `${window.location.origin}/team-builder/share/${activeTeam.share_code}`;
    await navigator.clipboard.writeText(url);
    setShareMsg('Copied!');
    setTimeout(() => setShareMsg(''), 2000);
  }

  // ── Export PNG ────────────────────────────────────────────────────────────

  async function exportPng() {
    if (!exportRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(exportRef.current, { useCORS: true, backgroundColor: '#030712' });
    const link = document.createElement('a');
    link.download = `${activeTeam?.name ?? 'team'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ── Export text ───────────────────────────────────────────────────────────

  async function copyExportText() {
    const text = exportTeamText(teamPokemon);
    await navigator.clipboard.writeText(text);
    setShareMsg('Text copied!');
    setTimeout(() => setShareMsg(''), 2000);
  }

  // ── Import text ───────────────────────────────────────────────────────────

  async function handleImport() {
    if (!activeTeamId || !importText.trim()) return;
    const parsed = importTeamText(importText);
    // Delete existing pokemon
    await supabase.from('team_pokemon').delete().eq('team_id', activeTeamId);
    const newPokemon: TeamPokemon[] = Array.from({ length: 6 }, (_, i) => {
      const parsed_entry = parsed[i];
      if (!parsed_entry || !parsed_entry.pokemon_name) return emptySlot(activeTeamId, i + 1);
      return { ...emptySlot(activeTeamId, i + 1), ...parsed_entry, slot: i + 1 };
    });
    setTeamPokemon(newPokemon);
    // Save filled ones
    for (const p of newPokemon.filter(p => p.pokemon_name)) {
      await supabase.from('team_pokemon').insert({
        team_id: p.team_id, slot: p.slot, pokemon_name: p.pokemon_name,
        level: p.level, nature: p.nature, is_shiny: p.is_shiny,
        ability: p.ability, held_item: p.held_item, description: p.description,
        ivs: p.ivs, evs: p.evs, moves: p.moves,
      });
    }
    setShowImport(false);
    setImportText('');
  }

  // ── Duplicate team ────────────────────────────────────────────────────────

  async function duplicateTeam(team: Team) {
    if (!userId) return;
    const code = generateShareCode();
    const { data: newTeam } = await supabase
      .from('teams')
      .insert({ user_id: userId, name: `${team.name} (copy)`, description: team.description, price: team.price, tags: team.tags, share_code: code })
      .select()
      .single();
    if (!newTeam) return;

    // Copy pokemon
    const { data: srcPokemon } = await supabase.from('team_pokemon').select('*').eq('team_id', team.id);
    if (srcPokemon && srcPokemon.length > 0) {
      await supabase.from('team_pokemon').insert(
        srcPokemon.map(({ id: _id, team_id: _tid, ...rest }) => ({ ...rest, team_id: newTeam.id }))
      );
    }
    setTeams(prev => [newTeam, ...prev]);
    setActiveTeamId(newTeam.id);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedPokemon = selectedSlot !== null ? teamPokemon[selectedSlot - 1] ?? null : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

        {/* ── LEFT: Teams List ──────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-red-400" />
              <span className="font-bold text-sm">My Teams</span>
            </div>
            <button
              onClick={createTeam}
              className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="New team"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && teams.length === 0 && (
              <div className="text-center text-gray-600 text-xs py-8 px-4">
                No teams yet. Create your first team!
              </div>
            )}
            {teams.map(team => (
              <div
                key={team.id}
                className={`group mx-2 mb-1 rounded-xl p-3 cursor-pointer transition-colors ${
                  activeTeamId === team.id ? 'bg-red-500/20 border border-red-500/40' : 'hover:bg-gray-800 border border-transparent'
                }`}
                onClick={() => setActiveTeamId(team.id)}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate text-white">{team.name}</div>
                    {team.price && (
                      <div className="text-[10px] text-yellow-400 flex items-center gap-1 mt-0.5">
                        <DollarSign size={10} />{team.price.toLocaleString()}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(team.tags ?? []).slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-gray-700 rounded-full text-gray-400">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); duplicateTeam(team); }}
                      className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-white transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteTeam(team.id); }}
                      className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {/* Mini sprite row */}
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 6 }, (_, i) => {
                    if (activeTeamId !== team.id) return (
                      <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700" />
                    );
                    const p = teamPokemon[i];
                    if (!p?.pokemon_id) return (
                      <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border border-dashed border-gray-700" />
                    );
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i}
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemon_id}.png`}
                        alt={p.pokemon_name ?? ''}
                        className="w-6 h-6 object-contain"
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── CENTER: Team Editor ───────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!activeTeam ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
              <div className="text-6xl">🗂️</div>
              <div className="text-lg font-semibold text-gray-500">Select or create a team</div>
              <button
                onClick={createTeam}
                className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Create Team
              </button>
            </div>
          ) : (
            <>
              {/* Team header */}
              <div className="border-b border-gray-800 p-4 flex items-center gap-3 bg-gray-900">
                {editingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500 font-bold flex-1"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveTeamMeta(); if (e.key === 'Escape') setEditingName(false); }}
                    />
                    <button onClick={saveTeamMeta} className="text-xs bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-white transition-colors">
                      {saving ? '…' : 'Save'}
                    </button>
                    <button onClick={() => setEditingName(false)} className="text-xs text-gray-500 hover:text-white transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingName(true)} className="font-bold text-white hover:text-red-400 transition-colors text-left flex-1">
                    {activeTeam.name}
                  </button>
                )}

                <div className="flex items-center gap-2">
                  {/* Price */}
                  <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1">
                    <DollarSign size={12} className="text-yellow-400" />
                    <input
                      value={teamPrice}
                      onChange={e => setTeamPrice(e.target.value.replace(/\D/g, ''))}
                      onBlur={saveTeamMeta}
                      placeholder="Price"
                      className="w-20 bg-transparent text-xs text-white focus:outline-none placeholder-gray-600"
                    />
                  </div>

                  {/* Tags */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTagDrop(!showTagDrop)}
                      className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <Tag size={12} />
                      Tags {teamTags.length > 0 && <span className="bg-red-500 text-white rounded-full px-1.5 text-[10px]">{teamTags.length}</span>}
                    </button>
                    {showTagDrop && (
                      <div className="absolute right-0 top-8 z-30 bg-gray-800 border border-gray-700 rounded-xl p-2 w-48 shadow-xl">
                        {TEAM_TAGS.map(tag => (
                          <label key={tag} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 cursor-pointer text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={teamTags.includes(tag)}
                              onChange={() => {
                                const next = teamTags.includes(tag) ? teamTags.filter(t => t !== tag) : [...teamTags, tag];
                                setTeamTags(next);
                              }}
                              className="accent-red-500"
                            />
                            {tag}
                          </label>
                        ))}
                        <button
                          onClick={() => { setShowTagDrop(false); saveTeamMeta(); }}
                          className="w-full mt-2 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg py-1.5 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <button onClick={copyShareLink} className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors" title="Copy share link">
                    <Share2 size={12} />
                    {shareMsg || 'Share'}
                  </button>
                  <button onClick={exportPng} className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors" title="Export PNG">
                    <Download size={12} />PNG
                  </button>
                  <button onClick={copyExportText} className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors" title="Export text">
                    <FileText size={12} />Text
                  </button>
                  <button onClick={() => setShowImport(true)} className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors" title="Import text">
                    <Upload size={12} />Import
                  </button>
                </div>
              </div>

              {/* Share code pill */}
              <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center gap-2">
                <span className="text-xs text-gray-600">Share code:</span>
                <code className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{activeTeam.share_code}</code>
                {activeTeam.price && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-yellow-400">💰 {Number(activeTeam.price).toLocaleString()} Yen</span>
                  </>
                )}
                {(activeTeam.tags ?? []).map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-800 border border-gray-700 rounded-full text-gray-400">{tag}</span>
                ))}
              </div>

              {/* Description */}
              <div className="px-4 py-2 bg-gray-900 border-b border-gray-800">
                <input
                  value={teamDesc}
                  onChange={e => setTeamDesc(e.target.value)}
                  onBlur={saveTeamMeta}
                  placeholder="Team description (optional)…"
                  className="w-full bg-transparent text-xs text-gray-400 placeholder-gray-700 focus:outline-none"
                />
              </div>

              {/* Pokemon grid — export ref */}
              <div ref={exportRef} className="grid grid-cols-6 gap-3 p-4 bg-gray-950">
                {teamPokemon.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (!p.pokemon_name) {
                        setSelectedSlot(i + 1);
                        setShowSearch(true);
                      } else {
                        setSelectedSlot(selectedSlot === i + 1 ? null : i + 1);
                      }
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                      selectedSlot === i + 1
                        ? 'bg-red-500/20 border-red-500/60'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <SpriteOrDot pokemon={p} size={56} />
                    <div className="text-[10px] text-gray-500 truncate w-full text-center">
                      {p.pokemon_name ?? 'Empty'}
                    </div>
                    {p.is_shiny && <div className="text-[9px] text-yellow-400">✨</div>}
                  </button>
                ))}
              </div>

              {/* Selected pokemon editor */}
              {selectedSlot !== null && selectedPokemon?.pokemon_name && (
                <div className="flex-1 overflow-y-auto p-4 border-t border-gray-800">
                  <PokemonEditPanel
                    pokemon={selectedPokemon}
                    onChange={updates => updatePokemon(selectedSlot, updates)}
                    onRemove={() => removePokemon(selectedSlot)}
                  />
                  <button
                    onClick={() => flushPokemon(selectedSlot)}
                    className="mt-3 w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Slot button when empty selected */}
              {selectedSlot !== null && !selectedPokemon?.pokemon_name && (
                <div className="p-4 border-t border-gray-800">
                  <button
                    onClick={() => setShowSearch(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:border-red-500 hover:text-red-400 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Pokémon to slot {selectedSlot}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* ── RIGHT: Analysis ───────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2">
            <ChevronRight size={16} className="text-red-400" />
            <span className="font-bold text-sm">Team Analysis</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <TeamAnalysis pokemon={teamPokemon} />
          </div>
        </aside>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {showSearch && selectedSlot !== null && (
        <PokemonSearchModal
          onSelect={r => addPokemon(r, selectedSlot)}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl p-6">
            <h3 className="font-bold text-white mb-3">Import Team</h3>
            <p className="text-xs text-gray-500 mb-3">Paste Showdown-style team text. Up to 6 Pokémon. Existing team will be replaced.</p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              rows={12}
              placeholder="Pokémon @ Item&#10;Ability: ...&#10;Level: 50&#10;Nature: ...&#10;EVs: 252 SpA / 4 SpD / 252 Spe&#10;- Move 1&#10;- Move 2&#10;..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono resize-none placeholder-gray-700"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={handleImport} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
                Import
              </button>
              <button onClick={() => { setShowImport(false); setImportText(''); }} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
