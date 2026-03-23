import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PvP Tier List',
  description: 'Community-maintained PokéMMO PvP tier list — see which Pokémon dominate the competitive meta.',
};

export default function PvPLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
