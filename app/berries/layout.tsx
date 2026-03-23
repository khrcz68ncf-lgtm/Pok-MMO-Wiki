import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Berry Guide & Calculator',
  description: 'All 65 PokéMMO berries with yield, watering schedules, seed recipes, and a live harvest countdown calculator.',
};

export default function BerriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
