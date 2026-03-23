import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import TypeBadge from '@/app/components/TypeBadge';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata(
  { params }: { params: Promise<{ region: string }> }
): Promise<Metadata> {
  const { region } = await params;
  const name = region.charAt(0).toUpperCase() + region.slice(1);
  return {
    title:       name,
    description: `Discover ${name} in PokéMMO — gym leaders, cities, routes and landmarks.`,
    openGraph: {
      title:       `${name} | PokéMMO Wiki`,
      description: `Discover ${name} in PokéMMO — gym leaders, cities, routes and landmarks.`,
    },
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Gym = {
  leader:     string;
  city:       string;
  type:       string;
  badge:      string;
  levelCap:   number;
  sprite?:    string;
  gymNumber?: number; // override when multiple leaders share one gym slot
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
    description:  'A land steeped in tradition and legend, intertwined with the ancient history of Kanto. Home to the legendary beasts Raikou, Entei, and Suicune, and the tower guardians Ho-Oh and Lugia.',
    mapImage:     'https://www.pokepedia.fr/images/thumb/f/f2/Johto_HGSS.jpg/1600px-Johto_HGSS.jpg',
    starters: [
      {
        name:   'chikorita',
        slug:   'chikorita',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/152.gif',
      },
      {
        name:   'cyndaquil',
        slug:   'cyndaquil',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/155.gif',
      },
      {
        name:   'totodile',
        slug:   'totodile',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/158.gif',
      },
    ],
    gyms: [
      { leader: 'Falkner', city: 'Violet City',     type: 'flying',   badge: 'Zephyr Badge',  levelCap: 24, sprite: 'https://images.shoutwiki.com/pokemmo/2/2b/Spr_HGSS_Falkner.png' },
      { leader: 'Bugsy',   city: 'Azalea Town',     type: 'bug',      badge: 'Hive Badge',    levelCap: 29, sprite: 'https://images.shoutwiki.com/pokemmo/b/b6/Spr_HGSS_Bugsy.png'   },
      { leader: 'Whitney', city: 'Goldenrod City',  type: 'normal',   badge: 'Plain Badge',   levelCap: 32, sprite: 'https://images.shoutwiki.com/pokemmo/f/fc/Spr_HGSS_Whitney.png' },
      { leader: 'Morty',   city: 'Ecruteak City',   type: 'ghost',    badge: 'Fog Badge',     levelCap: 37, sprite: 'https://images.shoutwiki.com/pokemmo/c/ca/Spr_HGSS_Morty.png'   },
      { leader: 'Chuck',   city: 'Cianwood City',   type: 'fighting', badge: 'Storm Badge',   levelCap: 39, sprite: 'https://images.shoutwiki.com/pokemmo/f/fd/Spr_HGSS_Chuck.png'   },
      { leader: 'Jasmine', city: 'Olivine City',    type: 'steel',    badge: 'Mineral Badge', levelCap: 41, sprite: 'https://images.shoutwiki.com/pokemmo/4/44/Spr_HGSS_Jasmine.png' },
      { leader: 'Pryce',   city: 'Mahogany Town',   type: 'ice',      badge: 'Glacier Badge', levelCap: 46, sprite: 'https://images.shoutwiki.com/pokemmo/4/43/Spr_HGSS_Pryce.png'   },
      { leader: 'Clair',   city: 'Blackthorn City', type: 'dragon',   badge: 'Rising Badge',  levelCap: 48, sprite: 'https://images.shoutwiki.com/pokemmo/d/d7/Spr_HGSS_Clair.png'   },
    ],
    eliteFour: [
      { name: 'Will',  type: 'psychic',  sprite: 'https://images.shoutwiki.com/pokemmo/3/3d/Spr_Johto_Will.png'  },
      { name: 'Koga',  type: 'poison',   sprite: 'https://images.shoutwiki.com/pokemmo/d/d9/Spr_Johto_Koga.png'  },
      { name: 'Bruno', type: 'fighting', sprite: 'https://images.shoutwiki.com/pokemmo/6/6d/Spr_Johto_Bruno.png' },
      { name: 'Karen', type: 'dark',     sprite: 'https://images.shoutwiki.com/pokemmo/f/f9/Spr_Johto_Karen.png' },
    ],
    champion: { name: 'Lance', type: 'dragon', sprite: 'https://images.shoutwiki.com/pokemmo/d/d9/Spr_Johto_Lance.png' },
    cities: [
      { name: 'New Bark Town',    slug: 'new-bark-town',    image: 'https://images.shoutwiki.com/pokemmo/thumb/f/f6/New_Bark_Town.png/200px-New_Bark_Town.png'       },
      { name: 'Cherrygrove City', slug: 'cherrygrove-city', image: 'https://images.shoutwiki.com/pokemmo/thumb/3/3f/Cherrygrove_City.png/200px-Cherrygrove_City.png' },
      { name: 'Violet City',      slug: 'violet-city',      image: 'https://images.shoutwiki.com/pokemmo/thumb/3/34/Violet_City.png/200px-Violet_City.png'           },
      { name: 'Azalea Town',      slug: 'azalea-town',      image: 'https://images.shoutwiki.com/pokemmo/thumb/a/a8/Azalea_Town.png/200px-Azalea_Town.png'           },
      { name: 'Goldenrod City',   slug: 'goldenrod-city',   image: 'https://images.shoutwiki.com/pokemmo/thumb/f/f2/Goldenrod_City.png/200px-Goldenrod_City.png'     },
      { name: 'Ecruteak City',    slug: 'ecruteak-city',    image: 'https://images.shoutwiki.com/pokemmo/thumb/8/80/Ecruteak_City.png/200px-Ecruteak_City.png'       },
      { name: 'Olivine City',     slug: 'olivine-city',     image: 'https://images.shoutwiki.com/pokemmo/thumb/5/57/Olivine_City.png/200px-Olivine_City.png'         },
      { name: 'Cianwood City',    slug: 'cianwood-city',    image: 'https://images.shoutwiki.com/pokemmo/thumb/a/ad/Cianwood_City.png/200px-Cianwood_City.png'       },
      { name: 'Mahogany Town',    slug: 'mahogany-town',    image: 'https://images.shoutwiki.com/pokemmo/thumb/b/be/Mahogany_Town.png/200px-Mahogany_Town.png'       },
      { name: 'Blackthorn City',  slug: 'blackthorn-city',  image: 'https://images.shoutwiki.com/pokemmo/thumb/3/35/Blackthorn_City.png/200px-Blackthorn_City.png'   },
      { name: 'Safari Zone Gate', slug: 'safari-zone-johto',image: 'https://images.shoutwiki.com/pokemmo/thumb/6/67/Safari_Zone_Gate.png/200px-Safari_Zone_Gate.png' },
      { name: 'Frontier Access',  slug: 'frontier-access',  image: 'https://images.shoutwiki.com/pokemmo/thumb/5/56/Frontier_Access.png/200px-Frontier_Access.png'   },
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
    description:  'A lush tropical paradise of ocean and land, home to the ancient Pokémon of nature — Groudon, Kyogre, and Rayquaza. Hoenn\'s vast seas and volcanic terrain make it one of the most diverse regions in PokéMMO.',
    mapImage:     'https://images.shoutwiki.com/pokemmo/b/bc/Map_Hoenn_Art.png',
    starters: [
      {
        name:   'treecko',
        slug:   'treecko',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/252.gif',
      },
      {
        name:   'torchic',
        slug:   'torchic',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/255.gif',
      },
      {
        name:   'mudkip',
        slug:   'mudkip',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/258.gif',
      },
    ],
    gyms: [
      { leader: 'Roxanne',     city: 'Rustboro City',   type: 'rock',     badge: 'Stone Badge',   levelCap: 24, sprite: 'https://images.shoutwiki.com/pokemmo/e/ef/Spr_RS_Roxanne.png'         },
      { leader: 'Brawly',      city: 'Dewford Town',    type: 'fighting', badge: 'Knuckle Badge', levelCap: 28, sprite: 'https://images.shoutwiki.com/pokemmo/9/92/Spr_RS_Brawly.png'           },
      { leader: 'Wattson',     city: 'Mauville City',   type: 'electric', badge: 'Dynamo Badge',  levelCap: 33, sprite: 'https://images.shoutwiki.com/pokemmo/b/b2/Spr_RS_Wattson.png'          },
      { leader: 'Flannery',    city: 'Lavaridge Town',  type: 'fire',     badge: 'Heat Badge',    levelCap: 35, sprite: 'https://images.shoutwiki.com/pokemmo/b/be/Spr_RS_Flannery.png'         },
      { leader: 'Norman',      city: 'Petalburg City',  type: 'normal',   badge: 'Balance Badge', levelCap: 38, sprite: 'https://images.shoutwiki.com/pokemmo/7/75/Spr_RS_Norman.png'           },
      { leader: 'Winona',      city: 'Fortree City',    type: 'flying',   badge: 'Feather Badge', levelCap: 44, sprite: 'https://images.shoutwiki.com/pokemmo/0/0e/Spr_RS_Winona.png'           },
      { leader: 'Tate & Liza', city: 'Mossdeep City',  type: 'psychic',  badge: 'Mind Badge',    levelCap: 48, sprite: 'https://images.shoutwiki.com/pokemmo/3/38/Spr_RS_Tate_and_Liza.png'    },
      { leader: 'Juan',        city: 'Sootopolis City', type: 'water',    badge: 'Rain Badge',    levelCap: 58, sprite: 'https://images.shoutwiki.com/pokemmo/1/16/Spr_E_Juan.png'              },
    ],
    eliteFour: [
      { name: 'Sidney', type: 'dark',   sprite: 'https://images.shoutwiki.com/pokemmo/8/86/Spr_RS_Sidney.png' },
      { name: 'Phoebe', type: 'ghost',  sprite: 'https://images.shoutwiki.com/pokemmo/e/e6/Spr_RS_Phoebe.png' },
      { name: 'Glacia', type: 'ice',    sprite: 'https://images.shoutwiki.com/pokemmo/7/71/Spr_RS_Glacia.png' },
      { name: 'Drake',  type: 'dragon', sprite: 'https://images.shoutwiki.com/pokemmo/0/04/Spr_RS_Drake.png'  },
    ],
    champion: { name: 'Wallace', type: 'water', sprite: 'https://images.shoutwiki.com/pokemmo/c/cc/Spr_E_Wallace.png' },
    cities: [
      { name: 'Littleroot Town',  slug: 'littleroot-town',  image: 'https://images.shoutwiki.com/pokemmo/thumb/f/f0/Littleroot_Town.png/240px-Littleroot_Town.png'                             },
      { name: 'Oldale Town',      slug: 'oldale-town',      image: 'https://images.shoutwiki.com/pokemmo/thumb/f/f0/Oldale_Town_E.png/240px-Oldale_Town_E.png'                                 },
      { name: 'Petalburg City',   slug: 'petalburg-city',   image: 'https://images.shoutwiki.com/pokemmo/thumb/c/cc/Petalburg_City.png/240px-Petalburg_City.png'                               },
      { name: 'Rustboro City',    slug: 'rustboro-city',    image: 'https://images.shoutwiki.com/pokemmo/thumb/5/5d/Rustboro_City.png/240px-Rustboro_City.png'                                 },
      { name: 'Dewford Town',     slug: 'dewford-town',     image: 'https://images.shoutwiki.com/pokemmo/thumb/3/3a/Dewford_Town.png/240px-Dewford_Town.png'                                   },
      { name: 'Slateport City',   slug: 'slateport-city',   image: 'https://images.shoutwiki.com/pokemmo/thumb/a/a4/Slateport_City.png/240px-Slateport_City.png'                               },
      { name: 'Mauville City',    slug: 'mauville-city',    image: 'https://images.shoutwiki.com/pokemmo/thumb/b/b9/Mauville_City.png/240px-Mauville_City.png'                                 },
      { name: 'Verdanturf Town',  slug: 'verdanturf-town',  image: 'https://images.shoutwiki.com/pokemmo/thumb/c/c3/Verdanturf_Town.png/240px-Verdanturf_Town.png'                             },
      { name: 'Fallarbor Town',   slug: 'fallarbor-town',   image: 'https://images.shoutwiki.com/pokemmo/thumb/e/eb/Fallarbor_Town.png/240px-Fallarbor_Town.png'                               },
      { name: 'Lavaridge Town',   slug: 'lavaridge-town',   image: 'https://images.shoutwiki.com/pokemmo/thumb/c/c9/Lavaridge_Town.png/240px-Lavaridge_Town.png'                               },
      { name: 'Fortree City',     slug: 'fortree-city',     image: 'https://images.shoutwiki.com/pokemmo/thumb/0/00/Fortree_City.png/240px-Fortree_City.png'                                   },
      { name: 'Lilycove City',    slug: 'lilycove-city',    image: 'https://images.shoutwiki.com/pokemmo/thumb/3/37/Lilycove_City.png/240px-Lilycove_City.png'                                 },
      { name: 'Mossdeep City',    slug: 'mossdeep-city',    image: 'https://images.shoutwiki.com/pokemmo/thumb/5/5a/Mossdeep_City.png/240px-Mossdeep_City.png'                                 },
      { name: 'Sootopolis City',  slug: 'sootopolis-city',  image: 'https://images.shoutwiki.com/pokemmo/thumb/e/e5/Sootopolis_City.png/240px-Sootopolis_City.png'                             },
      { name: 'Pacifidlog Town',  slug: 'pacifidlog-town',  image: 'https://images.shoutwiki.com/pokemmo/thumb/9/91/Pacifidlog_Town.png/240px-Pacifidlog_Town.png'                             },
      { name: 'Ever Grande City', slug: 'ever-grande-city', image: 'https://images.shoutwiki.com/pokemmo/thumb/e/e0/Map_Hoenn_Ever_Grande_City.png/240px-Map_Hoenn_Ever_Grande_City.png'       },
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
    description:  'A northern region with towering mountains, ancient mythology, and the creator Pokémon Arceus at its center. Sinnoh\'s harsh terrain and rich lore make it one of the most expansive regions in PokéMMO.',
    mapImage:     'https://images.shoutwiki.com/pokemmo/thumb/a/ae/Map_Sinnoh_Art.png/800px-Map_Sinnoh_Art.png',
    starters: [
      {
        name:   'turtwig',
        slug:   'turtwig',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/387.gif',
      },
      {
        name:   'chimchar',
        slug:   'chimchar',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/390.gif',
      },
      {
        name:   'piplup',
        slug:   'piplup',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/393.gif',
      },
    ],
    gyms: [
      { leader: 'Roark',        city: 'Oreburgh City',  type: 'rock',     badge: 'Coal Badge',   levelCap: 27, sprite: 'https://images.shoutwiki.com/pokemmo/3/38/Spr_Pt_Roark.png'         },
      { leader: 'Gardenia',     city: 'Eterna City',    type: 'grass',    badge: 'Forest Badge', levelCap: 29, sprite: 'https://images.shoutwiki.com/pokemmo/0/07/Spr_Pt_Gardenia.png'      },
      { leader: 'Fantina',      city: 'Hearthome City', type: 'ghost',    badge: 'Relic Badge',  levelCap: 34, sprite: 'https://images.shoutwiki.com/pokemmo/3/33/Spr_Pt_Fantina.png'       },
      { leader: 'Maylene',      city: 'Veilstone City', type: 'fighting', badge: 'Cobble Badge', levelCap: 37, sprite: 'https://images.shoutwiki.com/pokemmo/5/52/Spr_Pt_Maylene.png'       },
      { leader: 'Crasher Wake', city: 'Pastoria City',  type: 'water',    badge: 'Fen Badge',    levelCap: 43, sprite: 'https://images.shoutwiki.com/pokemmo/0/06/Spr_Pt_Crasher_Wake.png'  },
      { leader: 'Byron',        city: 'Canalave City',  type: 'steel',    badge: 'Mine Badge',   levelCap: 46, sprite: 'https://images.shoutwiki.com/pokemmo/f/f0/Spr_Pt_Byron.png'         },
      { leader: 'Candice',      city: 'Snowpoint City', type: 'ice',      badge: 'Icicle Badge', levelCap: 52, sprite: 'https://images.shoutwiki.com/pokemmo/8/88/Spr_Pt_Candice.png'       },
      { leader: 'Volkner',      city: 'Sunyshore City', type: 'electric', badge: 'Beacon Badge', levelCap: 60, sprite: 'https://images.shoutwiki.com/pokemmo/8/8a/Spr_Pt_Volkner.png'       },
    ],
    eliteFour: [
      { name: 'Aaron',  type: 'bug',     sprite: 'https://images.shoutwiki.com/pokemmo/1/1a/Spr_DP_Aaron.png'  },
      { name: 'Bertha', type: 'ground',  sprite: 'https://images.shoutwiki.com/pokemmo/f/f7/Spr_DP_Bertha.png' },
      { name: 'Flint',  type: 'fire',    sprite: 'https://images.shoutwiki.com/pokemmo/c/cb/Spr_DP_Flint.png'  },
      { name: 'Lucian', type: 'psychic', sprite: 'https://images.shoutwiki.com/pokemmo/7/74/Spr_DP_Lucian.png' },
    ],
    champion: { name: 'Cynthia', type: 'dragon', sprite: 'https://images.shoutwiki.com/pokemmo/2/2f/Spr_DP_Cynthia.png' },
    cities: [
      { name: 'Twinleaf Town',    slug: 'twinleaf-town',         image: 'https://images.shoutwiki.com/pokemmo/thumb/3/3b/Twinleaf_Town.png/200px-Twinleaf_Town.png'                                                   },
      { name: 'Sandgem Town',     slug: 'sandgem-town',          image: 'https://images.shoutwiki.com/pokemmo/thumb/c/cb/Sandgem_Town.png/200px-Sandgem_Town.png'                                                     },
      { name: 'Jubilife City',    slug: 'jubilife-city',         image: 'https://images.shoutwiki.com/pokemmo/thumb/9/98/Jubilife_City.png/200px-Jubilife_City.png'                                                   },
      { name: 'Oreburgh City',    slug: 'oreburgh-city',         image: 'https://images.shoutwiki.com/pokemmo/thumb/7/7c/Oreburgh_City.png/200px-Oreburgh_City.png'                                                   },
      { name: 'Floaroma Town',    slug: 'floaroma-town',         image: 'https://images.shoutwiki.com/pokemmo/thumb/f/fc/Floaroma_Town.png/200px-Floaroma_Town.png'                                                   },
      { name: 'Eterna City',      slug: 'eterna-city',           image: 'https://images.shoutwiki.com/pokemmo/thumb/d/d3/Eterna_City.png/200px-Eterna_City.png'                                                       },
      { name: 'Hearthome City',   slug: 'hearthome-city',        image: 'https://images.shoutwiki.com/pokemmo/thumb/7/7d/Hearthome_City.png/200px-Hearthome_City.png'                                                 },
      { name: 'Solaceon Town',    slug: 'solaceon-town',         image: 'https://images.shoutwiki.com/pokemmo/thumb/b/ba/Solaceon_Town.png/200px-Solaceon_Town.png'                                                   },
      { name: 'Veilstone City',   slug: 'veilstone-city',        image: 'https://images.shoutwiki.com/pokemmo/thumb/7/7e/Veilstone_City.png/200px-Veilstone_City.png'                                                 },
      { name: 'Pastoria City',    slug: 'pastoria-city',         image: 'https://images.shoutwiki.com/pokemmo/thumb/e/eb/Pastoria_City.png/200px-Pastoria_City.png'                                                   },
      { name: 'Celestic Town',    slug: 'celestic-town',         image: 'https://images.shoutwiki.com/pokemmo/thumb/a/af/Celestic_Town.png/200px-Celestic_Town.png'                                                   },
      { name: 'Canalave City',    slug: 'canalave-city',         image: 'https://images.shoutwiki.com/pokemmo/thumb/3/32/Canalave_City.png/200px-Canalave_City.png'                                                   },
      { name: 'Snowpoint City',   slug: 'snowpoint-city',        image: 'https://images.shoutwiki.com/pokemmo/thumb/c/c4/Snowpoint_City.png/200px-Snowpoint_City.png'                                                 },
      { name: 'Sunyshore City',   slug: 'sunyshore-city',        image: 'https://images.shoutwiki.com/pokemmo/thumb/c/ce/Sunyshore_City.png/200px-Sunyshore_City.png'                                                 },
      { name: 'Pokémon League',   slug: 'sinnoh-pokemon-league', image: 'https://images.shoutwiki.com/pokemmo/thumb/5/5c/Sinnoh_Pok%C3%A9mon_League.png/200px-Sinnoh_Pok%C3%A9mon_League.png' },
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
    description:  'A diverse, far-away region inspired by urban life. Home to the legendary dragons Reshiram, Zekrom, and Kyurem. Unova\'s bustling cities and sprawling routes offer a unique challenge for trainers in PokéMMO.',
    mapImage:     'https://images.shoutwiki.com/pokemmo/thumb/a/ae/Map_Unova_Art.png/800px-Map_Unova_Art.png',
    starters: [
      {
        name:   'snivy',
        slug:   'snivy',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/495.gif',
      },
      {
        name:   'tepig',
        slug:   'tepig',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/498.gif',
      },
      {
        name:   'oshawott',
        slug:   'oshawott',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/501.gif',
      },
    ],
    gyms: [
      { gymNumber: 1, leader: 'Cilan',   city: 'Striaton City',  type: 'grass',    badge: 'Trio Badge',   levelCap: 24, sprite: 'https://images.shoutwiki.com/pokemmo/b/bd/Spr_BW_Cilan.png'   },
      { gymNumber: 1, leader: 'Chili',   city: 'Striaton City',  type: 'fire',     badge: 'Trio Badge',   levelCap: 24, sprite: 'https://images.shoutwiki.com/pokemmo/8/86/Spr_BW_Chili.png'   },
      { gymNumber: 1, leader: 'Cress',   city: 'Striaton City',  type: 'water',    badge: 'Trio Badge',   levelCap: 24, sprite: 'https://images.shoutwiki.com/pokemmo/5/57/Spr_BW_Cress.png'   },
      { gymNumber: 2, leader: 'Lenora',  city: 'Nacrene City',   type: 'normal',   badge: 'Basic Badge',  levelCap: 27, sprite: 'https://images.shoutwiki.com/pokemmo/a/a3/Spr_BW_Lenora.png'  },
      { gymNumber: 3, leader: 'Burgh',   city: 'Castelia City',  type: 'bug',      badge: 'Insect Badge', levelCap: 31, sprite: 'https://images.shoutwiki.com/pokemmo/3/3a/Spr_BW_Burgh.png'   },
      { gymNumber: 4, leader: 'Elesa',   city: 'Nimbasa City',   type: 'electric', badge: 'Bolt Badge',   levelCap: 35, sprite: 'https://images.shoutwiki.com/pokemmo/7/7c/Spr_BW_Elesa.png'   },
      { gymNumber: 5, leader: 'Clay',    city: 'Driftveil City', type: 'ground',   badge: 'Quake Badge',  levelCap: 38, sprite: 'https://images.shoutwiki.com/pokemmo/3/31/Spr_BW_Clay.png'    },
      { gymNumber: 6, leader: 'Skyla',   city: 'Mistralton City',type: 'flying',   badge: 'Jet Badge',    levelCap: 43, sprite: 'https://images.shoutwiki.com/pokemmo/c/c2/Spr_BW_Skyla.png'   },
      { gymNumber: 7, leader: 'Brycen',  city: 'Icirrus City',   type: 'ice',      badge: 'Freeze Badge', levelCap: 46, sprite: 'https://images.shoutwiki.com/pokemmo/9/91/Spr_BW_Brycen.png'  },
      { gymNumber: 8, leader: 'Iris',    city: 'Opelucid City',  type: 'dragon',   badge: 'Legend Badge', levelCap: 56, sprite: 'https://images.shoutwiki.com/pokemmo/f/f8/Spr_BW_Iris.png'    },
    ],
    eliteFour: [
      { name: 'Shauntal', type: 'ghost',    sprite: 'https://images.shoutwiki.com/pokemmo/2/28/Spr_BW_Shauntal.png' },
      { name: 'Marshal',  type: 'fighting', sprite: 'https://images.shoutwiki.com/pokemmo/2/2e/Spr_BW_Marshal.png'  },
      { name: 'Grimsley', type: 'dark',     sprite: 'https://images.shoutwiki.com/pokemmo/b/bf/Spr_BW_Grimsley.png' },
      { name: 'Caitlin',  type: 'psychic',  sprite: 'https://images.shoutwiki.com/pokemmo/8/86/Spr_BW_Caitlin.png'  },
    ],
    champion: { name: 'Alder', type: 'bug', sprite: 'https://images.shoutwiki.com/pokemmo/3/3f/Spr_BW_Alder.png' },
    cities: [
      { name: 'Nuvema Town',          slug: 'nuvema-town',         image: 'https://images.shoutwiki.com/pokemmo/thumb/b/bf/Nuvema_Town.png/200px-Nuvema_Town.png'                                               },
      { name: 'Accumula Town',        slug: 'accumula-town',       image: 'https://images.shoutwiki.com/pokemmo/thumb/8/84/Accumula_Town_Autumn_BW.png/200px-Accumula_Town_Autumn_BW.png'                     },
      { name: 'Striaton City',        slug: 'striaton-city',       image: 'https://images.shoutwiki.com/pokemmo/thumb/a/a8/Striaton_City.png/200px-Striaton_City.png'                                         },
      { name: 'Nacrene City',         slug: 'nacrene-city',        image: 'https://images.shoutwiki.com/pokemmo/thumb/9/9d/Nacrene_City_Spring_BW.png/200px-Nacrene_City_Spring_BW.png'                       },
      { name: 'Castelia City',        slug: 'castelia-city',       image: 'https://images.shoutwiki.com/pokemmo/thumb/d/d0/Castelia_City_Map_BW.png/200px-Castelia_City_Map_BW.png'                           },
      { name: 'Nimbasa City',         slug: 'nimbasa-city',        image: 'https://images.shoutwiki.com/pokemmo/thumb/5/57/Nimbasa_City_Spring_BW.png/200px-Nimbasa_City_Spring_BW.png'                       },
      { name: 'Driftveil City',       slug: 'driftveil-city',      image: 'https://images.shoutwiki.com/pokemmo/thumb/5/53/Driftveil_City_BW.png/200px-Driftveil_City_BW.png'                                 },
      { name: 'Mistralton City',      slug: 'mistralton-city',     image: 'https://images.shoutwiki.com/pokemmo/thumb/b/bd/Mistralton_City_Spring_B.png/200px-Mistralton_City_Spring_B.png'                   },
      { name: 'Icirrus City',         slug: 'icirrus-city',        image: 'https://images.shoutwiki.com/pokemmo/thumb/d/d6/Icirrus_City.png/200px-Icirrus_City.png'                                           },
      { name: 'Opelucid City',        slug: 'opelucid-city',       image: 'https://images.shoutwiki.com/pokemmo/thumb/4/4d/Opelucid_City.png/200px-Opelucid_City.png'                                         },
      { name: 'Pokémon League',       slug: 'unova-pokemon-league',image: 'https://images.shoutwiki.com/pokemmo/thumb/0/07/Pok%C3%A9mon_League_BW.png/200px-Pok%C3%A9mon_League_BW.png'                       },
      { name: 'Lacunosa Town',        slug: 'lacunosa-town',       image: 'https://images.shoutwiki.com/pokemmo/thumb/8/83/Lacunosa_Town.png/200px-Lacunosa_Town.png'                                         },
      { name: 'Undella Town',         slug: 'undella-town',        image: 'https://images.shoutwiki.com/pokemmo/thumb/7/7b/Undella_Town_BW.png/200px-Undella_Town_BW.png'                                     },
      { name: 'Black City/White Forest',slug: 'black-city',        image: 'https://images.shoutwiki.com/pokemmo/thumb/a/a6/Black_City_and_White_Forest.png/200px-Black_City_and_White_Forest.png'             },
      { name: 'Anville Town',         slug: 'anville-town',        image: 'https://images.shoutwiki.com/pokemmo/thumb/6/6f/Anville_Town.png/200px-Anville_Town.png'                                           },
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
            Gym #{gym.gymNumber ?? index + 1}
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
                          className="w-16 h-16 object-contain mx-auto drop-shadow-lg group-hover:scale-110 transition-transform duration-200"
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

      </div>
    </div>
  );
}
