'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type SeedColor = 'spicy' | 'sweet' | 'bitter' | 'sour' | 'dry';
type Seed = { color: SeedColor; amount: number; type: 'plain' | 'very' };

type Berry = {
  id: string;
  name_fr: string;
  name_en: string;
  growth_time: number;
  min_yield: number;
  max_yield: number;
  seeds: Seed[];
  effect: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SEED_LABEL: Record<SeedColor, string> = {
  spicy: 'Spicy', sweet: 'Sweet', bitter: 'Bitter', sour: 'Sour', dry: 'Dry',
};

// Fallback dot colors for legend / error states
const SEED_DOT: Record<SeedColor, string> = {
  spicy:  'bg-orange-500',
  sweet:  'bg-pink-500',
  bitter: 'bg-green-500',
  sour:   'bg-yellow-400',
  dry:    'bg-blue-500',
};

function seedImg(color: SeedColor, type: 'plain' | 'very'): string {
  return `/seeds/${type}-${color}.png`;
}

const GROWTH_BADGE: Record<number, string> = {
  16: 'bg-green-900/60 text-green-400 border-green-700/50',
  20: 'bg-blue-900/60 text-blue-400 border-blue-700/50',
  42: 'bg-yellow-900/60 text-yellow-400 border-yellow-700/50',
  44: 'bg-orange-900/60 text-orange-400 border-orange-700/50',
  67: 'bg-red-900/60 text-red-400 border-red-700/50',
};

// Each growth time splits into 4 stages (5 for 67h); water at each stage boundary
const GROWTH_INFO: Record<number, { stageHours: number; stages: number }> = {
  16: { stageHours: 4,    stages: 4 },
  20: { stageHours: 5,    stages: 4 },
  42: { stageHours: 10.5, stages: 4 },
  44: { stageHours: 11,   stages: 4 },
  67: { stageHours: 13.4, stages: 5 },
};

const GROWTH_TIMES = [16, 20, 42, 44, 67];

const REGION_PLOTS = [
  { name: 'Hoenn',  max: 33  },
  { name: 'Sinnoh', max: 98  },
  { name: 'Unova',  max: 158 },
];
const MAX_PLOTS = 289;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function berryImg(name_en: string) {
  // "Cheri Berry" → "cheri-berry", "Razz Berry" → "razz-berry"
  const slug = name_en.toLowerCase().replace(/\s+/g, '-');
  // Strip trailing "-berry" if already present, then append it
  const base = slug.endsWith('-berry') ? slug : `${slug}-berry`;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${base}.png`;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ready to harvest!';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
}

function getWateringSchedule(plantedAt: Date, growthTime: number): Date[] {
  const info = GROWTH_INFO[growthTime];
  if (!info) return [];
  return Array.from({ length: info.stages - 1 }, (_, i) =>
    new Date(plantedAt.getTime() + (i + 1) * info.stageHours * 3_600_000)
  );
}

function fmtDate(d: Date) {
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Tiny shared components ───────────────────────────────────────────────────

function SeedDisplay({ seeds }: { seeds: Seed[] }) {
  if (!seeds?.length) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {seeds.map((seed, i) => (
        <span
          key={i}
          className="flex items-center gap-1"
          title={`${seed.amount}× ${seed.type === 'very' ? 'Very ' : ''}${SEED_LABEL[seed.color]} Seed`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={seedImg(seed.color, seed.type)}
            alt={`${seed.type} ${seed.color} seed`}
            className="h-6 w-6 object-contain inline-block"
          />
          <span className="text-xs text-gray-400 font-mono">x{seed.amount}</span>
        </span>
      ))}
    </div>
  );
}

function BerrySprite({ name_en }: { name_en: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-8 h-8 rounded-full bg-green-900/60 border border-green-700/40 flex items-center justify-center text-green-400 font-bold text-sm shrink-0 select-none">
        {name_en.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={berryImg(name_en)}
      alt={name_en}
      className="w-8 h-8 object-contain shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

function GrowthBadge({ hours }: { hours: number }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-semibold ${GROWTH_BADGE[hours] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
      {hours}h
    </span>
  );
}

// ─── Edit Modal (admin) ───────────────────────────────────────────────────────

function EditModal({ berry, onClose, onSave }: { berry: Berry; onClose: () => void; onSave: (b: Berry) => void }) {
  const [form, setForm] = useState({
    name_fr:     berry.name_fr,
    name_en:     berry.name_en,
    growth_time: berry.growth_time,
    min_yield:   berry.min_yield,
    max_yield:   berry.max_yield,
    seeds:       JSON.stringify(berry.seeds, null, 2),
    effect:      berry.effect ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    let parsedSeeds: Seed[];
    try { parsedSeeds = JSON.parse(form.seeds); }
    catch { setError('Invalid JSON in seeds field.'); setSaving(false); return; }

    const { error: err } = await supabase.from('berries').update({
      name_fr:     form.name_fr,
      name_en:     form.name_en,
      growth_time: Number(form.growth_time),
      min_yield:   Number(form.min_yield),
      max_yield:   Number(form.max_yield),
      seeds:       parsedSeeds,
      effect:      form.effect || null,
    }).eq('id', berry.id);

    if (err) { setError(err.message); setSaving(false); return; }
    onSave({ ...berry, ...form, growth_time: Number(form.growth_time), min_yield: Number(form.min_yield), max_yield: Number(form.max_yield), seeds: parsedSeeds, effect: form.effect || null });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Edit Berry</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {(['name_fr', 'name_en'] as const).map((field) => (
              <label key={field} className="block">
                <span className="text-xs text-gray-500">{field === 'name_fr' ? 'Name (FR)' : 'Name (EN)'}</span>
                <input
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {([['growth_time', 'Growth (h)'], ['min_yield', 'Min yield'], ['max_yield', 'Max yield']] as const).map(([field, label]) => (
              <label key={field} className="block">
                <span className="text-xs text-gray-500">{label}</span>
                <input
                  type="number"
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </label>
            ))}
          </div>

          <label className="block">
            <span className="text-xs text-gray-500">Seeds (JSON)</span>
            <textarea
              value={form.seeds}
              onChange={(e) => setForm((f) => ({ ...f, seeds: e.target.value }))}
              rows={6}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-green-400 font-mono focus:outline-none focus:border-gray-500 resize-none"
            />
          </label>

          <label className="block">
            <span className="text-xs text-gray-500">Effect</span>
            <textarea
              value={form.effect}
              onChange={(e) => setForm((f) => ({ ...f, effect: e.target.value }))}
              rows={2}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 resize-none"
              placeholder="e.g. Cures paralysis when held"
            />
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:text-white transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: Berry Guide ───────────────────────────────────────────────────────

function BerryGuide({ berries, isAdmin, onUpdate }: { berries: Berry[]; isAdmin: boolean; onUpdate: (b: Berry) => void }) {
  const [search, setSearch]           = useState('');
  const [growthFilter, setGrowthFilter] = useState<number | null>(null);
  const [editMode, setEditMode]       = useState(false);
  const [editingBerry, setEditingBerry] = useState<Berry | null>(null);

  const filtered = berries.filter((b) => {
    if (growthFilter && b.growth_time !== growthFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.name_en.toLowerCase().includes(q) || b.name_fr.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search berries…"
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 w-44"
          />
          {[null, ...GROWTH_TIMES].map((t) => (
            <button
              key={t ?? 'all'}
              onClick={() => setGrowthFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${growthFilter === t ? 'bg-gray-700 border-gray-500 text-white' : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}
            >
              {t === null ? 'All' : `${t}h`}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`rounded-lg border px-4 py-2 text-sm transition-all ${editMode ? 'bg-red-500/20 border-red-500/60 text-red-400' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'}`}
          >
            {editMode ? '✓ Edit mode ON' : '✏️ Edit Berries'}
          </button>
        )}
      </div>

      {/* Seed legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {(Object.keys(SEED_LABEL) as SeedColor[]).map(color => (
          <span key={color} className="flex items-center gap-1.5 text-xs text-gray-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={seedImg(color, 'plain')} alt="" className="h-5 w-5 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={seedImg(color, 'very')}  alt="" className="h-5 w-5 object-contain" />
            {SEED_LABEL[color]}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/60 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-48">Berry</th>
                <th className="text-center px-4 py-3">Growth</th>
                <th className="text-center px-4 py-3">Yield</th>
                <th className="text-left px-4 py-3">Seeds</th>
                <th className="text-center px-4 py-3 whitespace-nowrap">Waterings</th>
                <th className="text-left px-4 py-3">Effect</th>
                {editMode && <th className="px-4 py-3 w-16" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map((berry) => {
                const info = GROWTH_INFO[berry.growth_time];
                return (
                  <tr key={berry.id} className="hover:bg-gray-900/40 transition-colors group">
                    {/* Name + sprite */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BerrySprite name_en={berry.name_en} />
                        <div>
                          <p className="font-semibold text-gray-200 leading-tight">{berry.name_en}</p>
                          <p className="text-xs text-gray-500">{berry.name_fr}</p>
                        </div>
                      </div>
                    </td>
                    {/* Growth */}
                    <td className="px-4 py-3 text-center">
                      <GrowthBadge hours={berry.growth_time} />
                    </td>
                    {/* Yield */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-300 font-mono text-xs tabular-nums">
                        {berry.min_yield}–{berry.max_yield}
                      </span>
                    </td>
                    {/* Seeds */}
                    <td className="px-4 py-3">
                      <SeedDisplay seeds={berry.seeds} />
                    </td>
                    {/* Waterings */}
                    <td className="px-4 py-3 text-center">
                      {info ? (
                        <div className="text-xs text-gray-400 leading-tight">
                          <span className="block font-mono font-semibold">{info.stages - 1}×</span>
                          <span className="text-gray-600">≤{info.stageHours}h apart</span>
                        </div>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    {/* Effect */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-gray-500 truncate" title={berry.effect ?? undefined}>
                        {berry.effect ?? '—'}
                      </p>
                    </td>
                    {/* Edit */}
                    {editMode && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingBerry(berry)}
                          className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={editMode ? 7 : 6} className="px-4 py-12 text-center text-gray-600 text-sm">
                    No berries match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-700 mt-3">{filtered.length} of {berries.length} berries shown</p>

      {editingBerry && (
        <EditModal
          berry={editingBerry}
          onClose={() => setEditingBerry(null)}
          onSave={(updated) => { onUpdate(updated); setEditingBerry(null); }}
        />
      )}
    </div>
  );
}

// ─── Tab 2: Berry Calculator ──────────────────────────────────────────────────

function BerryCalculator({ berries }: { berries: Berry[] }) {
  const [selectedId, setSelectedId]   = useState('');
  const [plants, setPlants]           = useState(289);
  const [useRegions, setUseRegions]   = useState(false);
  const [regionCounts, setRegionCounts] = useState({ Hoenn: 33, Sinnoh: 98, Unova: 158 });
  const [pricePerBerry, setPricePerBerry] = useState('');
  const [plantedAt, setPlantedAt]     = useState('');
  const [now, setNow]                 = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const berry      = berries.find((b) => b.id === selectedId) ?? null;
  const totalPlants = useRegions ? Object.values(regionCounts).reduce((a, b) => a + b, 0) : plants;
  const planted    = plantedAt ? new Date(plantedAt) : null;
  const harvestAt  = berry && planted ? new Date(planted.getTime() + berry.growth_time * 3_600_000) : null;
  const msToHarvest = harvestAt ? harvestAt.getTime() - now : null;
  const wateringSchedule = berry && planted ? getWateringSchedule(planted, berry.growth_time) : [];
  const price      = Number(pricePerBerry) || 0;

  const minBerries = berry ? berry.min_yield * totalPlants : 0;
  const maxBerries = berry ? berry.max_yield * totalPlants : 0;

  function urgencyClass(date: Date) {
    const diff = date.getTime() - now;
    if (diff < 0)             return 'bg-gray-800/60 text-gray-600 border-gray-700/50';
    if (diff < 30 * 60_000)  return 'bg-red-900/50 text-red-400 border-red-700/50';
    if (diff < 2 * 3_600_000) return 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50';
    return 'bg-green-900/40 text-green-400 border-green-700/50';
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Berry selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Select a Berry</label>
        <div className="flex items-center gap-3">
          {berry && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={berryImg(berry.name_en)} alt={berry.name_en} className="w-10 h-10 object-contain shrink-0" />
          )}
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-gray-500"
          >
            <option value="">— Choose a berry —</option>
            {berries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name_en} / {b.name_fr} ({b.growth_time}h)
              </option>
            ))}
          </select>
        </div>
        {berry && (
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <GrowthBadge hours={berry.growth_time} />
            <span>Yield: {berry.min_yield}–{berry.max_yield} per plant</span>
            <span>Water: {GROWTH_INFO[berry.growth_time]?.stages - 1}× every {GROWTH_INFO[berry.growth_time]?.stageHours}h</span>
          </div>
        )}
      </div>

      {/* Plants */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-300">Number of Plants</label>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useRegions}
              onChange={(e) => setUseRegions(e.target.checked)}
              className="rounded border-gray-600"
            />
            Split by region
          </label>
        </div>

        {useRegions ? (
          <div className="grid grid-cols-3 gap-3">
            {REGION_PLOTS.map((r) => (
              <label key={r.name} className="block">
                <span className="text-xs text-gray-500">{r.name} (max {r.max})</span>
                <input
                  type="number" min={0} max={r.max}
                  value={regionCounts[r.name as keyof typeof regionCounts]}
                  onChange={(e) => setRegionCounts((prev) => ({
                    ...prev,
                    [r.name]: Math.min(r.max, Math.max(0, Number(e.target.value))),
                  }))}
                  className="mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </label>
            ))}
          </div>
        ) : (
          <input
            type="number" min={1} max={MAX_PLOTS}
            value={plants}
            onChange={(e) => setPlants(Math.min(MAX_PLOTS, Math.max(1, Number(e.target.value))))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          />
        )}
        <p className="text-xs text-gray-600 mt-1">
          Total: <span className="font-semibold text-gray-400">{totalPlants}</span> plants
          {' '}(max {MAX_PLOTS}: 33 Hoenn + 98 Sinnoh + 158 Unova)
        </p>
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Price per Berry (Pokéyen)</label>
        <input
          type="number" min={0}
          value={pricePerBerry}
          onChange={(e) => setPricePerBerry(e.target.value)}
          placeholder="0"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
        />
      </div>

      {/* Plant time */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">When did you plant?</label>
        <input
          type="datetime-local"
          value={plantedAt}
          onChange={(e) => setPlantedAt(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 [color-scheme:dark]"
        />
      </div>

      {/* Results panel */}
      {berry && (
        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={berryImg(berry.name_en)} alt="" className="w-6 h-6 object-contain" />
            Results for {berry.name_en}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Harvest time */}
            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-3">
              <p className="text-xs text-gray-500 mb-1">Harvest time</p>
              {harvestAt ? (
                <p className="text-sm font-semibold text-gray-200">{fmtDate(harvestAt)}</p>
              ) : (
                <p className="text-sm text-gray-600">Set plant time above</p>
              )}
            </div>

            {/* Countdown */}
            <div className={`rounded-xl border p-3 transition-colors ${msToHarvest !== null && msToHarvest <= 0 ? 'bg-green-900/30 border-green-700/50' : 'bg-gray-800/60 border-gray-700'}`}>
              <p className="text-xs text-gray-500 mb-1">Time to harvest</p>
              {msToHarvest !== null ? (
                <p className={`text-sm font-semibold font-mono tabular-nums ${msToHarvest <= 0 ? 'text-green-400' : 'text-gray-200'}`}>
                  {formatCountdown(msToHarvest)}
                </p>
              ) : (
                <p className="text-sm text-gray-600">—</p>
              )}
            </div>

            {/* Berries */}
            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-3">
              <p className="text-xs text-gray-500 mb-1">Total berries</p>
              <p className="text-sm font-semibold text-gray-200 tabular-nums">
                {minBerries.toLocaleString()} – {maxBerries.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">{berry.min_yield}–{berry.max_yield} × {totalPlants} plants</p>
            </div>

            {/* Revenue */}
            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-3">
              <p className="text-xs text-gray-500 mb-1">Revenue</p>
              {price > 0 ? (
                <>
                  <p className="text-sm font-semibold text-gray-200 tabular-nums">
                    {(minBerries * price).toLocaleString()} – {(maxBerries * price).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">Pokéyen at {price.toLocaleString()}¥/berry</p>
                </>
              ) : (
                <p className="text-sm text-gray-600">Enter price above</p>
              )}
            </div>
          </div>

          {/* Watering schedule */}
          {planted && wateringSchedule.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold">
                Watering schedule — water every {GROWTH_INFO[berry.growth_time]?.stageHours}h for max yield
              </p>
              <div className="space-y-2">
                {wateringSchedule.map((date, i) => {
                  const isPast = date.getTime() < now;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${urgencyClass(date)}`}
                    >
                      <span className="text-xs font-bold w-20 shrink-0">Watering {i + 1}</span>
                      <span className="text-xs font-mono flex-1">{fmtDate(date)}</span>
                      {isPast ? (
                        <span className="text-xs font-semibold">✓ Done</span>
                      ) : (
                        <span className="text-xs font-mono tabular-nums shrink-0">
                          {formatCountdown(date.getTime() - now)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Next watering due */}
              {(() => {
                const next = wateringSchedule.find((d) => d.getTime() > now);
                if (!next) return null;
                const diff = next.getTime() - now;
                const isUrgent = diff < 30 * 60_000;
                const isWarning = diff < 2 * 3_600_000;
                return (
                  <div className={`mt-3 rounded-xl border px-4 py-3 flex items-center gap-3 ${isUrgent ? 'bg-red-900/40 border-red-700/60' : isWarning ? 'bg-yellow-900/40 border-yellow-700/60' : 'bg-gray-800/60 border-gray-700'}`}>
                    <span className="text-lg">{isUrgent ? '🚨' : isWarning ? '⚠️' : '💧'}</span>
                    <div>
                      <p className={`text-xs font-bold ${isUrgent ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-300'}`}>
                        Next watering due
                      </p>
                      <p className="text-xs text-gray-400 font-mono tabular-nums">
                        {fmtDate(next)} — in {formatCountdown(diff)}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BerriesPage() {
  const [berries, setBerries] = useState<Berry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab]         = useState<'guide' | 'calculator'>('guide');

  useEffect(() => {
    async function load() {
      const [{ data: berryData }, { data: { session } }] = await Promise.all([
        supabase.from('berries').select('*').order('name_en'),
        supabase.auth.getSession(),
      ]);
      setBerries((berryData ?? []) as Berry[]);
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setIsAdmin(profile?.role === 'admin');
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Berries' }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-1">Berry Guide & Calculator</h1>
          <p className="text-gray-500 text-sm">
            All 65 PokéMMO berries — yield, seeds, watering schedules, and harvest timer.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-8">
          {([['guide', '📖 Berry Guide'], ['calculator', '🧮 Calculator']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === key ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-900/40 border border-gray-800 animate-pulse" />
            ))}
          </div>
        ) : tab === 'guide' ? (
          <BerryGuide berries={berries} isAdmin={isAdmin} onUpdate={(b) => setBerries((prev) => prev.map((x) => x.id === b.id ? b : x))} />
        ) : (
          <BerryCalculator berries={berries} />
        )}
      </div>
    </div>
  );
}
