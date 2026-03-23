'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Trade, TradeTag } from './types';

// ─── Autocomplete result ──────────────────────────────────────────────────────

type SearchResult = {
  slug:     string;
  title:    string;
  imageUrl: string | null;
  type:     'pokemon' | 'item';
};

const POKEMON_TAGS_LIST = ['Shiny', '31IV', 'Alpha', 'Legendary', 'Starter'];

const STATUS_OPTIONS = ['pending', 'listed', 'sold', 'cancelled'] as const;

// ─── Form state ───────────────────────────────────────────────────────────────

type PriceMode = 'per_unit' | 'total';

type FormState = {
  item_name:           string;
  item_image_url:      string;
  item_type:           'item' | 'pokemon';
  pokemon_tags:        string[];
  quantity:            string;
  buy_price_per_unit:  string;
  buy_mode:            PriceMode;
  sell_price_per_unit: string;
  sell_mode:           PriceMode;
  tax_per_unit:        string;
  tax_mode:            PriceMode;
  is_direct_trade:     boolean;
  status:              string;
  sold_at:             string;
  traded_with:         string;
  target_buy_price:    string;
  is_recurring:        boolean;
  notes:               string;
  custom_tags:         string[];
};

function blankForm(): FormState {
  return {
    item_name:           '',
    item_image_url:      '',
    item_type:           'item',
    pokemon_tags:        [],
    quantity:            '1',
    buy_price_per_unit:  '',
    buy_mode:            'per_unit',
    sell_price_per_unit: '',
    sell_mode:           'per_unit',
    tax_per_unit:        '',
    tax_mode:            'per_unit',
    is_direct_trade:     false,
    status:              'pending',
    sold_at:             new Date().toISOString().slice(0, 16),
    traded_with:         '',
    target_buy_price:    '',
    is_recurring:        false,
    notes:               '',
    custom_tags:         [],
  };
}

