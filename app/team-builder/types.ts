export type StatKey = 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed';

export type Stats = Record<StatKey, number>;

export type TeamPokemon = {
  id:               string;
  team_id:          string;
  slot:             number;
  pokemon_slug:     string | null;
  pokemon_name:     string | null;
  pokemon_id:       number | null;
  sprite_url:       string | null;
  level:            number;
  nature:           string;
  is_shiny:         boolean;
  ability:          string | null;
  held_item:        string | null;
  description:      string | null;
  ivs:              Stats;
  evs:              Stats;
  moves:            string[] | null;
};

export type Team = {
  id:          string;
  user_id:     string;
  name:        string;
  description: string | null;
  price:       number | null;
  share_code:  string;
  tags:        string[] | null;
  created_at:  string;
  updated_at:  string;
  team_pokemon?: TeamPokemon[];
};
