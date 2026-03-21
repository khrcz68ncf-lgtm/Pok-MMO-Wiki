import { supabase } from '@/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import TypeBadge from '@/app/components/TypeBadge';
import MarkdownContent from '@/app/wiki/[slug]/MarkdownContent';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ─── Static region data ───────────────────────────────────────────────────────

type Gym = {
  leader: string;
  city: string;
  type: string;
  badge: string;
  levelCap: number;
};

type E4Member = { name: string; type: string };

type RegionData = {
  color: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  description: string;
  gyms: Gym[];
  eliteFour: E4Member[];
  champion: E4Member;
  cities: { name: string; slug: string }[];
  routes: { label: string; slug: string }[];
};

const REGIONS: Record<string, RegionData> = {
  kanto: {
    color:        'from-red-950 to-gray-950',
    accentBg:     'bg-red-500/10',
    accentBorder: 'border-red-500/30',
    accentText:   'text-red-400',
    description:  'The original region, home to the first 151 Pokémon and the beginning of every trainer\'s journey.',
    gyms: [
      { leader: 'Brock',    city: 'Pewter City',     type: 'rock',     badge: 'Boulder Badge',  levelCap: 14 },
      { leader: 'Misty',    city: 'Cerulean City',   type: 'water',    badge: 'Cascade Badge',  levelCap: 21 },
      { leader: 'Lt. Surge',city: 'Vermilion City',  type: 'electric', badge: 'Thunder Badge',  levelCap: 24 },
      { leader: 'Erika',    city: 'Celadon City',    type: 'grass',    badge: 'Rainbow Badge',  levelCap: 29 },
      { leader: 'Koga',     city: 'Fuchsia City',    type: 'poison',   badge: 'Soul Badge',     levelCap: 43 },
      { leader: 'Sabrina',  city: 'Saffron City',    type: 'psychic',  badge: 'Marsh Badge',    levelCap: 46 },
      { leader: 'Blaine',   city: 'Cinnabar Island', type: 'fire',     badge: 'Volcano Badge',  levelCap: 47 },
      { leader: 'Giovanni', city: 'Viridian City',   type: 'ground',   badge: 'Earth Badge',    levelCap: 50 },
    ],
    eliteFour: [
      { name: 'Lorelei', type: 'ice'      },
      { name: 'Bruno',   type: 'fighting' },
      { name: 'Agatha',  type: 'ghost'    },
      { name: 'Lance',   type: 'dragon'   },
    ],
    champion: { name: 'Blue', type: 'normal' },
    cities: [
      { name: 'Pallet Town',     slug: 'pallet-town'     },
      { name: 'Viridian City',   slug: 'viridian-city'   },
      { name: 'Pewter City',     slug: 'pewter-city'     },
      { name: 'Cerulean City',   slug: 'cerulean-city'   },
      { name: 'Vermilion City',  slug: 'vermilion-city'  },
      { name: 'Lavender Town',   slug: 'lavender-town'   },
      { name: 'Celadon City',    slug: 'celadon-city'    },
      { name: 'Fuchsia City',    slug: 'fuchsia-city'    },
      { name: 'Saffron City',    slug: 'saffron-city'    },
      { name: 'Cinnabar Island', slug: 'cinnabar-island' },
    ],
    routes: Array.from({ length: 25 }, (_, i) => ({
      label: `Route ${i + 1}`,
      slug:  `route-${i + 1}`,
    })),
  },

  johto: {
    color:        'from-yellow-950 to-gray-950',
    accentBg:     'bg-yellow-500/10',
    accentBorder: 'border-yellow-500/30',
    accentText:   'text-yellow-400',
    description:  'A land steeped in tradition and legend, home to the legendary beasts and the Pokémon of time and space.',
    gyms: [
      { leader: 'Falkner', city: 'Violet City',    type: 'flying',   badge: 'Zephyr Badge',  levelCap: 9  },
      { leader: 'Bugsy',   city: 'Azalea Town',    type: 'bug',      badge: 'Hive Badge',    levelCap: 16 },
      { leader: 'Whitney', city: 'Goldenrod City', type: 'normal',   badge: 'Plain Badge',   levelCap: 18 },
      { leader: 'Morty',   city: 'Ecruteak City',  type: 'ghost',    badge: 'Fog Badge',     levelCap: 25 },
      { leader: 'Chuck',   city: 'Cianwood City',  type: 'fighting', badge: 'Storm Badge',   levelCap: 29 },
      { leader: 'Jasmine', city: 'Olivine City',   type: 'steel',    badge: 'Mineral Badge', levelCap: 35 },
      { leader: 'Pryce',   city: 'Mahogany Town',  type: 'ice',      badge: 'Glacier Badge', levelCap: 38 },
      { leader: 'Clair',   city: 'Blackthorn City',type: 'dragon',   badge: 'Rising Badge',  levelCap: 45 },
    ],
    eliteFour: [
      { name: 'Will',  type: 'psychic'  },
      { name: 'Koga',  type: 'poison'   },
      { name: 'Bruno', type: 'fighting' },
      { name: 'Karen', type: 'dark'     },
    ],
    champion: { name: 'Lance', type: 'dragon' },
    cities: [
      { name: 'New Bark Town',   slug: 'new-bark-town'   },
      { name: 'Cherrygrove City',slug: 'cherrygrove-city'},
      { name: 'Violet City',     slug: 'violet-city'     },
      { name: 'Azalea Town',     slug: 'azalea-town'     },
      { name: 'Goldenrod City',  slug: 'goldenrod-city'  },
      { name: 'Ecruteak City',   slug: 'ecruteak-city'   },
      { name: 'Olivine City',    slug: 'olivine-city'    },
      { name: 'Cianwood City',   slug: 'cianwood-city'   },
      { name: 'Mahogany Town',   slug: 'mahogany-town'   },
      { name: 'Blackthorn City', slug: 'blackthorn-city' },
    ],
    routes: [
      ...Array.from({ length: 3 }, (_, i) => ({ label: `Route ${26 + i}`, slug: `route-${26 + i}` })),
      ...Array.from({ length: 17 }, (_, i) => ({ label: `Route ${29 + i}`, slug: `route-${29 + i}` })),
    ],
  },

  hoenn: {
    color:        'from-blue-950 to-gray-950',
    accentBg:     'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    accentText:   'text-blue-400',
    description:  'A lush tropical paradise of ocean and land, home to the ancient Pokémon of nature — Groudon, Kyogre, and Rayquaza.',
    gyms: [
      { leader: 'Roxanne',    city: 'Rustboro City',  type: 'rock',     badge: 'Stone Badge',   levelCap: 15 },
      { leader: 'Brawly',     city: 'Dewford Town',   type: 'fighting', badge: 'Knuckle Badge', levelCap: 18 },
      { leader: 'Wattson',    city: 'Mauville City',  type: 'electric', badge: 'Dynamo Badge',  levelCap: 24 },
      { leader: 'Flannery',   city: 'Lavaridge Town', type: 'fire',     badge: 'Heat Badge',    levelCap: 29 },
      { leader: 'Norman',     city: 'Petalburg City', type: 'normal',   badge: 'Balance Badge', levelCap: 31 },
      { leader: 'Winona',     city: 'Fortree City',   type: 'flying',   badge: 'Feather Badge', levelCap: 35 },
      { leader: 'Tate & Liza',city: 'Mossdeep City',  type: 'psychic',  badge: 'Mind Badge',    levelCap: 42 },
      { leader: 'Wallace',    city: 'Sootopolis City',type: 'water',    badge: 'Rain Badge',    levelCap: 46 },
    ],
    eliteFour: [
      { name: 'Sidney', type: 'dark'   },
      { name: 'Phoebe', type: 'ghost'  },
      { name: 'Glacia', type: 'ice'    },
      { name: 'Drake',  type: 'dragon' },
    ],
    champion: { name: 'Steven', type: 'steel' },
    cities: [
      { name: 'Littleroot Town', slug: 'littleroot-town'  },
      { name: 'Oldale Town',     slug: 'oldale-town'      },
      { name: 'Petalburg City',  slug: 'petalburg-city'   },
      { name: 'Rustboro City',   slug: 'rustboro-city'    },
      { name: 'Dewford Town',    slug: 'dewford-town'     },
      { name: 'Slateport City',  slug: 'slateport-city'   },
      { name: 'Mauville City',   slug: 'mauville-city'    },
      { name: 'Lavaridge Town',  slug: 'lavaridge-town'   },
      { name: 'Fortree City',    slug: 'fortree-city'     },
      { name: 'Lilycove City',   slug: 'lilycove-city'    },
      { name: 'Mossdeep City',   slug: 'mossdeep-city'    },
      { name: 'Sootopolis City', slug: 'sootopolis-city'  },
      { name: 'Ever Grande City',slug: 'ever-grande-city' },
    ],
    routes: Array.from({ length: 34 }, (_, i) => ({
      label: `Route ${101 + i}`,
      slug:  `route-${101 + i}`,
    })),
  },

  sinnoh: {
    color:        'from-purple-950 to-gray-950',
    accentBg:     'bg-purple-500/10',
    accentBorder: 'border-purple-500/30',
    accentText:   'text-purple-400',
    description:  'A northern region with towering mountains, ancient mythology, and the creator Pokémon Arceus at its center.',
    gyms: [
      { leader: 'Roark',        city: 'Oreburgh City',  type: 'rock',     badge: 'Coal Badge',    levelCap: 15 },
      { leader: 'Gardenia',     city: 'Eterna City',    type: 'grass',    badge: 'Forest Badge',  levelCap: 22 },
      { leader: 'Maylene',      city: 'Veilstone City', type: 'fighting', badge: 'Cobble Badge',  levelCap: 28 },
      { leader: 'Crasher Wake', city: 'Pastoria City',  type: 'water',    badge: 'Fen Badge',     levelCap: 30 },
      { leader: 'Fantina',      city: 'Hearthome City', type: 'ghost',    badge: 'Relic Badge',   levelCap: 36 },
      { leader: 'Byron',        city: 'Canalave City',  type: 'steel',    badge: 'Mine Badge',    levelCap: 40 },
      { leader: 'Candice',      city: 'Snowpoint City', type: 'ice',      badge: 'Icicle Badge',  levelCap: 44 },
      { leader: 'Volkner',      city: 'Sunyshore City', type: 'electric', badge: 'Beacon Badge',  levelCap: 50 },
    ],
    eliteFour: [
      { name: 'Aaron',  type: 'bug'     },
      { name: 'Bertha', type: 'ground'  },
      { name: 'Flint',  type: 'fire'    },
      { name: 'Lucian', type: 'psychic' },
    ],
    champion: { name: 'Cynthia', type: 'dragon' },
    cities: [
      { name: 'Twinleaf Town',  slug: 'twinleaf-town'  },
      { name: 'Sandgem Town',   slug: 'sandgem-town'   },
      { name: 'Jubilife City',  slug: 'jubilife-city'  },
      { name: 'Oreburgh City',  slug: 'oreburgh-city'  },
      { name: 'Eterna City',    slug: 'eterna-city'    },
      { name: 'Hearthome City', slug: 'hearthome-city' },
      { name: 'Solaceon Town',  slug: 'solaceon-town'  },
      { name: 'Veilstone City', slug: 'veilstone-city' },
      { name: 'Pastoria City',  slug: 'pastoria-city'  },
      { name: 'Celestic Town',  slug: 'celestic-town'  },
      { name: 'Canalave City',  slug: 'canalave-city'  },
      { name: 'Snowpoint City', slug: 'snowpoint-city' },
      { name: 'Sunyshore City', slug: 'sunyshore-city' },
    ],
    routes: Array.from({ length: 30 }, (_, i) => ({
      label: `Route ${201 + i}`,
      slug:  `route-${201 + i}`,
    })),
  },

  unova: {
    color:        'from-gray-800 to-gray-950',
    accentBg:     'bg-gray-500/10',
    accentBorder: 'border-gray-500/30',
    accentText:   'text-gray-300',
    description:  'A diverse, far-away region inspired by urban life. Home to Reshiram, Zekrom, and the legendary Kyurem.',
    gyms: [
      { leader: 'Cilan / Chili / Cress', city: 'Striaton City',  type: 'grass',   badge: 'Trio Badge',     levelCap: 12 },
      { leader: 'Lenora',                city: 'Nacrene City',   type: 'normal',  badge: 'Basic Badge',    levelCap: 18 },
      { leader: 'Burgh',                 city: 'Castelia City',  type: 'bug',     badge: 'Insect Badge',   levelCap: 22 },
      { leader: 'Elesa',                 city: 'Nimbasa City',   type: 'electric',badge: 'Bolt Badge',     levelCap: 26 },
      { leader: 'Clay',                  city: 'Driftveil City', type: 'ground',  badge: 'Quake Badge',    levelCap: 31 },
      { leader: 'Skyla',                 city: 'Mistralton City',type: 'flying',  badge: 'Jet Badge',      levelCap: 37 },
      { leader: 'Brycen',                city: 'Icirrus City',   type: 'ice',     badge: 'Freeze Badge',   levelCap: 41 },
      { leader: 'Drayden',               city: 'Opelucid City',  type: 'dragon',  badge: 'Legend Badge',   levelCap: 46 },
    ],
    eliteFour: [
      { name: 'Shauntal', type: 'ghost'    },
      { name: 'Marshal',  type: 'fighting' },
      { name: 'Grimsley', type: 'dark'     },
      { name: 'Caitlin',  type: 'psychic'  },
    ],
    champion: { name: 'Alder', type: 'bug' },
    cities: [
      { name: 'Nuvema Town',    slug: 'nuvema-town'    },
      { name: 'Accumula Town',  slug: 'accumula-town'  },
      { name: 'Striaton City',  slug: 'striaton-city'  },
      { name: 'Nacrene City',   slug: 'nacrene-city'   },
      { name: 'Castelia City',  slug: 'castelia-city'  },
      { name: 'Nimbasa City',   slug: 'nimbasa-city'   },
      { name: 'Driftveil City', slug: 'driftveil-city' },
      { name: 'Mistralton City',slug: 'mistralton-city'},
      { name: 'Icirrus City',   slug: 'icirrus-city'   },
      { name: 'Opelucid City',  slug: 'opelucid-city'  },
      { name: 'Lacunosa Town',  slug: 'lacunosa-town'  },
      { name: 'Undella Town',   slug: 'undella-town'   },
    ],
    routes: Array.from({ length: 18 }, (_, i) => ({
      label: `Route ${i + 1}`,
      slug:  `unova-route-${i + 1}`,
    })),
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-800">
      {children}
    </h2>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: rawRegion } = await params;
  const region = rawRegion.toLowerCase();

  const regionData = REGIONS[region];
  if (!regionData) notFound();

  const displayName = region.charAt(0).toUpperCase() + region.slice(1);

  const { data: page } = await supabase
    .from('pages')
    .select('title, content, updated_at')
    .eq('slug', region)
    .maybeSingle();

  const { color, accentBg, accentBorder, accentText, description, gyms, eliteFour, champion, cities, routes } = regionData;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-b ${color} border-b border-gray-800`}>
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Breadcrumb crumbs={[
            { label: 'Home',    href: '/'        },
            { label: 'Regions', href: '/regions' },
            { label: displayName },
          ]} />
          <h1 className="text-5xl font-extrabold tracking-tight mb-3">{displayName}</h1>
          <p className="text-gray-300 text-lg max-w-2xl">{description}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-12">

        {/* ── Gym Leaders ───────────────────────────────────────────────── */}
        <section>
          <SectionHeading>Gym Leaders</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {gyms.map((gym, i) => (
              <div
                key={gym.leader}
                className="rounded-xl bg-gray-900 border border-gray-800 p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-widest ${accentText}`}>
                    #{i + 1}
                  </span>
                  <TypeBadge type={gym.type} className="h-5" />
                </div>
                <p className="font-bold text-white text-sm leading-tight">{gym.leader}</p>
                <p className="text-xs text-gray-500">{gym.city}</p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
                  <span className="text-[10px] text-gray-600">{gym.badge}</span>
                  <span className="text-[10px] text-gray-500">Lv. cap {gym.levelCap}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Elite Four ────────────────────────────────────────────────── */}
        <section>
          <SectionHeading>Elite Four &amp; Champion</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {eliteFour.map((member, i) => (
              <div
                key={member.name}
                className="rounded-xl bg-gray-900 border border-gray-800 p-4 flex flex-col items-center gap-2 text-center"
              >
                <span className={`text-xs font-bold uppercase tracking-widest ${accentText}`}>
                  E4 #{i + 1}
                </span>
                <p className="font-bold text-white text-sm">{member.name}</p>
                <TypeBadge type={member.type} className="h-5" />
              </div>
            ))}

            {/* Champion */}
            <div className={`rounded-xl bg-gray-900 border ${accentBorder} ${accentBg} p-4 flex flex-col items-center gap-2 text-center`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${accentText}`}>
                Champion
              </span>
              <p className="font-bold text-white text-sm">{champion.name}</p>
              <TypeBadge type={champion.type} className="h-5" />
            </div>
          </div>
        </section>

        {/* ── Cities ────────────────────────────────────────────────────── */}
        <section>
          <SectionHeading>Cities &amp; Towns</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/wiki/${city.slug}`}
                className="rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 px-3 py-2.5 text-sm text-gray-300 hover:text-white transition-all truncate"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Routes ────────────────────────────────────────────────────── */}
        <section>
          <SectionHeading>Routes</SectionHeading>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
            {routes.map((route) => (
              <Link
                key={route.slug}
                href={`/wiki/${route.slug}`}
                className="rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 px-2 py-2 text-xs text-gray-400 hover:text-white transition-all text-center font-mono"
              >
                {route.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Wiki Content ──────────────────────────────────────────────── */}
        {page?.content?.trim() && (
          <section>
            <SectionHeading>General Information</SectionHeading>
            <div className="rounded-xl bg-gray-900/40 border border-gray-800 px-6 py-5">
              <MarkdownContent content={page.content} />
            </div>
          </section>
        )}

        {!page && (
          <p className="text-center text-gray-600 text-sm py-4">
            No wiki article found for {displayName}. The structured data above is hardcoded.
          </p>
        )}

      </div>
    </div>
  );
}
