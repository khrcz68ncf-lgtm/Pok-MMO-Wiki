import { StatKey } from './types';

export const STAT_LABELS: Record<StatKey, string> = {
  hp:              'HP',
  attack:          'Atk',
  defense:         'Def',
  special_attack:  'SpA',
  special_defense: 'SpD',
  speed:           'Spe',
};

export const STAT_KEYS: StatKey[] = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'];

export const STAT_COLORS: Record<StatKey, string> = {
  hp:              'bg-red-500',
  attack:          'bg-orange-500',
  defense:         'bg-yellow-500',
  special_attack:  'bg-blue-500',
  special_defense: 'bg-green-500',
  speed:           'bg-pink-500',
};

export type Nature = {
  name:     string;
  plus:     StatKey | null;
  minus:    StatKey | null;
};

export const NATURES: Nature[] = [
  { name: 'Hardy',   plus: null,             minus: null },
  { name: 'Lonely',  plus: 'attack',         minus: 'defense' },
  { name: 'Brave',   plus: 'attack',         minus: 'speed' },
  { name: 'Adamant', plus: 'attack',         minus: 'special_attack' },
  { name: 'Naughty', plus: 'attack',         minus: 'special_defense' },
  { name: 'Bold',    plus: 'defense',        minus: 'attack' },
  { name: 'Docile',  plus: null,             minus: null },
  { name: 'Relaxed', plus: 'defense',        minus: 'speed' },
  { name: 'Impish',  plus: 'defense',        minus: 'special_attack' },
  { name: 'Lax',     plus: 'defense',        minus: 'special_defense' },
  { name: 'Timid',   plus: 'speed',          minus: 'attack' },
  { name: 'Hasty',   plus: 'speed',          minus: 'defense' },
  { name: 'Serious', plus: null,             minus: null },
  { name: 'Jolly',   plus: 'speed',          minus: 'special_attack' },
  { name: 'Naive',   plus: 'speed',          minus: 'special_defense' },
  { name: 'Modest',  plus: 'special_attack', minus: 'attack' },
  { name: 'Mild',    plus: 'special_attack', minus: 'defense' },
  { name: 'Quiet',   plus: 'special_attack', minus: 'speed' },
  { name: 'Bashful', plus: null,             minus: null },
  { name: 'Rash',    plus: 'special_attack', minus: 'special_defense' },
  { name: 'Calm',    plus: 'special_defense', minus: 'attack' },
  { name: 'Gentle',  plus: 'special_defense', minus: 'defense' },
  { name: 'Sassy',   plus: 'special_defense', minus: 'speed' },
  { name: 'Careful', plus: 'special_defense', minus: 'special_attack' },
  { name: 'Quirky',  plus: null,             minus: null },
];

export const DEFAULT_IVS = { hp: 31, attack: 31, defense: 31, special_attack: 31, special_defense: 31, speed: 31 };
export const DEFAULT_EVS = { hp: 0,  attack: 0,  defense: 0,  special_attack: 0,  special_defense: 0,  speed: 0 };

export const TEAM_TAGS = ['Competitive', 'Casual', 'Monotype', 'Weather', 'Stall', 'Hyper Offense', 'Trick Room', 'Budget', 'Shiny', 'For Sale'];
