import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarkdownContent from './MarkdownContent';
import PokemonTemplate from './PokemonTemplate';
import MoveTemplate from './MoveTemplate';
import ItemTemplate from './ItemTemplate';
import AbilityTemplate from './AbilityTemplate';
import EliteFourTemplate from './EliteFourTemplate';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import CommunityUpdates from './CommunityUpdates';

function stripMarkdown(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')   // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links → text
    .replace(/#{1,6}\s+/g, '')         // headings
    .replace(/[*_`~]+/g, '')           // bold/italic/code
    .replace(/^\s*[-*+]\s+/gm, '')     // list bullets
    .replace(/\n+/g, ' ')
    .trim();
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const { data: page } = await supabase
    .from('pages')
    .select('title, content, metadata, template_type')
    .eq('slug', slug)
    .single();

  if (!page) return {};

  let description: string;
  if (page.template_type === 'pokemon' && page.metadata?.types) {
    const types = (page.metadata.types as string[]).join('/');
    description = `${page.title} is a ${types}-type Pokémon in PokéMMO. View stats, moves, type chart and more.`;
  } else if (page.template_type === 'move' && page.metadata) {
    const cat = page.metadata.category ?? '';
    const pwr = page.metadata.power ? `, power ${page.metadata.power}` : '';
    description = `${page.title} — ${cat} move${pwr}. Full details for PokéMMO.`;
  } else if (page.template_type === 'item' && page.metadata) {
    const cat = page.metadata.category ? ` (${page.metadata.category})` : '';
    description = `${page.title}${cat} — item details for PokéMMO.`;
  } else if (page.template_type === 'ability' && page.metadata?.effect) {
    description = `${page.title}: ${(page.metadata.effect as string).slice(0, 140)}`;
  } else {
    description = stripMarkdown(page.content ?? '').slice(0, 160);
  }

  return {
    title:       page.title,
    description,
    openGraph: {
      title:       `${page.title} | PokéMMO Wiki`,
      description,
    },
  };
}

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: page, error } = await supabase
    .from('pages')
    .select('title, content, category, updated_at, template_type, metadata')
    .eq('slug', slug)
    .single();

  if (error || !page) notFound();

  const updatedAt = new Date(page.updated_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const isPokemon   = page.template_type === 'pokemon';
  const isMove      = page.template_type === 'move';
  const isItem      = page.template_type === 'item';
  const isAbility   = page.template_type === 'ability';
  const isEliteFour = slug === 'elite-four';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pageData: any = page;

  // ── Pokémon enrichment ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let evolutionChain: any[] = [];
  let evolutionPokemonMap: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let eggMovesData: any[] = [];

  if (isPokemon) {
    // Enrich regular moves
    if (Array.isArray(page.metadata?.moves) && page.metadata.moves.length > 0) {
      const moveSlugs = [
        ...new Set<string>(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          page.metadata.moves.map((m: any) => m.name.toLowerCase().replace(/\s+/g, '-'))
        ),
      ];

      const { data: movePages } = await supabase
        .from('pages')
        .select('slug, metadata')
        .in('slug', moveSlugs)
        .eq('template_type', 'move');

      const moveTypes: Record<string, { type?: string; damage_class?: string; power?: number; accuracy?: number; pp?: number }> = {};
      for (const mp of movePages ?? []) {
        moveTypes[mp.slug] = {
          type:         mp.metadata?.type     ?? undefined,
          damage_class: mp.metadata?.category ?? undefined,
          power:        mp.metadata?.power    ?? undefined,
          accuracy:     mp.metadata?.accuracy ?? undefined,
          pp:           mp.metadata?.pp       ?? undefined,
        };
      }

      const enrichedMoves = page.metadata.moves.map((m: { name: string }) => {
        const moveSlug = m.name.toLowerCase().replace(/\s+/g, '-');
        return { ...m, ...moveTypes[moveSlug] };
      });

      pageData = { ...page, metadata: { ...page.metadata, moves: enrichedMoves } };
    }

    // Fetch evolution chain
    const chainId = page.metadata?.evolution_chain_id;
    if (chainId) {
      const { data: chainRows } = await supabase
        .from('evolution_chains')
        .select('from_pokemon, to_pokemon, min_level, item, trigger, condition')
        .eq('chain_id', chainId);

      if (chainRows && chainRows.length > 0) {
        evolutionChain = chainRows;

        // Gather all unique pokemon names and look up their IDs
        const names = [...new Set([
          ...chainRows.map((r: { from_pokemon: string }) => r.from_pokemon),
          ...chainRows.map((r: { to_pokemon: string }) => r.to_pokemon),
        ])];

        const { data: pokemonPages } = await supabase
          .from('pages')
          .select('slug, metadata')
          .in('slug', names)
          .eq('template_type', 'pokemon');

        for (const pp of pokemonPages ?? []) {
          if (pp.metadata?.pokemon_id) {
            evolutionPokemonMap[pp.slug] = pp.metadata.pokemon_id;
          }
        }
      }
    }

    // Enrich egg moves
    const eggMoveNames: string[] = page.metadata?.egg_moves ?? [];
    if (eggMoveNames.length > 0) {
      const eggMoveSlugs = eggMoveNames.map((n: string) => n.toLowerCase().replace(/\s+/g, '-'));
      const { data: eggMovePages } = await supabase
        .from('pages')
        .select('slug, metadata')
        .in('slug', eggMoveSlugs)
        .eq('template_type', 'move');

      const eggMoveTypes: Record<string, { type?: string; damage_class?: string; power?: number; accuracy?: number; pp?: number }> = {};
      for (const mp of eggMovePages ?? []) {
        eggMoveTypes[mp.slug] = {
          type:         mp.metadata?.type     ?? undefined,
          damage_class: mp.metadata?.category ?? undefined,
          power:        mp.metadata?.power    ?? undefined,
          accuracy:     mp.metadata?.accuracy ?? undefined,
          pp:           mp.metadata?.pp       ?? undefined,
        };
      }

      eggMovesData = eggMoveNames.map((name: string) => {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        return { name, ...eggMoveTypes[slug] };
      });
    }
  }

  // ── Item: build pokemonMap for held_by_pokemon ────────────────────────────
  let itemPokemonMap: Record<string, number> = {};
  if (isItem) {
    const heldBy: { pokemon_name: string }[] = page.metadata?.held_by_pokemon ?? [];
    if (heldBy.length > 0) {
      const names = heldBy.map((h: { pokemon_name: string }) => h.pokemon_name);
      const { data: pokemonPages } = await supabase
        .from('pages')
        .select('slug, metadata')
        .in('slug', names)
        .eq('template_type', 'pokemon');
      for (const pp of pokemonPages ?? []) {
        if (pp.metadata?.pokemon_id) {
          itemPokemonMap[pp.slug] = pp.metadata.pokemon_id;
        }
      }
    }
  }

  // ── Ability: build pokemonMap ─────────────────────────────────────────────
  let abilityPokemonMap: Record<string, number> = {};
  if (isAbility) {
    const abilityPokemon: { name: string }[] = page.metadata?.pokemon ?? [];
    if (abilityPokemon.length > 0) {
      // Only Gen 1-5 (pokemon_id <= 649); fetch in batches of 100 names
      const names = abilityPokemon.slice(0, 100).map((p: { name: string }) => p.name);
      const { data: pokemonPages } = await supabase
        .from('pages')
        .select('slug, metadata')
        .in('slug', names)
        .eq('template_type', 'pokemon');
      for (const pp of pokemonPages ?? []) {
        if (pp.metadata?.pokemon_id && pp.metadata.pokemon_id <= 649) {
          abilityPokemonMap[pp.slug] = pp.metadata.pokemon_id;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Wiki', href: '/wiki' },
          { label: page.title },
        ]} />

        {isPokemon ? (
          // ── Pokémon template ──────────────────────────────────────────────
          <>
            <PokemonTemplate
              page={pageData}
              evolutionChain={evolutionChain.length > 0 ? evolutionChain : undefined}
              evolutionPokemonMap={evolutionPokemonMap}
              eggMovesData={eggMovesData.length > 0 ? eggMovesData : undefined}
            />
            <CommunityUpdates pageSlug={slug} pageTitle={page.title} />
          </>
        ) : isMove ? (
          // ── Move template ─────────────────────────────────────────────────
          <>
            <MoveTemplate page={pageData} slug={slug} />
            <CommunityUpdates pageSlug={slug} pageTitle={page.title} />
          </>
        ) : isItem ? (
          // ── Item template ─────────────────────────────────────────────────
          <>
            <ItemTemplate page={pageData} pokemonMap={itemPokemonMap} />
            <CommunityUpdates pageSlug={slug} pageTitle={page.title} />
          </>
        ) : isAbility ? (
          // ── Ability template ──────────────────────────────────────────────
          <>
            <AbilityTemplate page={pageData} pokemonMap={abilityPokemonMap} />
            <CommunityUpdates pageSlug={slug} pageTitle={page.title} />
          </>
        ) : isEliteFour ? (
          // ── Elite Four hub ────────────────────────────────────────────────
          <>
            <EliteFourTemplate />
            <CommunityUpdates pageSlug={slug} pageTitle={page.title} />
          </>
        ) : (
          // ── Free markdown template ────────────────────────────────────────
          <div className="flex gap-10">
            <main className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight">{page.title}</h1>
                {page.category && (
                  <span className="rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-sm font-medium text-red-400">
                    {page.category}
                  </span>
                )}
              </div>
              <div className="prose-invert">
                <MarkdownContent content={page.content} />
              </div>
              <CommunityUpdates pageSlug={slug} pageTitle={page.title} />
            </main>

            <aside className="w-56 shrink-0 hidden lg:block">
              <div className="sticky top-8 rounded-xl bg-gray-900 border border-gray-800 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                  Page Info
                </h3>
                <div className="text-sm text-gray-400">
                  <p className="text-gray-500 text-xs mb-1">Last updated</p>
                  <p className="text-gray-200 font-medium">{updatedAt}</p>
                </div>
                {page.category && (
                  <div className="mt-4 text-sm text-gray-400">
                    <p className="text-gray-500 text-xs mb-1">Category</p>
                    <Link
                      href={`/wiki?category=${page.category.toLowerCase()}`}
                      className="text-gray-200 font-medium hover:text-red-400 transition-colors"
                    >
                      {page.category}
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
