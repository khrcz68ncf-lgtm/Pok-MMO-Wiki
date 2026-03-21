'use client';

import { useState, useCallback } from 'react';

type Stats = {
  hp: number; attack: number; defense: number;
  special_attack: number; special_defense: number; speed: number;
};

const STAT_META = [
  { key: 'hp',              label: 'HP',      bar: 'bg-green-500' },
  { key: 'attack',          label: 'ATK',     bar: 'bg-red-500'   },
  { key: 'defense',         label: 'DEF',     bar: 'bg-yellow-500'},
  { key: 'special_attack',  label: 'SpATK',   bar: 'bg-purple-500'},
  { key: 'special_defense', label: 'SpDEF',   bar: 'bg-orange-500'},
  { key: 'speed',           label: 'SPE',     bar: 'bg-cyan-500'  },
] as const;

// Stat key → short display label for the dropdown
const STAT_LABEL: Record<keyof Stats, string> = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  special_attack: 'SpATK', special_defense: 'SpDEF', speed: 'SPE',
};

// Index 0 = "No Nature" sentinel (neutral, shown as default).
// Indices 1-25 = the 25 real natures.
// Each entry: [name, boosted stat key | null, lowered stat key | null]
const NATURES: [string, keyof Stats | null, keyof Stats | null][] = [
  ['No Nature', null, null],          // index 0 — default
  ['Hardy',   null,              null],
  ['Lonely',  'attack',          'defense'],
  ['Brave',   'attack',          'speed'],
  ['Adamant', 'attack',          'special_attack'],
  ['Naughty', 'attack',          'special_defense'],
  ['Bold',    'defense',         'attack'],
  ['Docile',  null,              null],
  ['Relaxed', 'defense',         'speed'],
  ['Impish',  'defense',         'special_attack'],
  ['Lax',     'defense',         'special_defense'],
  ['Timid',   'speed',           'attack'],
  ['Hasty',   'speed',           'defense'],
  ['Serious', null,              null],
  ['Jolly',   'speed',           'special_attack'],
  ['Naive',   'speed',           'special_defense'],
  ['Modest',  'special_attack',  'attack'],
  ['Mild',    'special_attack',  'defense'],
  ['Quiet',   'special_attack',  'speed'],
  ['Bashful', null,              null],
  ['Rash',    'special_attack',  'special_defense'],
  ['Calm',    'special_defense', 'attack'],
  ['Gentle',  'special_defense', 'defense'],
  ['Sassy',   'special_defense', 'speed'],
  ['Careful', 'special_defense', 'special_attack'],
  ['Quirky',  null,              null],
];

function natureLabel([name, boosted, lowered]: typeof NATURES[number]): string {
  if (!boosted && !lowered) return `${name} (Neutral)`;
  return `${name} (+${STAT_LABEL[boosted!]} / -${STAT_LABEL[lowered!]})`;
}

function calcHP(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + level + 10);
}

function calcStat(base: number, iv: number, ev: number, level: number, nature: number): number {
  return Math.floor(Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + 5) * nature);
}

function natureMultiplier(
  statKey: keyof Stats,
  boosted: keyof Stats | null,
  lowered: keyof Stats | null
): number {
  if (boosted === statKey && lowered !== statKey) return 1.1;
  if (lowered === statKey && boosted !== statKey) return 0.9;
  return 1.0;
}

export default function StatCalculator({ baseStats }: { baseStats: Stats }) {
  const [level, setLevel] = useState(50);
  const [natureIdx, setNatureIdx] = useState(0); // "No Nature" (neutral, default)
  const [ivs, setIvs] = useState<Record<keyof Stats, number>>({
    hp: 31, attack: 31, defense: 31, special_attack: 31, special_defense: 31, speed: 31,
  });
  const [evs, setEvs] = useState<Record<keyof Stats, number>>({
    hp: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0,
  });

  const totalEvs = Object.values(evs).reduce((a, b) => a + b, 0);
  const [, boosted, lowered] = NATURES[natureIdx];

  const updateEv = useCallback((key: keyof Stats, raw: number) => {
    const val = Math.max(0, Math.min(252, raw));
    setEvs((prev) => {
      const next = { ...prev, [key]: val };
      const total = Object.values(next).reduce((a, b) => a + b, 0);
      if (total > 510) return prev; // reject if over cap
      return next;
    });
  }, []);

  const updateIv = useCallback((key: keyof Stats, raw: number) => {
    setIvs((prev) => ({ ...prev, [key]: Math.max(0, Math.min(31, raw)) }));
  }, []);

  const maxBase = 255;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Level</label>
          <input
            type="number" min={1} max={100} value={level}
            onChange={(e) => setLevel(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="w-20 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nature</label>
          <select
            value={natureIdx}
            onChange={(e) => setNatureIdx(Number(e.target.value))}
            className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-400"
          >
            {NATURES.map((nature, i) => (
              <option key={nature[0]} value={i}>{natureLabel(nature)}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-gray-500 self-end pb-2">
          EVs used: <span className={totalEvs > 510 ? 'text-red-400' : 'text-gray-300'}>{totalEvs}</span>/510
        </div>
      </div>

      {/* Stat rows */}
      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-[3rem_1fr_3rem_4rem_4rem_4rem] gap-2 text-xs text-gray-500 uppercase tracking-wider mb-1">
          <span>Stat</span>
          <span>Bar</span>
          <span className="text-center">Base</span>
          <span className="text-center">IV</span>
          <span className="text-center">EV</span>
          <span className="text-center">Total</span>
        </div>

        {STAT_META.map(({ key, label, bar }) => {
          const base = baseStats[key] ?? 0;
          const iv   = ivs[key];
          const ev   = evs[key];
          const nat  = key === 'hp' ? 1 : natureMultiplier(key, boosted, lowered);
          const total = key === 'hp'
            ? calcHP(base, iv, ev, level)
            : calcStat(base, iv, ev, level, nat);

          const barPct = Math.round((base / maxBase) * 100);
          const isUp   = nat > 1;
          const isDown = nat < 1;

          return (
            <div key={key} className="grid grid-cols-[3rem_1fr_3rem_4rem_4rem_4rem] gap-2 items-center">
              <span className={`text-xs font-semibold ${isUp ? 'text-red-400' : isDown ? 'text-blue-400' : 'text-gray-400'}`}>
                {label}
              </span>
              <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${barPct}%` }} />
              </div>
              <span className="text-center text-xs text-gray-300">{base}</span>
              <input
                type="number" min={0} max={31} value={iv}
                onChange={(e) => updateIv(key, Number(e.target.value))}
                className="w-full rounded bg-gray-800 border border-gray-700 px-1.5 py-1 text-xs text-center text-white focus:outline-none focus:border-red-400"
              />
              <input
                type="number" min={0} max={252} value={ev}
                onChange={(e) => updateEv(key, Number(e.target.value))}
                className="w-full rounded bg-gray-800 border border-gray-700 px-1.5 py-1 text-xs text-center text-white focus:outline-none focus:border-red-400"
              />
              <span className={`text-center text-sm font-semibold ${isUp ? 'text-red-400' : isDown ? 'text-blue-400' : 'text-white'}`}>
                {total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
