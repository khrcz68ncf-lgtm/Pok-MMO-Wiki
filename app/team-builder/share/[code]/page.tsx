import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { Team, TeamPokemon } from '../../types';
import { NATURES, STAT_KEYS, STAT_LABELS } from '../../constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function SpriteCell({ p }: { p: TeamPokemon }) {
  if (!p.pokemon_id) {
    return (
      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/50 flex items-center justify-center text-gray-600 text-2xl">
        ?
      </div>
    );
  }
  const base = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated`;
  const src  = p.is_shiny ? `${base}/shiny/${p.pokemon_id}.gif` : `${base}/${p.pokemon_id}.gif`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={p.pokemon_name ?? ''} className="w-20 h-20 object-contain" />
  );
}

function StatBar({ label, iv, ev, value }: { label: string; iv: number; ev: number; value?: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-8 shrink-0">{label}</span>
      <span className="text-gray-600 w-6 text-right shrink-0">{iv}IV</span>
      <span className="text-gray-600 w-6 text-right shrink-0">{ev}EV</span>
      {value !== undefined && (
        <span className="text-white font-bold w-8 text-right">{value}</span>
      )}
    </div>
  );
}

export default async function SharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('share_code', code)
    .single();

  if (!team) notFound();

  const { data: rawPokemon } = await supabase
    .from('team_pokemon')
    .select('*')
    .eq('team_id', team.id)
    .order('slot');

  const pokemon: TeamPokemon[] = (rawPokemon ?? []) as TeamPokemon[];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-1">{team.name}</h1>
              {team.description && (
                <p className="text-gray-400 text-sm">{team.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {(team.tags ?? []).map((tag: string) => (
                  <span key={tag} className="text-[11px] px-2.5 py-0.5 bg-gray-800 border border-gray-700 rounded-full text-gray-400">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {team.price && (
                <div className="text-lg font-bold text-yellow-400">💰 {Number(team.price).toLocaleString()} Yen</div>
              )}
              <div className="text-xs text-gray-600">
                Code: <code className="font-mono text-gray-500">{team.share_code}</code>
              </div>
              <Link
                href="/team-builder"
                className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Build your own →
              </Link>
            </div>
          </div>
        </div>

        {/* Pokemon grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {pokemon.map(p => {
            const nature = NATURES.find(n => n.name === p.nature);
            const moves   = (p.moves ?? []).filter(Boolean);
            return (
              <div
                key={p.id}
                className="bg-gray-900 rounded-2xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <SpriteCell p={p} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-base flex items-center gap-1">
                      {p.is_shiny && <span className="text-yellow-400">✨</span>}
                      {p.pokemon_name ?? 'Unknown'}
                    </div>
                    {p.pokemon_id && (
                      <div className="text-gray-600 text-xs font-mono">#{String(p.pokemon_id).padStart(3, '0')}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">Lv{p.level}</div>
                    <div className={`text-xs mt-0.5 ${nature?.plus ? 'text-red-400' : 'text-gray-400'}`}>
                      {p.nature}
                      {nature?.plus && ` (+${STAT_LABELS[nature.plus]}/-${STAT_LABELS[nature.minus!]})`}
                    </div>
                    {p.ability && <div className="text-xs text-blue-400 mt-0.5">{p.ability}</div>}
                    {p.held_item && <div className="text-xs text-yellow-400 mt-0.5">@ {p.held_item}</div>}
                  </div>
                </div>

                {/* IVs / EVs summary */}
                <div className="space-y-1 mb-3">
                  {STAT_KEYS.map(key => {
                    const iv = p.ivs[key];
                    const ev = p.evs[key];
                    if (iv === 31 && ev === 0) return null;
                    return <StatBar key={key} label={STAT_LABELS[key]} iv={iv} ev={ev} />;
                  })}
                </div>

                {/* Moves */}
                {moves.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {moves.map((m, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 bg-gray-800 border border-gray-700 rounded-full text-gray-300">{m}</span>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {p.description && (
                  <p className="text-[11px] text-gray-600 mt-2 italic">{p.description}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-700 text-sm">
          Shared via <Link href="/" className="text-red-400 hover:underline">PokéMMO Wiki</Link> Team Builder
        </div>
      </div>
    </div>
  );
}
