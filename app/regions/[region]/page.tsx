import { supabase } from '@/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import TypeBadge from '@/app/components/TypeBadge';
import MarkdownContent from '@/app/wiki/[slug]/MarkdownContent';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type Gym = {
  leader:   string;
  city:     string;
  type:     string;
  badge:    string;
  levelCap: number;
  sprite?:  string;
};

type E4Member = {
  name:    string;
  type:    string;
  sprite?: string;
};

type Starter = {
  name:   string;
  slug:   string;
  sprite: string;
};

type City = {
  name:   string;
  slug:   string;
  image?: string;
};

type RegionData = {
  color:        string;
  accentBg:     string;
  accentBorder: string;
  accentText:   string;
  description:  string;
  mapImage?:    string;
  starters?:    Starter[];
  gyms:         Gym[];
  eliteFour:    E4Member[];
  champion:     E4Member;
  cities:       City[];
  routes:       { label: string; slug: string }[];
  landmarks:    string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Static region data ───────────────────────────────────────────────────────

const REGIONS: Record<string, RegionData> = {
  kanto: {
    color:        'from-red-950 to-gray-950',
    accentBg:     'bg-red-500/10',
    accentBorder: 'border-red-500/30',
    accentText:   'text-red-400',
    description:  'The original region, home to the first 151 Pokémon and the beginning of every trainer\'s journey. Kanto stretches from the coastal Pallet Town to the cave-riddled mountains near Pewter, with bustling cities like Celadon and Saffron in between.',
    mapImage:     'https://images.shoutwiki.com/pokemmo/e/e8/Map_Kanto.png',
    starters: [
      {
        name:   'bulbasaur',
        slug:   'bulbasaur',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif',
      },
      {
        name:   'charmander',
        slug:   'charmander',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/4.gif',
      },
      {
        name:   'squirtle',
        slug:   'squirtle',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/7.gif',
      },
    ],
    gyms: [
      { leader: 'Brock',     city: 'Pewter City',     type: 'rock',     badge: 'Boulder Badge', levelCap: 20, sprite: 'https://images.shoutwiki.com/pokemmo/9/97/Brock.png'          },
      { leader: 'Misty',     city: 'Cerulean City',   type: 'water',    badge: 'Cascade Badge', levelCap: 26, sprite: 'https://images.shoutwiki.com/pokemmo/2/2c/Spr_FRLG_Misty.png' },
      { leader: 'Lt. Surge', city: 'Vermilion City',  type: 'electric', badge: 'Thunder Badge', levelCap: 32, sprite: 'https://images.shoutwiki.com/pokemmo/5/5c/Spr_FRLG_Lt_Surge.png' },
      { leader: 'Erika',     city: 'Celadon City',    type: 'grass',    badge: 'Rainbow Badge', levelCap: 37, sprite: 'https://images.shoutwiki.com/pokemmo/c/c9/Spr_FRLG_Erika.png' },
      { leader: 'Koga',      city: 'Fuchsia City',    type: 'poison',   badge: 'Soul Badge',    levelCap: 46, sprite: 'https://images.shoutwiki.com/pokemmo/0/02/Spr_FRLG_Koga.png'  },
      { leader: 'Sabrina',   city: 'Saffron City',    type: 'psychic',  badge: 'Marsh Badge',   levelCap: 47, sprite: 'https://images.shoutwiki.com/pokemmo/d/dd/Spr_FRLG_Sabrina.png' },
      { leader: 'Blaine',    city: 'Cinnabar Island', type: 'fire',     badge: 'Volcano Badge', levelCap: 50, sprite: 'https://images.shoutwiki.com/pokemmo/6/6d/Spr_FRLG_Blaine.png' },
      { leader: 'Giovanni',  city: 'Viridian City',   type: 'ground',   badge: 'Earth Badge',   levelCap: 55, sprite: 'https://images.shoutwiki.com/pokemmo/f/f2/Giovanni.png'        },
    ],
    eliteFour: [
      { name: 'Lorelei', type: 'ice',      sprite: 'https://images.shoutwiki.com/pokemmo/d/db/Spr_FRLG_Lorelei.png' },
      { name: 'Bruno',   type: 'fighting', sprite: 'https://images.shoutwiki.com/pokemmo/f/f7/Spr_FRLG_Bruno.png'   },
      { name: 'Agatha',  type: 'ghost',    sprite: 'https://images.shoutwiki.com/pokemmo/5/56/Spr_FRLG_Agatha.png'  },
      { name: 'Lance',   type: 'dragon',   sprite: 'https://images.shoutwiki.com/pokemmo/f/fb/Spr_FRLG_Lance.png'   },
    ],
    champion: { name: 'Blue', type: 'normal', sprite: 'https://images.shoutwiki.com/pokemmo/e/e2/Spr_FRLG_Blue_2.png' },
    cities: [
      { name: 'Pallet Town',     slug: 'pallet-town',     image: 'https://images.shoutwiki.com/pokemmo/thumb/6/6b/Pallet_Town.png/240px-Pallet_Town.png'                },
      { name: 'Viridian City',   slug: 'viridian-city',   image: 'https://images.shoutwiki.com/pokemmo/thumb/9/9f/Viridian_City.png/240px-Viridian_City.png'             },
      { name: 'Pewter City',     slug: 'pewter-city',     image: 'https://images.shoutwiki.com/pokemmo/thumb/6/6c/Pewter_City.png/240px-Pewter_City.png'                 },
      { name: 'Cerulean City',   slug: 'cerulean-city',   image: 'https://images.shoutwiki.com/pokemmo/thumb/1/18/Cerulean_City.png/240px-Cerulean_City.png'             },
      { name: 'Vermilion City',  slug: 'vermilion-city',  image: 'https://images.shoutwiki.com/pokemmo/thumb/8/8d/Vermilion_City_FRLG.png/240px-Vermilion_City_FRLG.png' },
      { name: 'Lavender Town',   slug: 'lavender-town',   image: 'https://images.shoutwiki.com/pokemmo/thumb/4/4e/Lavender_Town.png/240px-Lavender_Town.png'             },
      { name: 'Celadon City',    slug: 'celadon-city',    image: 'https://images.shoutwiki.com/pokemmo/thumb/1/1c/Celadon_City.png/240px-Celadon_City.png'               },
      { name: 'Fuchsia City',    slug: 'fuchsia-city',    image: 'https://images.shoutwiki.com/pokemmo/thumb/d/db/Fuchsia_City.png/240px-Fuchsia_City.png'               },
      { name: 'Saffron City',    slug: 'saffron-city',    image: 'https://images.shoutwiki.com/pokemmo/thumb/f/f1/Saffron_City.png/240px-Saffron_City.png'               },
      { name: 'Cinnabar Island', slug: 'cinnabar-island', image: 'https://images.shoutwiki.com/pokemmo/thumb/4/40/Cinnabar_Island.png/240px-Cinnabar_Island.png'         },
    ],
    routes: Array.from({ length: 25 }, (_, i) => ({
      label: `Route ${i + 1}`,
      slug:  `route-${i + 1}`,
    })),
    landmarks: [
      'Viridian Forest', 'Mt. Moon', 'Diglett\'s Cave', 'Rock Tunnel',
      'S.S. Anne', 'Pokémon Tower', 'Game Corner', 'Safari Zone',
      'Seafoam Islands', 'Power Plant', 'Pokémon Mansion', 'Cerulean Cave',
      'Victory Road',
    ],
  },

  johto: {
    color:        'from-yellow-950 to-gray-950',
    accentBg:     'bg-yellow-500/10',
    accentBorder: 'border-yellow-500/30',
    accentText:   'text-yellow-400',
    description:  'A land steeped in tradition and legend, home to the legendary beasts and the Pokémon of time and space.',
    mapImage:     'https://www.pokepedia.fr/images/thumb/f/f2/Johto_HGSS.jpg/1600px-Johto_HGSS.jpg',
    gyms: [
      { leader: 'Falkner', city: 'Violet City',     type: 'flying',   badge: 'Zephyr Badge',  levelCap: 9  },
      { leader: 'Bugsy',   city: 'Azalea Town',     type: 'bug',      badge: 'Hive Badge',    levelCap: 16 },
      { leader: 'Whitney', city: 'Goldenrod City',  type: 'normal',   badge: 'Plain Badge',   levelCap: 18 },
      { leader: 'Morty',   city: 'Ecruteak City',   type: 'ghost',    badge: 'Fog Badge',     levelCap: 25 },
      { leader: 'Chuck',   city: 'Cianwood City',   type: 'fighting', badge: 'Storm Badge',   levelCap: 29 },
      { leader: 'Jasmine', city: 'Olivine City',    type: 'steel',    badge: 'Mineral Badge', levelCap: 35 },
      { leader: 'Pryce',   city: 'Mahogany Town',   type: 'ice',      badge: 'Glacier Badge', levelCap: 38 },
      { leader: 'Clair',   city: 'Blackthorn City', type: 'dragon',   badge: 'Rising Badge',  levelCap: 45 },
    ],
    eliteFour: [
      { name: 'Will',  type: 'psychic'  },
      { name: 'Koga',  type: 'poison'   },
      { name: 'Bruno', type: 'fighting' },
      { name: 'Karen', type: 'dark'     },
    ],
    champion: { name: 'Lance', type: 'dragon' },
    cities: [
      { name: 'New Bark Town',    slug: 'new-bark-town'    },
      { name: 'Cherrygrove City', slug: 'cherrygrove-city' },
      { name: 'Violet City',      slug: 'violet-city'      },
      { name: 'Azalea Town',      slug: 'azalea-town'      },
      { name: 'Goldenrod City',   slug: 'goldenrod-city'   },
      { name: 'Ecruteak City',    slug: 'ecruteak-city'    },
      { name: 'Olivine City',     slug: 'olivine-city'     },
      { name: 'Cianwood City',    slug: 'cianwood-city'    },
      { name: 'Mahogany Town',    slug: 'mahogany-town'    },
      { name: 'Blackthorn City',  slug: 'blackthorn-city'  },
    ],
    routes: [
      ...Array.from({ length: 3 },  (_, i) => ({ label: `Route ${26 + i}`, slug: `route-${26 + i}` })),
      ...Array.from({ length: 17 }, (_, i) => ({ label: `Route ${29 + i}`, slug: `route-${29 + i}` })),
    ],
    landmarks: [
      'Dark Cave', 'Sprout Tower', 'Ruins of Alph', 'Union Cave',
      'Slowpoke Well', 'Ilex Forest', 'Goldenrod Radio Tower', 'National Park',
      'Bell Tower', 'Burned Tower', 'Moomoo Farm', 'Glitter Lighthouse',
      'Battle Frontier', 'Cliff Cave', 'Safari Zone Johto', 'Whirl Islands',
      'Mt. Mortar', 'Lake of Rage', 'Ice Path', 'Dragon\'s Den',
      'Tohjo Falls', 'Victory Road', 'Mt. Silver',
    ],
  },

  hoenn: {
    color:        'from-blue-950 to-gray-950',
    accentBg:     'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    accentText:   'text-blue-400',
    description:  'A lush tropical paradise of ocean and land, home to the ancient Pokémon of nature — Groudon, Kyogre, and Rayquaza.',
    mapImage:     'https://images.shoutwiki.com/pokemmo/b/bc/Map_Hoenn_Art.png',
    gyms: [
      { leader: 'Roxanne',     city: 'Rustboro City',   type: 'rock',     badge: 'Stone Badge',   levelCap: 15 },
      { leader: 'Brawly',      city: 'Dewford Town',    type: 'fighting', badge: 'Knuckle Badge', levelCap: 18 },
      { leader: 'Wattson',     city: 'Mauville City',   type: 'electric', badge: 'Dynamo Badge',  levelCap: 24 },
      { leader: 'Flannery',    city: 'Lavaridge Town',  type: 'fire',     badge: 'Heat Badge',    levelCap: 29 },
      { leader: 'Norman',      city: 'Petalburg City',  type: 'normal',   badge: 'Balance Badge', levelCap: 31 },
      { leader: 'Winona',      city: 'Fortree City',    type: 'flying',   badge: 'Feather Badge', levelCap: 35 },
      { leader: 'Tate & Liza', city: 'Mossdeep City',  type: 'psychic',  badge: 'Mind Badge',    levelCap: 42 },
      { leader: 'Wallace',     city: 'Sootopolis City', type: 'water',    badge: 'Rain Badge',    levelCap: 46 },
    ],
    eliteFour: [
      { name: 'Sidney', type: 'dark'   },
      { name: 'Phoebe', type: 'ghost'  },
      { name: 'Glacia', type: 'ice'    },
      { name: 'Drake',  type: 'dragon' },
    ],
    champion: { name: 'Steven', type: 'steel' },
    cities: [
      { name: 'Littleroot Town',  slug: 'littleroot-town'  },
      { name: 'Oldale Town',      slug: 'oldale-town'      },
      { name: 'Petalburg City',   slug: 'petalburg-city'   },
      { name: 'Rustboro City',    slug: 'rustboro-city'    },
      { name: 'Dewford Town',     slug: 'dewford-town'     },
      { name: 'Slateport City',   slug: 'slateport-city'   },
      { name: 'Mauville City',    slug: 'mauville-city'    },
      { name: 'Lavaridge Town',   slug: 'lavaridge-town'   },
      { name: 'Fortree City',     slug: 'fortree-city'     },
      { name: 'Lilycove City',    slug: 'lilycove-city'    },
      { name: 'Mossdeep City',    slug: 'mossdeep-city'    },
      { name: 'Sootopolis City',  slug: 'sootopolis-city'  },
      { name: 'Ever Grande City', slug: 'ever-grande-city' },
    ],
    routes: Array.from({ length: 34 }, (_, i) => ({
      label: `Route ${101 + i}`,
      slug:  `route-${101 + i}`,
    })),
    landmarks: [
      'Petalburg Woods', 'Rusturf Tunnel', 'Granite Cave', 'Trick House',
      'Slateport Market', 'New Mauville', 'Fiery Path', 'Mt. Chimney',
      'Jagged Pass', 'Lavaridge Hot Springs', 'Safari Zone Hoenn', 'Meteor Falls',
      'Mt. Pyre', 'Seafloor Cavern', 'Cave of Origin', 'Sky Pillar',
      'Shoal Cave', 'Mirage Island', 'Victory Road',
    ],
  },

  sinnoh: {
    color:        'from-purple-950 to-gray-950',
    accentBg:     'bg-purple-500/10',
    accentBorder: 'border-purple-500/30',
    accentText:   'text-purple-400',
    description:  'A northern region with towering mountains, ancient mythology, and the creator Pokémon Arceus at its center.',
    mapImage:     'https://images.shoutwiki.com/pokemmo/thumb/a/ae/Map_Sinnoh_Art.png/800px-Map_Sinnoh_Art.png',
    gyms: [
      { leader: 'Roark',        city: 'Oreburgh City',  type: 'rock',     badge: 'Coal Badge',   levelCap: 15 },
      { leader: 'Gardenia',     city: 'Eterna City',    type: 'grass',    badge: 'Forest Badge', levelCap: 22 },
      { leader: 'Maylene',      city: 'Veilstone City', type: 'fighting', badge: 'Cobble Badge', levelCap: 28 },
      { leader: 'Crasher Wake', city: 'Pastoria City',  type: 'water',    badge: 'Fen Badge',    levelCap: 30 },
      { leader: 'Fantina',      city: 'Hearthome City', type: 'ghost',    badge: 'Relic Badge',  levelCap: 36 },
      { leader: 'Byron',        city: 'Canalave City',  type: 'steel',    badge: 'Mine Badge',   levelCap: 40 },
      { leader: 'Candice',      city: 'Snowpoint City', type: 'ice',      badge: 'Icicle Badge', levelCap: 44 },
      { leader: 'Volkner',      city: 'Sunyshore City', type: 'electric', badge: 'Beacon Badge', levelCap: 50 },
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
    landmarks: [
      'Oreburgh Mine', 'Mt. Coronet', 'Eterna Forest', 'Valley Windworks',
      'Old Chateau', 'Wayward Cave', 'Great Marsh', 'Lost Tower',
      'Amity Square', 'Solaceon Ruins', 'Fuego Ironworks', 'Iron Island',
      'Lake Verity', 'Lake Acuity', 'Lake Valor', 'Snowpoint Temple',
      'Spear Pillar', 'Distortion World', 'Victory Road',
    ],
  },

  unova: {
    color:        'from-gray-800 to-gray-950',
    accentBg:     'bg-gray-500/10',
    accentBorder: 'border-gray-500/30',
    accentText:   'text-gray-300',
    description:  'A diverse, far-away region inspired by urban life. Home to Reshiram, Zekrom, and the legendary Kyurem.',
    mapImage:     'https://images.shoutwiki.com/pokemmo/thumb/a/ae/Map_Unova_Art.png/800px-Map_Unova_Art.png',
    gyms: [
      { leader: 'Cilan / Chili / Cress', city: 'Striaton City',  type: 'grass',    badge: 'Trio Badge',   levelCap: 12 },
      { leader: 'Lenora',                city: 'Nacrene City',   type: 'normal',   badge: 'Basic Badge',  levelCap: 18 },
      { leader: 'Burgh',                 city: 'Castelia City',  type: 'bug',      badge: 'Insect Badge', levelCap: 22 },
      { leader: 'Elesa',                 city: 'Nimbasa City',   type: 'electric', badge: 'Bolt Badge',   levelCap: 26 },
      { leader: 'Clay',                  city: 'Driftveil City', type: 'ground',   badge: 'Quake Badge',  levelCap: 31 },
      { leader: 'Skyla',                 city: 'Mistralton City',type: 'flying',   badge: 'Jet Badge',    levelCap: 37 },
      { leader: 'Brycen',                city: 'Icirrus City',   type: 'ice',      badge: 'Freeze Badge', levelCap: 41 },
      { leader: 'Drayden',               city: 'Opelucid City',  type: 'dragon',   badge: 'Legend Badge', levelCap: 46 },
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
    landmarks: [
      'Dreamyard', 'Pinwheel Forest', 'Wellspring Cave', 'Desert Resort',
      'Relic Castle', 'Cold Storage', 'Chargestone Cave', 'Celestial Tower',
      'Mistralton Cave', 'Twist Mountain', 'Dragonspiral Tower', 'Moor of Icirrus',
      'Seaside Cave', 'Giant Chasm', 'Village Bridge', 'Victory Road',
      'Challenger\'s Cave',
    ],
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-white mb-5 pb-2 border-b border-gray-800">
      {children}
    </h2>
  );
}

function GymCard({
  gym,
  index,
  accentText,
}: {
  gym: Gym;
  index: number;
  accentText: string;
}) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden flex flex-col">
      {/* Trainer sprite */}
      <div className="bg-gray-800/60 flex items-end justify-center h-28 overflow-hidden">
        {gym.sprite ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gym.sprite}
            alt={gym.leader}
            className="h-24 object-contain object-bottom"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl mb-2">
            🏆
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-widest ${accentText}`}>
            Gym #{index + 1}
          </span>
          <TypeBadge type={gym.type} className="h-5" />
        </div>
        <p className="font-bold text-white text-sm leading-tight">{gym.leader}</p>
        <p className="text-xs text-gray-500">{gym.city}</p>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
          <span className="text-[10px] text-gray-600">{gym.badge}</span>
          <span className="text-[10px] font-mono text-gray-500">Lv.{gym.levelCap} cap</span>
        </div>
      </div>
    </div>
  );
}

function TrainerCard({
  member,
  label,
  accentText,
  accentBg,
  accentBorder,
  isChampion = false,
}: {
  member: E4Member;
  label: string;
  accentText: string;
  accentBg?: string;
  accentBorder?: string;
  isChampion?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border overflow-hidden flex flex-col text-center ${
        isChampion
          ? `${accentBg} ${accentBorder}`
          : 'bg-gray-900 border-gray-800'
      }`}
    >
      {/* Trainer sprite */}
      <div className={`flex items-end justify-center h-28 overflow-hidden ${isChampion ? 'bg-black/20' : 'bg-gray-800/60'}`}>
        {member.sprite ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.sprite}
            alt={member.name}
            className="h-24 object-contain object-bottom"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl mb-2">
            {isChampion ? '👑' : '⚔️'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-3 flex flex-col items-center gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${accentText}`}>
          {label}
        </span>
        <p className="font-bold text-white text-sm">{member.name}</p>
        <TypeBadge type={member.type} className="h-5" />
      </div>
    </div>
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

  const {
    color, accentBg, accentBorder, accentText,
    description, mapImage, starters,
    gyms, eliteFour, champion,
    cities, routes, landmarks,
  } = regionData;

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

          <h1 className="text-5xl font-extrabold tracking-tight mb-6">{displayName}</h1>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: description + starters */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-300 text-lg leading-relaxed mb-6">{description}</p>

              {starters && starters.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                    Starter Pokémon
                  </p>
                  <div className="flex gap-6 items-end">
                    {starters.map((s) => (
                      <Link
                        key={s.name}
                        href={`/wiki/${s.slug}`}
                        className="group flex flex-col items-center gap-1"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.sprite}
                          alt={s.name}
                          className="h-20 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-200"
                        />
                        <span className="text-xs font-medium text-gray-400 group-hover:text-white capitalize transition-colors">
                          {s.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: region map */}
            {mapImage && (
              <div className="lg:w-72 xl:w-80 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mapImage}
                  alt={`${displayName} map`}
                  className="w-full rounded-xl border border-gray-700/50 object-contain shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-12">

        {/* ── Gym Leaders ───────────────────────────────────────────────── */}
        <section>
          <SectionHeading>Gym Leaders</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
            {gyms.map((gym, i) => (
              <GymCard key={gym.leader} gym={gym} index={i} accentText={accentText} />
            ))}
          </div>
        </section>

        {/* ── Elite Four + Champion ─────────────────────────────────────── */}
        <section>
          <SectionHeading>Elite Four &amp; Champion</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {eliteFour.map((member, i) => (
              <TrainerCard
                key={member.name}
                member={member}
                label={`Elite Four #${i + 1}`}
                accentText={accentText}
              />
            ))}
            <TrainerCard
              member={champion}
              label="Champion"
              accentText={accentText}
              accentBg={accentBg}
              accentBorder={accentBorder}
              isChampion
            />
          </div>
        </section>

        {/* ── Cities & Towns ────────────────────────────────────────────── */}
        <section>
          <SectionHeading>Cities &amp; Towns</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/wiki/${city.slug}`}
                className="group rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 overflow-hidden flex flex-col transition-all"
              >
                {city.image ? (
                  <div className="h-20 overflow-hidden bg-gray-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-20 bg-gray-800/50 flex items-center justify-center text-gray-600 text-2xl">
                    🏙️
                  </div>
                )}
                <div className="px-3 py-2.5">
                  <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors leading-tight">
                    {city.name}
                  </p>
                </div>
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

        {/* ── Landmarks ─────────────────────────────────────────────────── */}
        {landmarks.length > 0 && (
          <section>
            <SectionHeading>Landmarks &amp; Dungeons</SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {landmarks.map((name) => (
                <Link
                  key={name}
                  href={`/wiki/${slugify(name)}`}
                  className="rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 px-3 py-2.5 text-sm text-gray-300 hover:text-white transition-all"
                >
                  {name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Wiki Content ──────────────────────────────────────────────── */}
        {page?.content?.trim() && (
          <section>
            <SectionHeading>General Information</SectionHeading>
            <div className="rounded-xl bg-gray-900/40 border border-gray-800 px-6 py-5">
              <MarkdownContent content={page.content} />
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
