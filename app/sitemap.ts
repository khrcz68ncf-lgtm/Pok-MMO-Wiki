import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const BASE_URL = 'https://pok-mmo-wiki.vercel.app';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL,                             priority: 1.0,  changeFrequency: 'daily'   },
  { url: `${BASE_URL}/wiki`,                   priority: 0.9,  changeFrequency: 'daily'   },
  { url: `${BASE_URL}/pokedex`,                priority: 0.9,  changeFrequency: 'weekly'  },
  { url: `${BASE_URL}/regions`,                priority: 0.8,  changeFrequency: 'monthly' },
  { url: `${BASE_URL}/guides`,                 priority: 0.8,  changeFrequency: 'weekly'  },
  { url: `${BASE_URL}/pvp`,                    priority: 0.7,  changeFrequency: 'weekly'  },
  { url: `${BASE_URL}/trading`,                priority: 0.6,  changeFrequency: 'weekly'  },
  { url: `${BASE_URL}/team-builder`,           priority: 0.6,  changeFrequency: 'weekly'  },
  { url: `${BASE_URL}/damage-calculator`,      priority: 0.6,  changeFrequency: 'monthly' },
  { url: `${BASE_URL}/breeding-calculator`,    priority: 0.6,  changeFrequency: 'monthly' },
  { url: `${BASE_URL}/berries`,               priority: 0.7,  changeFrequency: 'monthly' },
];

const REGIONS = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Region pages
  const regionRoutes: MetadataRoute.Sitemap = REGIONS.map(r => ({
    url:             `${BASE_URL}/regions/${r}`,
    priority:        0.7,
    changeFrequency: 'monthly' as const,
  }));

  // All wiki pages from Supabase
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false });

  const wikiRoutes: MetadataRoute.Sitemap = (pages ?? []).map(p => ({
    url:             `${BASE_URL}/wiki/${p.slug}`,
    lastModified:    new Date(p.updated_at),
    priority:        0.6,
    changeFrequency: 'weekly' as const,
  }));

  return [...STATIC_ROUTES, ...regionRoutes, ...wikiRoutes];
}
