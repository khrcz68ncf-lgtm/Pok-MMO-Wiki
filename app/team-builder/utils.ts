import { Stats, StatKey, TeamPokemon } from './types';
import { NATURES } from './constants';

/** Calculate a single stat value */
export function calcStat(
  stat:    StatKey,
  base:    number,
  iv:      number,
  ev:      number,
  level:   number,
  nature:  string,
): number {
  const n = NATURES.find(n => n.name === nature) ?? NATURES[0];
  const inner = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100);

  if (stat === 'hp') {
    return inner + level + 10;
  }

  let mod = 1;
  if (n.plus === stat)  mod = 1.1;
  if (n.minus === stat) mod = 0.9;

  return Math.floor((inner + 5) * mod);
}

/** Calculate all 6 stats given base stats object */
export function calcAllStats(
  bases:   Stats,
  ivs:     Stats,
  evs:     Stats,
  level:   number,
  nature:  string,
): Stats {
  const result = {} as Stats;
  for (const key of Object.keys(bases) as StatKey[]) {
    result[key] = calcStat(key, bases[key], ivs[key], evs[key], level, nature);
  }
  return result;
}

/** Total EVs used */
export function totalEVs(evs: Stats): number {
  return Object.values(evs).reduce((a, b) => a + b, 0);
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Generate a random XXXX-XXXX-XXXX share code */
export function generateShareCode(): string {
  const rand = (n: number) => Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
  return `${rand(4)}-${rand(4)}-${rand(4)}`;
}

/** Export team to Showdown-style text */
export function exportTeamText(pokemon: TeamPokemon[]): string {
  return pokemon.map(p => {
    if (!p.pokemon_name) return '';
    const lines: string[] = [];
    const shiny = p.is_shiny ? ' (S)' : '';
    const item  = p.held_item ? ` @ ${p.held_item}` : '';
    lines.push(`${p.pokemon_name}${shiny}${item}`);
    if (p.ability)  lines.push(`Ability: ${p.ability}`);
    lines.push(`Level: ${p.level}`);
    lines.push(`Nature: ${p.nature}`);

    const ivLine = Object.entries(p.ivs)
      .filter(([, v]) => v !== 31)
      .map(([k, v]) => `${v} ${statAbbr(k as StatKey)}`)
      .join(' / ');
    if (ivLine) lines.push(`IVs: ${ivLine}`);

    const evLine = Object.entries(p.evs)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${statAbbr(k as StatKey)}`)
      .join(' / ');
    if (evLine) lines.push(`EVs: ${evLine}`);

    (p.moves ?? []).filter(Boolean).forEach(m => lines.push(`- ${m}`));
    return lines.join('\n');
  }).filter(Boolean).join('\n\n');
}

function statAbbr(key: StatKey): string {
  const map: Record<StatKey, string> = {
    hp: 'HP', attack: 'Atk', defense: 'Def',
    special_attack: 'SpA', special_defense: 'SpD', speed: 'Spe',
  };
  return map[key];
}

/** Parse stat abbreviation back to key */
function abbrToKey(abbr: string): StatKey | null {
  const map: Record<string, StatKey> = {
    'HP': 'hp', 'Atk': 'attack', 'Def': 'defense',
    'SpA': 'special_attack', 'SpD': 'special_defense', 'Spe': 'speed',
  };
  return map[abbr] ?? null;
}

/** Parse stat line like "252 SpA / 4 SpD / 252 Spe" */
function parseStatLine(line: string, defaultVal: number): Stats {
  const stats: Stats = { hp: defaultVal, attack: defaultVal, defense: defaultVal, special_attack: defaultVal, special_defense: defaultVal, speed: defaultVal };
  line.split('/').map(s => s.trim()).forEach(chunk => {
    const [val, abbr] = chunk.split(' ');
    const key = abbrToKey(abbr?.trim() ?? '');
    if (key) stats[key] = parseInt(val ?? '0', 10);
  });
  return stats;
}

/** Import team from Showdown-style text, returns partial TeamPokemon array */
export function importTeamText(text: string): Partial<TeamPokemon>[] {
  const blocks = text.trim().split(/\n\n+/);
  return blocks.slice(0, 6).map(block => {
    const lines = block.trim().split('\n');
    const firstLine = lines[0] ?? '';
    const atIdx = firstLine.indexOf('@');
    const namePart = (atIdx >= 0 ? firstLine.slice(0, atIdx) : firstLine).trim();
    const is_shiny = namePart.includes('(S)');
    const pokemon_name = namePart.replace('(S)', '').trim();
    const held_item = atIdx >= 0 ? firstLine.slice(atIdx + 1).trim() : null;

    let level = 50;
    let nature = 'Hardy';
    let ability: string | null = null;
    let ivs: Stats = { hp: 31, attack: 31, defense: 31, special_attack: 31, special_defense: 31, speed: 31 };
    let evs: Stats = { hp: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0 };
    const moves: string[] = [];

    for (const line of lines.slice(1)) {
      if (line.startsWith('Ability:')) ability = line.slice(8).trim();
      else if (line.startsWith('Level:')) level = parseInt(line.slice(6).trim(), 10) || 50;
      else if (line.startsWith('Nature:')) nature = line.slice(7).trim().replace(' Nature', '');
      else if (line.startsWith('IVs:')) ivs = parseStatLine(line.slice(4).trim(), 31);
      else if (line.startsWith('EVs:')) evs = parseStatLine(line.slice(4).trim(), 0);
      else if (line.startsWith('- ')) moves.push(line.slice(2).trim());
    }

    return { pokemon_name, is_shiny, held_item, level, nature, ability, ivs, evs, moves };
  });
}