function tradeToForm(t: Trade): FormState {
  return {
    item_name:           t.item_name,
    item_image_url:      t.item_image_url ?? '',
    item_type:           (t.item_type as 'item' | 'pokemon') ?? 'item',
    pokemon_tags:        t.pokemon_tags ?? [],
    quantity:            String(t.quantity ?? 1),
    buy_price_per_unit:  t.buy_price_per_unit != null ? String(t.buy_price_per_unit) : '',
    buy_mode:            'per_unit',
    sell_price_per_unit: t.sell_price_per_unit != null ? String(t.sell_price_per_unit) : '',
    sell_mode:           'per_unit',
    tax_per_unit:        t.tax_per_unit != null ? String(t.tax_per_unit) : '',
    tax_mode:            'per_unit',
    is_direct_trade:     t.is_direct_trade ?? false,
    status:              t.status ?? 'pending',
    sold_at:             t.sold_at ? new Date(t.sold_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    traded_with:         t.traded_with ?? '',
    target_buy_price:    t.target_buy_price != null ? String(t.target_buy_price) : '',
    is_recurring:        t.is_recurring ?? false,
    notes:               t.notes ?? '',
    custom_tags:         t.custom_tags ?? [],
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function perUnit(value: string, mode: PriceMode, qty: number): number {
  const n = parseInt(value) || 0;
  return mode === 'total' ? Math.round(n / Math.max(qty, 1)) : n;
}

function calcProfit(f: FormState) {
  const qty  = parseInt(f.quantity) || 1;
  const buy  = perUnit(f.buy_price_per_unit,  f.buy_mode,  qty);
  const sell = perUnit(f.sell_price_per_unit, f.sell_mode, qty);
  const tax  = f.is_direct_trade ? 0 : perUnit(f.tax_per_unit, f.tax_mode, qty);
  const pu   = sell - buy - tax;
  return { profitPerUnit: pu, totalProfit: pu * qty };
}

function fmt(n: number) {
  return n.toLocaleString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{children}</label>;
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-400 transition-colors ${className}`}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors ${
        checked ? 'bg-red-500 border-red-500' : 'bg-gray-700 border-gray-600'
      }`}
    >
      <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform mt-0.5 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function PriceModeToggle({ mode, onChange, disabled }: { mode: PriceMode; onChange: (m: PriceMode) => void; disabled?: boolean }) {
  return (
    <div className={`flex rounded-md overflow-hidden border border-gray-700 text-xs ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {(['per_unit', 'total'] as PriceMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-2 py-1 ${mode === m ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
        >
          {m === 'per_unit' ? '/unit' : 'total'}
        </button>
      ))}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function TradeModal({
  trade,
  tags,
  userId,
  onClose,
  onSaved,
}: {
  trade:    Trade | null;   // null = new
  tags:     TradeTag[];
  userId:   string;
  onClose:  () => void;
  onSaved:  () => void;
}) {
  const [form, setForm]   = useState<FormState>(trade ? tradeToForm(trade) : blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Autocomplete
  const [query,    setQuery]    = useState(form.item_name);
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [showAC,   setShowAC]   = useState(false);
  const acTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const acRef   = useRef<HTMLDivElement>(null);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  }, []);

  // Debounced autocomplete search
  useEffect(() => {
    clearTimeout(acTimer.current);
    if (query.length < 2) { setResults([]); return; }
    acTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('pages')
        .select('slug, title, metadata, template_type')
        .ilike('title', `%${query}%`)
        .limit(8);

      setResults(
        (data ?? []).map((p) => ({
          slug:     p.slug,
          title:    p.title,
          imageUrl: p.template_type === 'pokemon' && p.metadata?.pokemon_id
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${p.metadata.pokemon_id}.gif`
            : null,
          type:     p.template_type === 'pokemon' ? 'pokemon' : 'item',
        }))
      );
      setShowAC(true);
    }, 300);
    return () => clearTimeout(acTimer.current);
  }, [query]);

  // Close AC on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setShowAC(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectResult(r: SearchResult) {
    setForm((f) => ({ ...f, item_name: r.title, item_image_url: r.imageUrl ?? '', item_type: r.type }));
    setQuery(r.title);
    setShowAC(false);
  }

  const qty   = parseInt(form.quantity) || 1;
  const { profitPerUnit, totalProfit } = calcProfit(form);

  async function handleSave() {
    if (!form.item_name.trim()) { setError('Item name is required.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      user_id:             userId,
      item_name:           form.item_name.trim(),
      item_image_url:      form.item_image_url || null,
      item_type:           form.item_type,
      pokemon_tags:        form.item_type === 'pokemon' ? form.pokemon_tags : [],
      custom_tags:         form.custom_tags,
      quantity:            qty,
      buy_price_per_unit:  perUnit(form.buy_price_per_unit,  form.buy_mode,  qty) || null,
      sell_price_per_unit: perUnit(form.sell_price_per_unit, form.sell_mode, qty) || null,
      tax_per_unit:        form.is_direct_trade ? 0 : perUnit(form.tax_per_unit, form.tax_mode, qty) || null,
      is_direct_trade:     form.is_direct_trade,
      status:              form.status,
      sold_at:             form.status === 'sold' ? new Date(form.sold_at).toISOString() : null,
      traded_with:         form.traded_with || null,
      target_buy_price:    parseInt(form.target_buy_price) || null,
      is_recurring:        form.is_recurring,
      notes:               form.notes || null,
      updated_at:          new Date().toISOString(),
    };

    let err;
    if (trade) {
      ({ error: err } = await supabase.from('trades').update(payload).eq('id', trade.id));
    } else {
      ({ error: err } = await supabase.from('trades').insert({ ...payload, created_at: new Date().toISOString() }));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-bold text-white">{trade ? 'Edit Trade' : 'New Trade'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Item name + autocomplete */}
          <div ref={acRef} className="relative">
            <Label>Item Name</Label>
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); set('item_name', e.target.value); }}
              onFocus={() => results.length > 0 && setShowAC(true)}
              placeholder="Search or type item name…"
            />
            {showAC && results.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                {results.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => selectResult(r)}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-700 text-left transition-colors"
                  >
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imageUrl} alt="" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-base">📦</div>
                    )}
                    <div>
                      <p className="text-sm text-white capitalize">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item type + item image url */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <div className="flex gap-2">
                {(['item', 'pokemon'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('item_type', t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${
                      form.item_type === t
                        ? 'bg-red-500/20 border-red-500/60 text-red-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {t === 'item' ? '📦 Item' : '⚡ Pokémon'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={form.item_image_url}
                onChange={(e) => set('item_image_url', e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          {/* Pokémon tags */}
          {form.item_type === 'pokemon' && (
            <div>
              <Label>Pokémon Tags</Label>
              <div className="flex flex-wrap gap-2">
                {POKEMON_TAGS_LIST.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const next = form.pokemon_tags.includes(tag)
                        ? form.pokemon_tags.filter((t) => t !== tag)
                        : [...form.pokemon_tags, tag];
                      set('pokemon_tags', next);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.pokemon_tags.includes(tag)
                        ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-400"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sold at */}
          {form.status === 'sold' && (
            <div>
              <Label>Sold At</Label>
              <Input
                type="datetime-local"
                value={form.sold_at}
                onChange={(e) => set('sold_at', e.target.value)}
              />
            </div>
          )}

          {/* Direct trade toggle */}
          <div className="flex items-center justify-between rounded-lg bg-gray-800/50 border border-gray-800 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Non-GTL / Direct Trade</p>
              <p className="text-xs text-gray-500">Hides tax fields, sets tax to 0</p>
            </div>
            <Toggle checked={form.is_direct_trade} onChange={(v) => set('is_direct_trade', v)} label="Direct trade" />
          </div>

          {/* Buy / Sell / Tax */}
          <div className="grid grid-cols-1 gap-3">
            {(
              [
                { label: 'Buy Price',  key: 'buy_price_per_unit',  modeKey: 'buy_mode'  },
                { label: 'Sell Price', key: 'sell_price_per_unit', modeKey: 'sell_mode' },
                ...(!form.is_direct_trade
                  ? [{ label: 'Tax',  key: 'tax_per_unit',  modeKey: 'tax_mode'  }]
                  : []
                ),
              ] as { label: string; key: keyof FormState; modeKey: keyof FormState }[]
            ).map(({ label, key, modeKey }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <Label>{label}</Label>
                  <PriceModeToggle
                    mode={form[modeKey] as PriceMode}
                    onChange={(m) => set(modeKey, m)}
                  />
                </div>
                <Input
                  type="number"
                  min="0"
                  value={form[key] as string}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={`${label} ${form[modeKey] === 'total' ? '(total)' : '(per unit)'}`}
                />
              </div>
            ))}
          </div>

          {/* Profit preview */}
          <div className={`rounded-xl border px-5 py-3 flex justify-between items-center ${
            totalProfit > 0 ? 'border-green-800/60 bg-green-900/20' :
            totalProfit < 0 ? 'border-red-800/60 bg-red-900/20' :
            'border-gray-800 bg-gray-800/30'
          }`}>
            <span className="text-xs text-gray-500 uppercase tracking-widest">Profit Preview</span>
            <div className="text-right">
              <p className={`text-lg font-bold ${totalProfit > 0 ? 'text-green-400' : totalProfit < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {totalProfit > 0 ? '+' : ''}{fmt(totalProfit)} ₽
              </p>
              <p className="text-xs text-gray-500">{fmt(profitPerUnit)} ₽/unit × {qty}</p>
            </div>
          </div>

          {/* Traded with + Target buy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Traded With (optional)</Label>
              <Input
                value={form.traded_with}
                onChange={(e) => set('traded_with', e.target.value)}
                placeholder="Player name…"
              />
            </div>
            <div>
              <Label>Target Buy Price (optional)</Label>
              <Input
                type="number"
                min="0"
                value={form.target_buy_price}
                onChange={(e) => set('target_buy_price', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Custom tags */}
          {tags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      const next = form.custom_tags.includes(tag.name)
                        ? form.custom_tags.filter((t) => t !== tag.name)
                        : [...form.custom_tags, tag.name];
                      set('custom_tags', next);
                    }}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                    style={{
                      borderColor:     form.custom_tags.includes(tag.name) ? tag.color : '#374151',
                      backgroundColor: form.custom_tags.includes(tag.name) ? tag.color + '30' : 'transparent',
                      color:           form.custom_tags.includes(tag.name) ? tag.color : '#9ca3af',
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recurring toggle */}
          <div className="flex items-center justify-between rounded-lg bg-gray-800/50 border border-gray-800 px-4 py-3">
            <p className="text-sm font-medium text-white">Recurring Trade</p>
            <Toggle checked={form.is_recurring} onChange={(v) => set('is_recurring', v)} label="Recurring" />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Any notes…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-400 transition-colors resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800 sticky bottom-0 bg-gray-900">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {saving ? 'Saving…' : trade ? 'Save Changes' : 'Add Trade'}
          </button>
        </div>
      </div>
    </div>
  );
}
