export type Trade = {
  id:                  string;
  user_id:             string;
  item_name:           string;
  item_image_url:      string | null;
  item_type:           string;
  pokemon_tags:        string[] | null;
  custom_tags:         string[] | null;
  quantity:            number;
  buy_price_per_unit:  number | null;
  sell_price_per_unit: number | null;
  tax_per_unit:        number | null;
  is_direct_trade:     boolean;
  status:              string;
  traded_with:         string | null;
  notes:               string | null;
  is_recurring:        boolean;
  target_buy_price:    number | null;
  sold_at:             string | null;
  created_at:          string;
  updated_at:          string;
};

export type TradeTag = {
  id:      string;
  user_id: string;
  name:    string;
  color:   string;
};
