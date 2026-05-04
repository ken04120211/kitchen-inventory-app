import { FoodItem, FoodCategory } from "@/types";

const STORAGE_KEY = "kitchen_inventory";

export class InventoryStorage {
  static getItems(): FoodItem[] {
    if (typeof window === "undefined") return [];
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("データの読み込みエラー:", error);
      return [];
    }
  }

  static setItems(items: FoodItem[]): boolean {
    if (typeof window === "undefined") return false;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error("データの保存エラー:", error);
      return false;
    }
  }

  static addItem(item: Omit<FoodItem, "id" | "createdAt" | "updatedAt">): boolean {
    const items = this.getItems();
    const newItem: FoodItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    items.push(newItem);
    return this.setItems(items);
  }

  static updateItem(id: string, updatedItem: Partial<Omit<FoodItem, "id" | "createdAt">>): boolean {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    items[index] = {
      ...items[index],
      ...updatedItem,
      id,
      updatedAt: new Date().toISOString()
    };
    
    return this.setItems(items);
  }

  static deleteItem(id: string): boolean {
    const items = this.getItems();
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) return false;
    
    return this.setItems(filteredItems);
  }

  static getItemById(id: string): FoodItem | undefined {
    return this.getItems().find(item => item.id === id);
  }

  static getItemsByCategory(category: FoodCategory): FoodItem[] {
    return this.getItems().filter(item => item.category === category);
  }

  static getLowStockItems(threshold: number = 3): FoodItem[] {
    return this.getItems().filter(item => item.quantity <= threshold);
  }

  static getExpiringItems(days: number = 7): FoodItem[] {
    const items = this.getItems();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    return items.filter(item => {
      if (!item.expiry) return false;
      
      const expiryDate = new Date(item.expiry);
      return expiryDate <= targetDate && expiryDate >= new Date();
    });
  }

  static getExpiredItems(): FoodItem[] {
    const items = this.getItems();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return items.filter(item => {
      if (!item.expiry) return false;
      
      const expiryDate = new Date(item.expiry);
      return expiryDate < today;
    });
  }

  static searchItems(query: string): FoodItem[] {
    const items = this.getItems();
    const searchQuery = query.toLowerCase();
    
    return items.filter(item => {
      return item.name.toLowerCase().includes(searchQuery) ||
             item.category.toLowerCase().includes(searchQuery) ||
             (item.note && item.note.toLowerCase().includes(searchQuery));
    });
  }

  static sortItems(items: FoodItem[], sortBy: "name" | "category" | "quantity" | "expiry"): FoodItem[] {
    const sortedItems = [...items];
    
    switch (sortBy) {
      case "name":
        return sortedItems.sort((a, b) => a.name.localeCompare(b.name));
      
      case "category":
        return sortedItems.sort((a, b) => {
          if (a.category === b.category) {
            return a.name.localeCompare(b.name);
          }
          return a.category.localeCompare(b.category);
        });
      
      case "quantity":
        return sortedItems.sort((a, b) => a.quantity - b.quantity);
      
      case "expiry":
        return sortedItems.sort((a, b) => {
          if (!a.expiry && !b.expiry) return 0;
          if (!a.expiry) return 1;
          if (!b.expiry) return -1;
          return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
        });
      
      default:
        return sortedItems;
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static exportData(): string {
    const items = this.getItems();
    const exportData = {
      items,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    return JSON.stringify(exportData, null, 2);
  }

  static importData(jsonData: string): { success: boolean; itemCount?: number; error?: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.items && Array.isArray(data.items)) {
        const backup = this.getItems();
        
        try {
          this.setItems(data.items);
          return { success: true, itemCount: data.items.length };
        } catch (error) {
          this.setItems(backup);
          throw error;
        }
      } else {
        throw new Error("無効なデータ形式です");
      }
    } catch (error) {
      console.error("データのインポートエラー:", error);
      return { success: false, error: error instanceof Error ? error.message : "不明なエラー" };
    }
  }

  static clearAll(): boolean {
    if (typeof window === "undefined") return false;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("データのクリアエラー:", error);
      return false;
    }
  }
}