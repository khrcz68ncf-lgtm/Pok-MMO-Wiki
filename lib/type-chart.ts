// Standard Gen 6+ type effectiveness chart.
// chart[attacking][defending] = multiplier

export const EFF: Record<string, Record<string, number>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fighting: 2, poison: 0.5, bug: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export type TypeName = string;

export interface TypeEffectiveness {
  immune:   TypeName[]; // 0x
  quarter:  TypeName[]; // 0.25x
  half:     TypeName[]; // 0.5x
  double:   TypeName[]; // 2x
  quadruple: TypeName[]; // 4x
}

export const ALL_TYPES: TypeName[] = [
  'normal','fire','water','electric','grass','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy',
];

export function calcEffectiveness(defTypes: TypeName[]): TypeEffectiveness {
  const result: TypeEffectiveness = { immune: [], quarter: [], half: [], double: [], quadruple: [] };

  for (const atk of ALL_TYPES) {
    let mult = 1;
    for (const def of defTypes) {
      mult *= EFF[atk]?.[def] ?? 1;
    }
    if (mult === 0)    result.immune.push(atk);
    else if (mult === 0.25) result.quarter.push(atk);
    else if (mult === 0.5)  result.half.push(atk);
    else if (mult === 2)    result.double.push(atk);
    else if (mult === 4)    result.quadruple.push(atk);
  }

  return result;
}

/** Offensive chart: when attacking WITH atkType, what multiplier does each defending type receive? */
export function calcOffensive(atkType: TypeName): { superEffective: TypeName[]; notVery: TypeName[]; immune: TypeName[] } {
  const row = EFF[atkType] ?? {};
  const superEffective: TypeName[] = [];
  const notVery: TypeName[] = [];
  const immune: TypeName[] = [];
  for (const def of ALL_TYPES) {
    const m = row[def] ?? 1;
    if (m === 0)   immune.push(def);
    else if (m === 0.5) notVery.push(def);
    else if (m === 2)   superEffective.push(def);
  }
  return { superEffective, notVery, immune };
}

/** Defensive chart: when defending AS defType (single type), what attacking types are effective/resisted/immune? */
export function calcDefensive(defType: TypeName): { weakTo: TypeName[]; resists: TypeName[]; immuneTo: TypeName[] } {
  const weakTo: TypeName[] = [];
  const resists: TypeName[] = [];
  const immuneTo: TypeName[] = [];
  for (const atk of ALL_TYPES) {
    const m = EFF[atk]?.[defType] ?? 1;
    if (m === 0)   immuneTo.push(atk);
    else if (m === 0.5) resists.push(atk);
    else if (m === 2)   weakTo.push(atk);
  }
  return { weakTo, resists, immuneTo };
}

export const TYPE_COLORS: Record<string, string> = {
  normal:   '#A8A878', fire:     '#EE8130', water:    '#6390F0',
  electric: '#F7D02C', grass:    '#7AC74C', ice:      '#96D9D6',
  fighting: '#C22E28', poison:   '#A33EA1', ground:   '#E2BF65',
  flying:   '#A98FF3', psychic:  '#F95587', bug:      '#A6B91A',
  rock:     '#B6A136', ghost:    '#735797', dragon:   '#6F35FC',
  dark:     '#705746', steel:    '#B7B7CE', fairy:    '#D685AD',
};
