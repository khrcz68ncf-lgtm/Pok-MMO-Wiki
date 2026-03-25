'use client';

import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
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

// ── Export Card ──────────────────────────────────────────────────────────────

const TYPE_BG: Record<string, string> = {
  normal: '#9099A1',   fire: '#E8553D',    water: '#4D90D5',   electric: '#F3D23B',
  grass: '#63BB5B',    ice: '#74CEC0',     fighting: '#CE4069', poison: '#AB6AC8',
  ground: '#D97845',   flying: '#8FA8DD',  psychic: '#F97176', bug: '#90C12C',
  rock: '#C7B78B',     ghost: '#5269AC',   dragon: '#0A6DC4',  dark: '#5A5366',
  steel: '#5A8EA1',    fairy: '#EC8FE6',
};

const STAT_SHORT: Record<string, string> = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  special_attack: 'SpATK', special_defense: 'SpDEF', speed: 'SPE',
};

function fmtEvs(evs: Record<string, number>): string {
  return Object.entries(evs)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${v} ${STAT_SHORT[k] ?? k}`)
    .join(' / ');
}

function fmtPerfectIvs(ivs: Record<string, number>): string {
  const perfect = Object.entries(ivs)
    .filter(([, v]) => v === 31)
    .map(([k]) => STAT_SHORT[k] ?? k);
  return perfect.length ? perfect.join(' / ') : '';
}

// Inline label used inside each card section
function Label({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 3 }}>
      {text}
    </div>
  );
}

const ExportCard = forwardRef<HTMLDivElement, {
  team:     Team;
  pokemon:  TeamPokemon[];
  typesMap: Record<string, string[]>;
}>(function ExportCard({ team, pokemon, typesMap }, ref) {
  const slots   = Array.from({ length: 6 }, (_, i) => pokemon[i] ?? null);
  const artBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

  return (
    <div
      ref={ref}
      style={{
        position:   'fixed',
        left:       '-9999px',
        top:        0,
        width:      '1200px',
        background: '#0f172a',
        padding:    '36px 40px 28px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color:      '#fff',
        boxSizing:  'border-box',
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 24, borderBottom: '1px solid #1e293b', paddingBottom: 16 }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
          {team.name}
        </div>
        {team.description && (
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{team.description}</div>
        )}
      </div>

      {/* ── 3×2 Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {slots.map((p, idx) => {
          if (!p?.pokemon_name || !p.pokemon_id) {
            return (
              <div key={idx} style={{
                background:   '#1e293b',
                border:       '1px dashed #334155',
                borderRadius: 14,
                height:       260,
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                color:        '#334155',
                fontSize:     13,
              }}>
                Empty slot
              </div>
            );
          }

          const artUrl  = p.is_shiny ? `${artBase}/shiny/${p.pokemon_id}.png` : `${artBase}/${p.pokemon_id}.png`;
          const types   = (p.pokemon_slug ? typesMap[p.pokemon_slug] : null) ?? [];
          const moves   = Array.from({ length: 4 }, (_, i) => (p.moves ?? [])[i] ?? '');
          const evStr   = fmtEvs(p.evs ?? {});
          const ivStr   = fmtPerfectIvs(p.ivs ?? {});

          return (
            <div
              key={p.id}
              style={{
                background:   '#1e293b',
                border:       '1px solid #334155',
                borderRadius: 14,
                padding:      '16px',
                display:      'flex',
                flexDirection:'row',
                gap:          14,
                boxSizing:    'border-box',
              }}
            >
              {/* Left: artwork */}
              <div style={{ width: 96, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artUrl}
                  alt={p.pokemon_name}
                  crossOrigin="anonymous"
                  style={{ width: 96, height: 96, objectFit: 'contain' }}
                />
              </div>

              {/* Right: all info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* Name + level */}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, textTransform: 'capitalize', color: '#fff', lineHeight: 1.2 }}>
                    {p.pokemon_name.replace(/-/g, ' ')}
                    {p.is_shiny && <span style={{ fontSize: 11, marginLeft: 5, color: '#fbbf24' }}>✨</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Lv. {p.level}
                  </div>
                </div>

                {/* Type badges */}
                {types.length > 0 && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {types.map(t => (
                      <span key={t} style={{
                        background:   TYPE_BG[t.toLowerCase()] ?? '#6b7280',
                        borderRadius: 4,
                        padding:      '2px 7px',
                        fontSize:     10,
                        fontWeight:   600,
                        textTransform:'capitalize',
                        color:        '#fff',
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Nature · Ability */}
                <div>
                  <Label text="Nature · Ability" />
                  <div style={{ fontSize: 11, color: '#e2e8f0' }}>
                    {p.nature}
                    {p.ability && <span style={{ color: '#94a3b8' }}> · {p.ability.replace(/-/g, ' ')}</span>}
                  </div>
                </div>

                {/* Held item */}
                <div>
                  <Label text="Item" />
                  <div style={{ fontSize: 11, color: p.held_item ? '#fbbf24' : '#475569' }}>
                    {p.held_item ? `@ ${p.held_item.replace(/-/g, ' ')}` : 'No item'}
                  </div>
                </div>

                {/* Moves */}
                <div>
                  <Label text="Moves" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {moves.map((m, i) => (
                      <div key={i} style={{ fontSize: 11, color: m ? '#e2e8f0' : '#334155', textTransform: 'capitalize' }}>
                        {m ? `— ${m.replace(/-/g, ' ')}` : '—'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* EVs */}
                {evStr && (
                  <div>
                    <Label text="EVs" />
                    <div style={{ fontSize: 10, color: '#7dd3fc' }}>{evStr}</div>
                  </div>
                )}

                {/* IVs (perfect only) */}
                {ivStr && (
                  <div>
                    <Label text="31 IVs" />
                    <div style={{ fontSize: 10, color: '#86efac' }}>{ivStr}</div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* ── Watermark ── */}
      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#1e293b', letterSpacing: '0.06em' }}>
        pokemmo-wiki.vercel.app
      </div>
    </div>
  );
});

// ── Main Component ────────────────────────────────────────────────────────────

export default function TeamBuilderPage() {
  const [teams,          setTeams]          = useState<Team[]>([]);
  const [activeTeamId,   setActiveTeamId]   = useState<string | null>(null);
  const [pokemonByTeam,  setPokemonByTeam]  = useState<Record<string, TeamPokemon[]>>({});
  const [selectedSlot,   setSelectedSlot]   = useState<number | null>(null);
  const [showSearch,      setShowSearch]      = useState(false);
  const [showImport,      setShowImport]      = useState(false);
  const [importText,      setImportText]      = useState('');
  const [showImportCode,  setShowImportCode]  = useState(false);
  const [importCode,      setImportCode]      = useState('');
  const [importCodeErr,   setImportCodeErr]   = useState('');
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [userId,        setUserId]        = useState<string | null>(null);
  const [shareMsg,      setShareMsg]      = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportTypesMap, setExportTypesMap] = useState<Record<string, string[]>>({});
  const [editingName,   setEditingName]   = useState(false);
  const [teamName,      setTeamName]      = useState('');
  const [teamDesc,      setTeamDesc]      = useState('');
  const [teamPrice,     setTeamPrice]     = useState('');
  const [teamTags,      setTeamTags]      = useState<string[]>([]);
  const [showTagDrop,   setShowTagDrop]   = useState(false);
  const exportRef     = useRef<HTMLDivElement>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);

  // Derived view of the active team's Pokémon — all read sites stay unchanged
  const teamPokemon: TeamPokemon[] = activeTeamId ? (pokemonByTeam[activeTeamId] ?? []) : [];

  // Helper: update only the active team's slice in the map
  function setPokemonForTeam(teamId: string, updater: (prev: TeamPokemon[]) => TeamPokemon[]) {
    setPokemonByTeam(prev => ({ ...prev, [teamId]: updater(prev[teamId] ?? []) }));
  }

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

    // Batch-load pokemon for ALL teams in one query so sidebar sprites are populated immediately
    if (data && data.length > 0) {
      const teamIds = data.map(t => t.id);
      const { data: allPokemon } = await supabase
        .from('team_pokemon')
        .select('*')
        .in('team_id', teamIds)
        .order('slot');

      if (allPokemon) {
        const newMap: Record<string, TeamPokemon[]> = {};
        for (const team of data) {
          const slots = allPokemon.filter(p => p.team_id === team.id);
          newMap[team.id] = Array.from({ length: 6 }, (_, i) =>
            slots.find(p => p.slot === i + 1) ?? emptySlot(team.id, i + 1)
          );
        }
        setPokemonByTeam(newMap);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  // ── Load team pokemon when active team changes ────────────────────────────

  useEffect(() => {
    if (!activeTeamId) { setSelectedSlot(null); return; }

    const team = teams.find(t => t.id === activeTeamId);
    if (team) {
      setTeamName(team.name);
      setTeamDesc(team.description ?? '');
      setTeamPrice(team.price != null ? String(team.price) : '');
      setTeamTags(team.tags ?? []);
    }

    setSelectedSlot(null);

    // Skip fetch if already cached for this team
    if (pokemonByTeam[activeTeamId]) return;

    supabase
      .from('team_pokemon')
      .select('*')
      .eq('team_id', activeTeamId)
      .order('slot')
      .then(({ data }) => {
        const filled: TeamPokemon[] = Array.from({ length: 6 }, (_, i) =>
          (data ?? []).find(p => p.slot === i + 1) ?? emptySlot(activeTeamId, i + 1)
        );
        setPokemonByTeam(prev => ({ ...prev, [activeTeamId]: filled }));
      });
  // pokemonByTeam intentionally excluded — we only want to re-run on team switch
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPokemonByTeam(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (activeTeamId === id) setActiveTeamId(null);
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
        setPokemonForTeam(activeTeamId, prev => prev.map(tp => tp.slot === p.slot ? { ...p, id: data.id } : tp));
      }
    }
    // Touch updated_at on team
    await supabase.from('teams').update({ updated_at: new Date().toISOString() }).eq('id', activeTeamId);
  }

  // ── Remove pokemon from slot ──────────────────────────────────────────────

  async function removePokemon(slot: number) {
    if (!activeTeamId) return;
    await supabase.from('team_pokemon').delete().eq('team_id', activeTeamId).eq('slot', slot);
    setPokemonForTeam(activeTeamId, prev => prev.map(p => p.slot === slot ? emptySlot(activeTeamId, slot) : p));
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
    setPokemonForTeam(activeTeamId, prev => prev.map(tp => tp.slot === slot ? p : tp));
    setShowSearch(false);
    await savePokemon(p);
  }

  // ── Update pokemon ────────────────────────────────────────────────────────

  function updatePokemon(slot: number, updates: Partial<TeamPokemon>) {
    if (!activeTeamId) return;
    setPokemonForTeam(activeTeamId, prev => prev.map(p => p.slot === slot ? { ...p, ...updates } : p));
  }

  async function flushPokemon(slot: number) {
    const p = (activeTeamId ? (pokemonByTeam[activeTeamId] ?? []) : []).find(tp => tp.slot === slot);
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
    if (!exportCardRef.current || !activeTeam) return;
    setExportLoading(true);

    // Fetch types for all pokemon in the team
    const slugs = teamPokemon.map(p => p.pokemon_slug).filter(Boolean) as string[];
    if (slugs.length > 0) {
      const { data: pages } = await supabase
        .from('pages')
        .select('slug, metadata')
        .in('slug', slugs)
        .eq('template_type', 'pokemon');
      const map: Record<string, string[]> = {};
      for (const page of pages ?? []) {
        if (page.metadata?.types) map[page.slug] = page.metadata.types;
      }
      setExportTypesMap(map);
    }

    // Wait for re-render + all images to load
    await new Promise(res => setTimeout(res, 800));

    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(exportCardRef.current, {
      useCORS:         true,
      allowTaint:      false,
      backgroundColor: '#111827',
      scale:           2,
      logging:         false,
    });
    const link = document.createElement('a');
    link.download = `team-${activeTeam.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setExportLoading(false);
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
    setPokemonForTeam(activeTeamId, () => newPokemon);
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
    // Pre-populate cache for the new team so switching to it doesn't refetch
    const srcSlots = pokemonByTeam[team.id];
    if (srcSlots) {
      const cloned = srcSlots.map(p => ({ ...p, id: crypto.randomUUID(), team_id: newTeam.id }));
      setPokemonByTeam(prev => ({ ...prev, [newTeam.id]: cloned }));
    }
    setTeams(prev => [newTeam, ...prev]);
    setActiveTeamId(newTeam.id);
  }

  // ── Import team by share code ────────────────────────────────────────────

  async function importByCode() {
    if (!userId || !importCode.trim()) return;
    setImportCodeErr('');
    const code = importCode.trim().toUpperCase();

    const { data: srcTeam } = await supabase
      .from('teams')
      .select('*')
      .eq('share_code', code)
      .single();

    if (!srcTeam) {
      setImportCodeErr('Team not found. Check the code and try again.');
      return;
    }

    const newCode = generateShareCode();
    const { data: newTeam } = await supabase
      .from('teams')
      .insert({
        user_id:     userId,
        name:        `${srcTeam.name} (imported)`,
        description: srcTeam.description,
        price:       srcTeam.price,
        tags:        srcTeam.tags,
        share_code:  newCode,
      })
      .select()
      .single();

    if (!newTeam) { setImportCodeErr('Failed to create team.'); return; }

    const { data: srcPokemon } = await supabase
      .from('team_pokemon')
      .select('*')
      .eq('team_id', srcTeam.id)
      .order('slot');

    if (srcPokemon && srcPokemon.length > 0) {
      await supabase.from('team_pokemon').insert(
        srcPokemon.map(({ id: _id, team_id: _tid, ...rest }) => ({ ...rest, team_id: newTeam.id }))
      );
    }

    // Pre-populate cache
    const filled: TeamPokemon[] = Array.from({ length: 6 }, (_, i) =>
      (srcPokemon ?? []).find(p => p.slot === i + 1) ?? emptySlot(newTeam.id, i + 1)
    );
    setPokemonByTeam(prev => ({ ...prev, [newTeam.id]: filled }));
    setTeams(prev => [newTeam, ...prev]);
    setActiveTeamId(newTeam.id);
    setShowImportCode(false);
    setImportCode('');
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
          <div className="px-3 py-2 border-b border-gray-800">
            <button
              onClick={() => { setShowImportCode(true); setImportCodeErr(''); setImportCode(''); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg py-1.5 transition-colors"
            >
              <Upload size={12} /> Import by Code
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
                    const p = pokemonByTeam[team.id]?.[i];
                    if (!p?.pokemon_id) return (
                      <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border border-dashed border-gray-700" />
                    );
                    const base = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated`;
                    const src  = p.is_shiny ? `${base}/shiny/${p.pokemon_id}.gif` : `${base}/${p.pokemon_id}.gif`;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt={p.pokemon_name ?? ''} className="w-6 h-6 object-contain" />
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
                  <button
                    onClick={exportPng}
                    disabled={exportLoading}
                    className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                    title="Export PNG"
                  >
                    <Download size={12} />{exportLoading ? 'Exporting…' : 'PNG'}
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
              <div ref={exportRef} className="grid grid-cols-6 gap-3 p-4 bg-gray-900">
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

      {/* ── Off-screen Export Card ─────────────────────────────────────────── */}
      {activeTeam && (
        <ExportCard
          ref={exportCardRef}
          team={activeTeam}
          pokemon={teamPokemon}
          typesMap={exportTypesMap}
        />
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {showSearch && selectedSlot !== null && (
        <PokemonSearchModal
          onSelect={r => addPokemon(r, selectedSlot)}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showImportCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl p-6">
            <h3 className="font-bold text-white mb-1">Import Team by Code</h3>
            <p className="text-xs text-gray-500 mb-4">Enter a share code to copy someone's team into your account.</p>
            <input
              value={importCode}
              onChange={e => { setImportCode(e.target.value.toUpperCase()); setImportCodeErr(''); }}
              onKeyDown={e => e.key === 'Enter' && importByCode()}
              placeholder="XXXX-XXXX-XXXX"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white font-mono tracking-widest focus:outline-none focus:border-red-500 placeholder-gray-600 mb-2"
              maxLength={14}
            />
            {importCodeErr && (
              <p className="text-xs text-red-400 mb-2">{importCodeErr}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={importByCode} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
                Import
              </button>
              <button onClick={() => { setShowImportCode(false); setImportCode(''); setImportCodeErr(''); }} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
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
