import type { Metadata } from 'next';
import TradingAuthGuard from './AuthGuard';

export const metadata: Metadata = {
  title:       'Invest Manager',
  description: 'Track your PokéMMO trades and investments. Calculate profits, taxes and returns.',
  openGraph: {
    title:       'Invest Manager | PokéMMO Wiki',
    description: 'Track your PokéMMO trades and investments. Calculate profits, taxes and returns.',
  },
};

export default function TradingLayout({ children }: { children: React.ReactNode }) {
  return <TradingAuthGuard>{children}</TradingAuthGuard>;
}
