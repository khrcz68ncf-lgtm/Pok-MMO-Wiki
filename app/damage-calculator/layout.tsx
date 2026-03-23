import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Damage Calculator',
  description: 'Calculate exact damage ranges for PokéMMO battles using the official Gen 5 damage formula.',
  openGraph: {
    title:       'Damage Calculator | PokéMMO Wiki',
    description: 'Calculate exact damage ranges for PokéMMO battles using the official Gen 5 damage formula.',
  },
};

export default function DamageCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
