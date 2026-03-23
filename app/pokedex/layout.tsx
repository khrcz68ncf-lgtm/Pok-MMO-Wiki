import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Pokédex',
  description: 'Browse all 649 Pokémon available in PokéMMO with stats, types, moves and sprites.',
  openGraph: {
    title:       'Pokédex | PokéMMO Wiki',
    description: 'Browse all 649 Pokémon available in PokéMMO with stats, types, moves and sprites.',
  },
};

export default function PokedexLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
