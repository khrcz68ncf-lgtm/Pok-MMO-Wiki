import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Breeding Calculator',
  description: 'Calculate PokéMMO breeding costs, chain steps and required Power Items for any IV spread.',
};

export default function BreedingCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
