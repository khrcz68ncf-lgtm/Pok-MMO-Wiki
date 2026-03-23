import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pok-mmo-wiki.vercel.app'),
  title: {
    default:  'PokéMMO Wiki — Community Knowledge Base',
    template: '%s | PokéMMO Wiki',
  },
  description: 'The community-driven wiki for PokéMMO. Pokédex, guides, farming, PvP, team builder and more.',
  keywords: ['pokemmo', 'wiki', 'pokédex', 'farming', 'pvp', 'breeding', 'guides'],
  openGraph: {
    type:     'website',
    siteName: 'PokéMMO Wiki',
    images:   [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
