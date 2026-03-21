import { supabase } from '@/lib/supabase';
import Navbar from '@/app/components/Navbar';
import PokedexTable from './PokedexTable';

export default async function PokedexPage() {
  const { data } = await supabase
    .from('pages')
    .select('title, slug, metadata')
    .eq('template_type', 'pokemon')
    .not('metadata', 'is', null);

  const pokemon = (data ?? [])
    .filter(p => p.metadata?.pokemon_id)
    .sort((a, b) => a.metadata.pokemon_id - b.metadata.pokemon_id);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-extrabold mb-2">Pokédex</h1>
        <p className="text-gray-400 text-sm mb-8">{pokemon.length} Pokémon available in PokéMMO</p>
        <PokedexTable pokemon={pokemon} />
      </div>
    </div>
  );
}
