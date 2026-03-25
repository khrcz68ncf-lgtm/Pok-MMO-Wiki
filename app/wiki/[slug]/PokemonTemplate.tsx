'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import StatCalculator from './StatCalculator';
import { calcEffectiveness, TYPE_COLORS } from '@/lib/type-chart';
import TypeBadge from '@/app/components/TypeBadge';
import CategoryBadge from '@/app/components/CategoryBadge';

// ─── Types ───────────────────────────────────────────────────────────────────

type Ability  = { name: string; is_hidden: boolean };
type Move     = { name: string; method: string; level: number; type?: string; damage_class?: string; power?: number; accuracy?: number; pp?: number };
type Sprites  = { front?: string; front_shiny?: string; back?: string; official?: string };
type BaseStats = {
  hp: number; attack: number; defense: number;
  special_attack: number; special_defense: number; speed: number;
};

type PokemonMeta = {
  pokemon_id:       number;
  name:             string;
  types:            string[];
  abilities:        Ability[];
  stats:            BaseStats;
  height:           number;
  weight:           number;
  held_items:       { name: string; url: string }[];
  moves:            Move[];
  sprites:          Sprites;
  // Enriched fields
  flavor_text?:     string | null;
  genus?:           string | null;
  egg_groups?:      string[];
  gender_rate?:     number | null;
  capture_rate?:    number | null;
  hatch_counter?:   number | null;
};

export type EvolutionStep = {
  from_pokemon: string;
  to_pokemon:   string;
  min_level:    number | null;
  item:         string | null;
  trigger:      string | null;
  condition:    string | null;
};

type EggMove = { name: string; type?: string; damage_class?: string; power?: number; accuracy?: number; pp?: number };

type PageData = {
  title:     string;
  content:   string;
  category:  string | null;
  updated_at: string;
  metadata:  PokemonMeta;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STAT_META = [
  { key: 'hp'              as const, label: 'HP',    color: 'bg-green-500'  },
  { key: 'attack'          as const, label: 'ATK',   color: 'bg-red-500'    },
  { key: 'defense'         as const, label: 'DEF',   color: 'bg-yellow-500' },
  { key: 'special_attack'  as const, label: 'SpATK', color: 'bg-purple-500' },
  { key: 'special_defense' as const, label: 'SpDEF', color: 'bg-orange-500' },
  { key: 'speed'           as const, label: 'SPE',   color: 'bg-cyan-500'   },
];


function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-800 scroll-mt-6">
      {children}
    </h2>
  );
}

// ─── Infobox (sprite + number + types + abilities + stats) ───────────────────

