import { KnownItem, FoodCategory, Unit } from "@/types";

const KNOWN_ITEMS_KEY = "kitchen_known_items";

export class KnownItemsStorage {
  static getItems(): KnownItem[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(KNOWN_ITEMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static setItems(items: KnownItem[]): boolean {
    if (typeof window === "undefined") return false;
    try {
      localStorage.setItem(KNOWN_ITEMS_KEY, JSON.stringify(items));
      return true;
    } catch {
      return false;
    }
  }

  static addItem(item: Omit<KnownItem, "id">): boolean {
    const items = this.getItems();
    items.push({ ...item, id: Date.now().toString(36) + Math.random().toString(36).slice(2) });
    return this.setItems(items);
  }

  static updateItem(id: string, item: Partial<Omit<KnownItem, "id">>): boolean {
    const items = this.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return false;
    items[index] = { ...items[index], ...item };
    return this.setItems(items);
  }

  static deleteItem(id: string): boolean {
    const items = this.getItems();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) return false;
    return this.setItems(filtered);
  }
}

export const CATEGORY_OPTIONS: FoodCategory[] = [
  "野菜", "肉類", "魚類", "乳製品", "調味料", "レトルト", "カップ麺", "冷凍食品", "その他",
];

export const UNIT_OPTIONS: Unit[] = [
  "個", "本", "袋", "パック", "kg", "g", "L", "ml",
];
