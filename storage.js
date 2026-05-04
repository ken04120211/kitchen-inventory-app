/**
 * LocalStorage操作クラス
 */
class InventoryStorage {
    constructor() {
        this.STORAGE_KEY = 'kitchen_inventory';
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        // 既存のデータがない場合は空の配列で初期化
        if (!this.getItems()) {
            this.setItems([]);
        }
    }

    /**
     * 全アイテムを取得
     */
    getItems() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('データの読み込みエラー:', error);
            return [];
        }
    }

    /**
     * 全アイテムを保存
     */
    setItems(items) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
            return true;
        } catch (error) {
            console.error('データの保存エラー:', error);
            return false;
        }
    }

    /**
     * アイテムを追加
     */
    addItem(item) {
        const items = this.getItems();
        // IDを生成
        item.id = this.generateId();
        item.createdAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        
        items.push(item);
        return this.setItems(items);
    }

    /**
     * アイテムを更新
     */
    updateItem(id, updatedItem) {
        const items = this.getItems();
        const index = items.findIndex(item => item.id === id);
        
        if (index === -1) {
            return false;
        }
        
        // 既存のアイテムを更新
        items[index] = {
            ...items[index],
            ...updatedItem,
            id: id, // IDは変更しない
            updatedAt: new Date().toISOString()
        };
        
        return this.setItems(items);
    }

    /**
     * アイテムを削除
     */
    deleteItem(id) {
        const items = this.getItems();
        const filteredItems = items.filter(item => item.id !== id);
        
        if (filteredItems.length === items.length) {
            return false; // 削除対象が見つからなかった
        }
        
        return this.setItems(filteredItems);
    }

    /**
     * IDでアイテムを取得
     */
    getItemById(id) {
        const items = this.getItems();
        return items.find(item => item.id === id);
    }

    /**
     * カテゴリーでアイテムを取得
     */
    getItemsByCategory(category) {
        const items = this.getItems();
        return items.filter(item => item.category === category);
    }

    /**
     * 在庫が少ないアイテムを取得
     */
    getLowStockItems(threshold = 3) {
        const items = this.getItems();
        return items.filter(item => item.quantity <= threshold);
    }

    /**
     * 期限切れ間近のアイテムを取得
     */
    getExpiringItems(days = 7) {
        const items = this.getItems();
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        
        return items.filter(item => {
            if (!item.expiry) return false;
            
            const expiryDate = new Date(item.expiry);
            return expiryDate <= targetDate && expiryDate >= new Date();
        });
    }

    /**
     * 期限切れのアイテムを取得
     */
    getExpiredItems() {
        const items = this.getItems();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return items.filter(item => {
            if (!item.expiry) return false;
            
            const expiryDate = new Date(item.expiry);
            return expiryDate < today;
        });
    }

    /**
     * アイテムを検索
     */
    searchItems(query) {
        const items = this.getItems();
        const searchQuery = query.toLowerCase();
        
        return items.filter(item => {
            return item.name.toLowerCase().includes(searchQuery) ||
                   item.category.toLowerCase().includes(searchQuery) ||
                   (item.note && item.note.toLowerCase().includes(searchQuery));
        });
    }

    /**
     * アイテムをソート
     */
    sortItems(items, sortBy = 'name') {
        const sortedItems = [...items];
        
        switch (sortBy) {
            case 'name':
                return sortedItems.sort((a, b) => a.name.localeCompare(b.name));
            
            case 'category':
                return sortedItems.sort((a, b) => {
                    if (a.category === b.category) {
                        return a.name.localeCompare(b.name);
                    }
                    return a.category.localeCompare(b.category);
                });
            
            case 'quantity':
                return sortedItems.sort((a, b) => a.quantity - b.quantity);
            
            case 'expiry':
                return sortedItems.sort((a, b) => {
                    if (!a.expiry && !b.expiry) return 0;
                    if (!a.expiry) return 1;
                    if (!b.expiry) return -1;
                    return new Date(a.expiry) - new Date(b.expiry);
                });
            
            default:
                return sortedItems;
        }
    }

    /**
     * ユニークIDを生成
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * データをエクスポート
     */
    exportData() {
        const items = this.getItems();
        const exportData = {
            items: items,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * データをインポート
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.items && Array.isArray(data.items)) {
                // 既存のデータをバックアップ
                const backup = this.getItems();
                
                try {
                    this.setItems(data.items);
                    return { success: true, itemCount: data.items.length };
                } catch (error) {
                    // 復元に失敗した場合はバックアップを復元
                    this.setItems(backup);
                    throw error;
                }
            } else {
                throw new Error('無効なデータ形式です');
            }
        } catch (error) {
            console.error('データのインポートエラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 全データをクリア
     */
    clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.init();
            return true;
        } catch (error) {
            console.error('データのクリアエラー:', error);
            return false;
        }
    }
}

// グローバルインスタンスを作成
window.inventoryStorage = new InventoryStorage();