function Infobox({ meta }: { meta: PokemonMeta }) {
  const [shiny, setShiny] = useState(false);
  const sprite = shiny ? meta.sprites.front_shiny : meta.sprites.front;
  const num = String(meta.pokemon_id).padStart(3, '0');

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-6 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
        {/* Sprite */}
        <div className="flex flex-col items-center bg-gray-800/50 px-4 pt-4 pb-2">
          {sprite ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sprite}
              alt={meta.name}
              className="w-28 h-28 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="w-28 h-28 flex items-center justify-center text-gray-600 text-sm">
              No sprite
            </div>
          )}
          <button
            onClick={() => setShiny((s) => !s)}
            className={`mt-2 mb-1 text-xs px-3 py-1 rounded-full border transition-colors ${
              shiny
                ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                : 'border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            ✨ {shiny ? 'Shiny' : 'Normal'}
          </button>
        </div>

        <div className="px-4 py-4 space-y-4 text-sm">
          {/* Number + Genus */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Number</p>
            <p className="font-mono font-bold text-white text-lg">#{num}</p>
            {meta.genus && (
              <p className="text-xs text-gray-400 mt-0.5">{meta.genus}</p>
            )}
          </div>

          {/* Flavor text */}
          {meta.flavor_text && (
            <div>
              <p className="text-xs text-gray-500 italic leading-relaxed">{meta.flavor_text}</p>
            </div>
          )}

          {/* Types */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Type</p>
            <div className="flex gap-1.5 flex-wrap items-center">
              {meta.types.map((t) => <TypeBadge key={t} type={t} className="h-6" />)}
            </div>
          </div>

          {/* Abilities */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Abilities</p>
            <ul className="space-y-1.5">
              {meta.abilities.map((a) => (
                <li key={a.name} className="flex items-center gap-2">
                  <span className="capitalize text-gray-200">{a.name.replace(/-/g, ' ')}</span>
                  {a.is_hidden && (
                    <span className="text-[10px] bg-purple-500/20 border border-purple-500/40 text-purple-400 px-1.5 py-0.5 rounded font-medium">
                      Hidden
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Base stats bars */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Base Stats</p>
            <div className="space-y-1.5">
              {STAT_META.map(({ key, label, color }) => {
                const val = meta.stats?.[key] ?? 0;
                const pct = Math.round((val / 255) * 100);
                return (
                  <div key={key} className="grid grid-cols-[3rem_1fr_2rem] gap-1.5 items-center">
                    <span className="text-xs text-gray-500">{label}</span>
                    <div className="h-1.5 rounded-full bg-gray-800">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-right text-gray-300">{val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Height / Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Height</p>
              <p className="text-gray-200">{(meta.height / 10).toFixed(1)} m</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Weight</p>
              <p className="text-gray-200">{(meta.weight / 10).toFixed(1)} kg</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Type effectiveness section ───────────────────────────────────────────────

function TypeChart({ types }: { types: string[] }) {
  const eff = calcEffectiveness(types);

  const groups: { label: string; items: string[]; bg: string; text: string; mult: string }[] = [
    { label: 'Weak ×4',    items: eff.quadruple, bg: 'bg-red-900/40',   text: 'text-red-300',   mult: '4×'   },
    { label: 'Weak ×2',    items: eff.double,    bg: 'bg-red-900/20',   text: 'text-red-400',   mult: '2×'   },
    { label: 'Resist ½',   items: eff.half,      bg: 'bg-green-900/20', text: 'text-green-400', mult: '½×'   },
    { label: 'Resist ¼',   items: eff.quarter,   bg: 'bg-green-900/40', text: 'text-green-300', mult: '¼×'   },
    { label: 'Immune ×0',  items: eff.immune,    bg: 'bg-gray-800',     text: 'text-gray-400',  mult: '0×'   },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.label} className={`rounded-lg ${g.bg} px-4 py-3`}>
          <span className={`text-xs font-bold uppercase tracking-widest ${g.text} block mb-2`}>
            {g.label}
          </span>
          <div className="flex flex-wrap gap-1.5 items-center">
            {g.items.map((t) => (
              <TypeBadge key={t} type={t} className="h-5" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Moves section ────────────────────────────────────────────────────────────

type MoveTab = 'level-up' | 'machine' | 'egg';

function MovesTable({ moves }: { moves: Move[] }) {
  const [tab, setTab] = useState<MoveTab>('level-up');

  const filtered = moves
    .filter((m) => {
      if (tab === 'level-up') return m.method === 'level-up';
      if (tab === 'machine')  return m.method === 'machine';
      if (tab === 'egg')      return m.method === 'egg';
      return false;
    })
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const tabs: { id: MoveTab; label: string }[] = [
    { id: 'level-up', label: 'Level Up' },
    { id: 'machine',  label: 'TM/HM'   },
    { id: 'egg',      label: 'Egg Moves'},
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No moves in this category.</p>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="px-4 py-2.5 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">
                  {tab === 'level-up' ? 'Lv.' : 'Method'}
                </th>
                <th className="px-4 py-2.5 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Move</th>
                <th className="px-4 py-2.5 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Type</th>
                <th className="px-4 py-2.5 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Cat.</th>
                <th className="px-4 py-2.5 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold">Pwr.</th>
                <th className="px-4 py-2.5 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold">Acc.</th>
                <th className="px-4 py-2.5 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold">PP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const moveSlug = m.name.toLowerCase().replace(/\s+/g, '-');
                return (
                  <tr key={`${m.name}-${i}`} className={`border-b border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-900/30'}`}>
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">
                      {tab === 'level-up' ? (m.level === 0 ? '—' : m.level) : m.method}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/wiki/${moveSlug}`}
                        className="capitalize text-gray-200 hover:text-red-400 transition-colors"
                      >
                        {m.name.replace(/-/g, ' ')}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      {m.type ? <TypeBadge type={m.type} className="h-5" /> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {m.damage_class ? <CategoryBadge category={m.damage_class} className="h-5" /> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-300 font-mono text-xs">
                      {m.power != null ? m.power : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-300 font-mono text-xs">
                      {m.accuracy != null ? `${m.accuracy}%` : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-300 font-mono text-xs">
                      {m.pp != null ? m.pp : <span className="text-gray-600">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Evolution Chain ──────────────────────────────────────────────────────────

function EvolutionChainDisplay({
  chain,
  pokemonMap,
  currentPokemon,
}: {
  chain:          EvolutionStep[];
  pokemonMap:     Record<string, number>;
  currentPokemon: string;
}) {
  // Build ordered list: find root (appears as from but never as to), then follow chain
  const toSet = new Set(chain.map(s => s.to_pokemon));
  const roots = [...new Set(chain.map(s => s.from_pokemon))].filter(p => !toSet.has(p));
  const root  = roots[0] ?? chain[0]?.from_pokemon;

  // Build map: from_pokemon → steps
  const stepsMap = new Map<string, EvolutionStep[]>();
  for (const step of chain) {
    if (!stepsMap.has(step.from_pokemon)) stepsMap.set(step.from_pokemon, []);
    stepsMap.get(step.from_pokemon)!.push(step);
  }

  // Flatten for linear chains; for branching, show all branches inline
  function renderFrom(name: string): React.ReactNode {
    const steps = stepsMap.get(name);
    const id    = pokemonMap[name] ?? null;
    const sprite = id
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`
      : null;
    const isCurrent = name === currentPokemon;

    const node = (
      <Link
        href={`/wiki/${name}`}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors min-w-[72px] ${
          isCurrent
            ? 'bg-red-500/10 border-red-500/50 text-red-400'
            : 'bg-gray-900 border-gray-800 hover:border-gray-600 text-gray-300'
        }`}
      >
        {sprite
          ? <img src={sprite} alt={name} className="w-12 h-12 object-contain" /> /* eslint-disable-line @next/next/no-img-element */
          : <div className="w-12 h-12 rounded-full bg-gray-800" />
        }
        <span className="text-xs font-medium capitalize text-center leading-tight">
          {name.replace(/-/g, ' ')}
        </span>
      </Link>
    );

    if (!steps || steps.length === 0) return <div key={name}>{node}</div>;

    return (
      <div key={name} className="flex items-center gap-3 flex-wrap">
        {node}
        <div className="flex flex-col gap-3">
          {steps.map((step, i) => {
            const condition = step.min_level
              ? `Lv. ${step.min_level}`
              : step.item
                ? step.item.replace(/-/g, ' ')
                : step.trigger
                  ? step.trigger.replace(/-/g, ' ')
                  : step.condition ?? 'Evolve';
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-gray-600 text-lg">→</span>
                  <span className="text-[10px] text-gray-500 capitalize text-center max-w-[60px] leading-tight">
                    {condition}
                  </span>
                </div>
                {renderFrom(step.to_pokemon)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!root) return <p className="text-gray-500 text-sm">No evolution data.</p>;

  return (
    <div className="flex flex-wrap gap-3 items-start">
      {renderFrom(root)}
    </div>
  );
}

// ─── TOC sidebar ──────────────────────────────────────────────────────────────

function TableOfContents() {
  const sections = [
    { id: 'locations',  label: 'Locations'      },
    { id: 'evolution',  label: 'Evolution'      },
    { id: 'types',      label: 'Type Chart'     },
    { id: 'base-stats', label: 'Base Stats'     },
    { id: 'moves',      label: 'Moves'          },
    { id: 'egg-moves',  label: 'Egg Moves'      },
    { id: 'breeding',   label: 'Breeding'       },
    { id: 'history',    label: 'History'        },
  ];

  return (
    <nav className="sticky top-6 hidden xl:block w-44 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Contents</p>
      <ul className="space-y-1.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="text-sm text-gray-400 hover:text-white transition-colors block"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ─── Main template ────────────────────────────────────────────────────────────

export default function PokemonTemplate({
  page,
  evolutionChain,
  evolutionPokemonMap,
  eggMovesData,
}: {
  page:                PageData;
  evolutionChain?:     EvolutionStep[];
  evolutionPokemonMap?: Record<string, number>;
  eggMovesData?:       EggMove[];
}) {
  const meta = page.metadata;
  const name = meta.name
    ? meta.name.charAt(0).toUpperCase() + meta.name.slice(1)
    : page.title;

  const typeLinks = meta.types?.map((t) => (
    <Link key={t} href={`/wiki/${t}`} className="font-semibold" style={{ color: TYPE_COLORS[t] ?? 'inherit' }}>
      {t.charAt(0).toUpperCase() + t.slice(1)}
    </Link>
  ));

  const typeText = typeLinks?.length === 2
    ? <>{typeLinks[0]}/{typeLinks[1]}</>
    : typeLinks?.[0];

  return (
    <div className="flex gap-6 relative">
      {/* Left TOC */}
      <TableOfContents />

      {/* Main column */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight mb-3 capitalize">{name}</h1>

        {/* Intro */}
        <p className="text-gray-300 leading-relaxed mb-8">
          <Link href={`/wiki/${meta.name}`} className="font-semibold text-white hover:text-red-400 transition-colors capitalize">
            {name}
          </Link>{' '}
          is a {typeText}-type Pokémon available in PokéMMO.
        </p>

        {/* Locations */}
        <section className="mb-10">
          <SectionHeading id="locations">Locations</SectionHeading>
          <p className="text-gray-500 text-sm">No wild locations found.</p>
        </section>

        {/* Evolution Chain */}
        <section className="mb-10">
          <SectionHeading id="evolution">Evolution Chain</SectionHeading>
          {evolutionChain && evolutionChain.length > 0 ? (
            <EvolutionChainDisplay
              chain={evolutionChain}
              pokemonMap={evolutionPokemonMap ?? {}}
              currentPokemon={meta.name}
            />
          ) : (
            <p className="text-gray-500 text-sm">This Pokémon does not evolve.</p>
          )}
        </section>

        {/* Type chart */}
        <section className="mb-10">
          <SectionHeading id="types">Type Effectiveness</SectionHeading>
          {meta.types?.length ? (
            <TypeChart types={meta.types} />
          ) : (
            <p className="text-gray-500 text-sm">No type data.</p>
          )}
        </section>

        {/* Stat calculator */}
        <section className="mb-10">
          <SectionHeading id="base-stats">Base Stats</SectionHeading>
          {meta.stats ? (
            <StatCalculator baseStats={meta.stats} />
          ) : (
            <p className="text-gray-500 text-sm">No stat data.</p>
          )}
        </section>

        {/* Moves */}
        <section className="mb-10">
          <SectionHeading id="moves">Moves</SectionHeading>
          {meta.moves?.length ? (
            <MovesTable moves={meta.moves} />
          ) : (
            <p className="text-gray-500 text-sm">No move data.</p>
          )}
        </section>

        {/* Egg Moves */}
        <section className="mb-10">
          <SectionHeading id="egg-moves">Egg Moves</SectionHeading>
          {eggMovesData && eggMovesData.length > 0 ? (
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-800">
                    <th className="px-4 py-2.5 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Move</th>
                    <th className="px-4 py-2.5 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Type</th>
                    <th className="px-4 py-2.5 text-left text-xs uppercase tracking-widest text-gray-500 font-semibold">Cat.</th>
                    <th className="px-4 py-2.5 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold">Pwr.</th>
                    <th className="px-4 py-2.5 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold">Acc.</th>
                    <th className="px-4 py-2.5 text-right text-xs uppercase tracking-widest text-gray-500 font-semibold">PP</th>
                  </tr>
                </thead>
                <tbody>
                  {eggMovesData.map((m, i) => {
                    const moveSlug = m.name.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <tr key={m.name} className={`border-b border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-900/30'}`}>
                        <td className="px-4 py-2.5">
                          <Link href={`/wiki/${moveSlug}`} className="capitalize text-gray-200 hover:text-red-400 transition-colors">
                            {m.name.replace(/-/g, ' ')}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          {m.type ? <TypeBadge type={m.type} className="h-5" /> : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {m.damage_class ? <CategoryBadge category={m.damage_class} className="h-5" /> : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-300 font-mono text-xs">
                          {m.power != null ? m.power : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-300 font-mono text-xs">
                          {m.accuracy != null ? `${m.accuracy}%` : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-300 font-mono text-xs">
                          {m.pp != null ? m.pp : <span className="text-gray-600">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No egg moves for this Pokémon.</p>
          )}
        </section>

        {/* Breeding */}
        <section className="mb-10">
          <SectionHeading id="breeding">Breeding</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {/* Egg Groups */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Egg Groups</p>
              {meta.egg_groups && meta.egg_groups.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {meta.egg_groups.map(g => (
                    <Link
                      key={g}
                      href={`/wiki/egg-group/${g}`}
                      className="text-gray-200 capitalize hover:text-red-400 transition-colors"
                    >
                      {g.replace(/-/g, ' ')}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>

            {/* Gender Ratio */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Gender</p>
              {meta.gender_rate === -1 ? (
                <p className="text-gray-300">Genderless</p>
              ) : meta.gender_rate != null ? (
                <p className="text-gray-300">
                  {((8 - meta.gender_rate) / 8 * 100).toFixed(1)}% ♂ /{' '}
                  {(meta.gender_rate / 8 * 100).toFixed(1)}% ♀
                </p>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>

            {/* Catch Rate */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Catch Rate</p>
              <p className="text-gray-300">
                {meta.capture_rate != null ? meta.capture_rate : '—'}
              </p>
            </div>

            {/* Hatch Counter */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Hatch Steps</p>
              <p className="text-gray-300">
                {meta.hatch_counter != null
                  ? `~${((meta.hatch_counter + 1) * 255).toLocaleString()}`
                  : '—'
                }
              </p>
            </div>
          </div>

          {/* Wild held items */}
          {meta.held_items?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Wild Held Items</p>
              <div className="flex flex-wrap gap-2">
                {meta.held_items.map(h => (
                  <Link
                    key={h.name}
                    href={`/wiki/${h.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm capitalize text-gray-300 bg-gray-900 border border-gray-800 px-3 py-1 rounded-lg hover:border-gray-600 transition-colors"
                  >
                    {h.name.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* History / content */}
        <section className="mb-10">
          <SectionHeading id="history">History</SectionHeading>
          {page.content?.trim() ? (
            <div className="text-sm text-gray-300 leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 text-gray-300">{children}</p>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-white mt-5 mb-2">{children}</h2>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 text-gray-300 space-y-1">{children}</ul>,
                  a: ({ href, children }) => <a href={href} className="text-red-400 underline hover:text-red-300">{children}</a>,
                  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                }}
              >
                {page.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No history added yet.</p>
          )}
        </section>
      </div>

      {/* Right infobox */}
      <Infobox meta={meta} />
    </div>
  );
}
