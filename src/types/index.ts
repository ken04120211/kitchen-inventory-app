export type FoodCategory = 
  | "野菜"
  | "肉類" 
  | "魚類"
  | "乳製品"
  | "調味料"
  | "レトルト"
  | "カップ麺"
  | "冷凍食品"
  | "その他";

export type Unit = 
  | "個"
  | "本"
  | "袋"
  | "パック"
  | "kg"
  | "g"
  | "L"
  | "ml";

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: Unit;
  expiry?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryFilters {
  searchQuery: string;
  category: FoodCategory | "";
  sortBy: "name" | "category" | "quantity" | "expiry";
}

export interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  message: string;
  items?: FoodItem[];
}

export type StockStatus = "normal" | "low" | "out";
export type ExpiryStatus = "normal" | "warning" | "danger" | "expired";

export interface KnownItem {
  id: string;
  name: string;
  aliases: string[];
  category: FoodCategory;
  unit: Unit;
  defaultQuantity: number;
}