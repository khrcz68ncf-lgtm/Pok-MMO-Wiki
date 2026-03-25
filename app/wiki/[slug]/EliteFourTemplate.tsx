import Link from 'next/link';
import TypeBadge from '@/app/components/TypeBadge';

// ── Data ─────────────────────────────────────────────────────────────────────

type Member = {
  name:       string;
  type:       string;
  slug:       string;
  sprite:     string;
  isChampion: boolean;
};

type RegionSection = {
  name:        string;
  href:        string;
  accentText:  string;
  accentBg:    string;
  accentBorder:string;
  members:     Member[];
};

const REGIONS: RegionSection[] = [
  {
    name:         'Kanto',
    href:         '/regions/kanto',
    accentText:   'text-red-400',
    accentBg:     'bg-red-500/10',
    accentBorder: 'border-red-500/30',
    members: [
      { name: 'Lorelei', type: 'ice',      slug: 'lorelei',     sprite: 'https://images.shoutwiki.com/pokemmo/d/db/Spr_FRLG_Lorelei.png', isChampion: false },
      { name: 'Bruno',   type: 'fighting', slug: 'bruno-kanto', sprite: 'https://images.shoutwiki.com/pokemmo/f/f7/Spr_FRLG_Bruno.png',   isChampion: false },
      { name: 'Agatha',  type: 'ghost',    slug: 'agatha',      sprite: 'https://images.shoutwiki.com/pokemmo/5/56/Spr_FRLG_Agatha.png',  isChampion: false },
      { name: 'Lance',   type: 'dragon',   slug: 'lance-kanto', sprite: 'https://images.shoutwiki.com/pokemmo/f/fb/Spr_FRLG_Lance.png',   isChampion: false },
      { name: 'Blue',    type: 'normal',   slug: 'blue',        sprite: 'https://images.shoutwiki.com/pokemmo/e/e2/Spr_FRLG_Blue_2.png',  isChampion: true  },
    ],
  },
  {
    name:         'Johto',
    href:         '/regions/johto',
    accentText:   'text-yellow-400',
    accentBg:     'bg-yellow-500/10',
    accentBorder: 'border-yellow-500/30',
    members: [
      { name: 'Will',  type: 'psychic',  slug: 'will',        sprite: 'https://images.shoutwiki.com/pokemmo/3/3d/Spr_Johto_Will.png',  isChampion: false },
      { name: 'Koga',  type: 'poison',   slug: 'koga-johto',  sprite: 'https://images.shoutwiki.com/pokemmo/d/d9/Spr_Johto_Koga.png',  isChampion: false },
      { name: 'Bruno', type: 'fighting', slug: 'bruno-johto', sprite: 'https://images.shoutwiki.com/pokemmo/6/6d/Spr_Johto_Bruno.png', isChampion: false },
      { name: 'Karen', type: 'dark',     slug: 'karen',       sprite: 'https://images.shoutwiki.com/pokemmo/f/f9/Spr_Johto_Karen.png', isChampion: false },
      { name: 'Lance', type: 'dragon',   slug: 'lance-johto', sprite: 'https://images.shoutwiki.com/pokemmo/d/d9/Spr_Johto_Lance.png', isChampion: true  },
    ],
  },
  {
    name:         'Hoenn',
    href:         '/regions/hoenn',
    accentText:   'text-blue-400',
    accentBg:     'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    members: [
      { name: 'Sidney',  type: 'dark',   slug: 'sidney',  sprite: 'https://images.shoutwiki.com/pokemmo/8/86/Spr_RS_Sidney.png', isChampion: false },
      { name: 'Phoebe',  type: 'ghost',  slug: 'phoebe',  sprite: 'https://images.shoutwiki.com/pokemmo/e/e6/Spr_RS_Phoebe.png', isChampion: false },
      { name: 'Glacia',  type: 'ice',    slug: 'glacia',  sprite: 'https://images.shoutwiki.com/pokemmo/7/71/Spr_RS_Glacia.png', isChampion: false },
      { name: 'Drake',   type: 'dragon', slug: 'drake',   sprite: 'https://images.shoutwiki.com/pokemmo/0/04/Spr_RS_Drake.png',  isChampion: false },
      { name: 'Wallace', type: 'water',  slug: 'wallace', sprite: 'https://images.shoutwiki.com/pokemmo/c/cc/Spr_E_Wallace.png', isChampion: true  },
    ],
  },
  {
    name:         'Sinnoh',
    href:         '/regions/sinnoh',
    accentText:   'text-purple-400',
    accentBg:     'bg-purple-500/10',
    accentBorder: 'border-purple-500/30',
    members: [
      { name: 'Aaron',   type: 'bug',     slug: 'aaron',   sprite: 'https://images.shoutwiki.com/pokemmo/1/1a/Spr_DP_Aaron.png',  isChampion: false },
      { name: 'Bertha',  type: 'ground',  slug: 'bertha',  sprite: 'https://images.shoutwiki.com/pokemmo/f/f7/Spr_DP_Bertha.png', isChampion: false },
      { name: 'Flint',   type: 'fire',    slug: 'flint',   sprite: 'https://images.shoutwiki.com/pokemmo/c/cb/Spr_DP_Flint.png',  isChampion: false },
      { name: 'Lucian',  type: 'psychic', slug: 'lucian',  sprite: 'https://images.shoutwiki.com/pokemmo/7/74/Spr_DP_Lucian.png', isChampion: false },
      { name: 'Cynthia', type: 'dragon',  slug: 'cynthia', sprite: 'https://images.shoutwiki.com/pokemmo/2/2f/Spr_DP_Cynthia.png', isChampion: true },
    ],
  },
  {
    name:         'Unova',
    href:         '/regions/unova',
    accentText:   'text-gray-300',
    accentBg:     'bg-gray-500/10',
    accentBorder: 'border-gray-500/30',
    members: [
      { name: 'Shauntal', type: 'ghost',    slug: 'shauntal', sprite: 'https://images.shoutwiki.com/pokemmo/2/28/Spr_BW_Shauntal.png', isChampion: false },
      { name: 'Marshal',  type: 'fighting', slug: 'marshal',  sprite: 'https://images.shoutwiki.com/pokemmo/2/2e/Spr_BW_Marshal.png',  isChampion: false },
      { name: 'Grimsley', type: 'dark',     slug: 'grimsley', sprite: 'https://images.shoutwiki.com/pokemmo/b/bf/Spr_BW_Grimsley.png', isChampion: false },
      { name: 'Caitlin',  type: 'psychic',  slug: 'caitlin',  sprite: 'https://images.shoutwiki.com/pokemmo/8/86/Spr_BW_Caitlin.png',  isChampion: false },
      { name: 'Alder',    type: 'bug',      slug: 'alder',    sprite: 'https://images.shoutwiki.com/pokemmo/3/3f/Spr_BW_Alder.png',    isChampion: true  },
    ],
  },
];

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
  member,
  label,
  accentText,
  accentBg,
  accentBorder,
}: {
  member:       Member;
  label:        string;
  accentText:   string;
  accentBg:     string;
  accentBorder: string;
}) {
  const cardClass = `rounded-xl border overflow-hidden flex flex-col text-center transition-all hover:scale-[1.02] hover:shadow-lg ${
    member.isChampion
      ? `${accentBg} ${accentBorder}`
      : 'bg-gray-900 border-gray-800 hover:border-gray-600'
  }`;

  return (
    <Link href={`/wiki/${member.slug}`} className={cardClass}>
      {/* Sprite */}
      <div className={`flex items-end justify-center h-28 overflow-hidden ${member.isChampion ? 'bg-black/20' : 'bg-gray-800/60'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.sprite}
          alt={member.name}
          className="h-24 object-contain object-bottom"
        />
      </div>

      {/* Info */}
      <div className="px-3 py-3 flex flex-col items-center gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${accentText}`}>
          {label}
        </span>
        <p className="font-bold text-white text-sm">{member.name}</p>
        <TypeBadge type={member.type} className="h-5" />
      </div>
    </Link>
  );
}

// ── Template ─────────────────────────────────────────────────────────────────

export default function EliteFourTemplate() {
  return (
    <div>
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">Elite Four</h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
          The Elite Four are four exceptionally skilled Pokémon Trainers who must be defeated
          consecutively before you can challenge each region&apos;s Champion. Heal your Pokémon
          and stock up on items before entering — there are no breaks between battles.
        </p>
      </div>

      {/* Region sections */}
      <div className="space-y-12">
        {REGIONS.map(region => (
          <section key={region.name}>
            {/* Region heading */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className={`text-xl font-bold ${region.accentText}`}>
                <Link href={region.href} className="hover:underline underline-offset-4">
                  {region.name}
                </Link>
              </h2>
              <div className={`h-px flex-1 ${region.accentBg} border-t ${region.accentBorder}`} />
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {region.members.map((member, i) => (
                <MemberCard
                  key={member.slug}
                  member={member}
                  label={member.isChampion ? 'Champion' : `Elite Four #${i + 1}`}
                  accentText={region.accentText}
                  accentBg={region.accentBg}
                  accentBorder={region.accentBorder}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
