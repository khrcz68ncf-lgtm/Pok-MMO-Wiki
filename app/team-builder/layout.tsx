import type { Metadata } from 'next';
import TeamBuilderAuthGuard from './AuthGuard';

export const metadata: Metadata = {
  title:       'Team Builder',
  description: 'Build, share and analyze your PokéMMO teams. Calculate type coverage, weaknesses and stat spreads.',
  openGraph: {
    title:       'Team Builder | PokéMMO Wiki',
    description: 'Build, share and analyze your PokéMMO teams. Calculate type coverage, weaknesses and stat spreads.',
  },
};

export default function TeamBuilderLayout({ children }: { children: React.ReactNode }) {
  return <TeamBuilderAuthGuard>{children}</TeamBuilderAuthGuard>;
}
