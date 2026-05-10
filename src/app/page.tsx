"use client";

import { useState, useEffect } from "react";
import { FoodItem, InventoryFilters } from "@/types";
import { InventoryStorage } from "@/lib/storage";
import { scanReceipt, ScanProgress } from "@/lib/receiptScanner";
import { ParsedReceiptItem } from "@/lib/receiptParser";
import Header from "@/components/Header";
import InventoryGrid from "@/components/InventoryGrid";
import ItemModal from "@/components/ItemModal";
import AlertsSection from "@/components/AlertsSection";
import FilterControls from "@/components/FilterControls";
import ReceiptPreviewModal from "@/components/ReceiptPreviewModal";

export default function Home() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    searchQuery: "",
    category: "",
    sortBy: "name",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // レシートスキャン状態
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scannedItems, setScannedItems] = useState<ParsedReceiptItem[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const loadItems = () => {
    setItems(InventoryStorage.getItems());
  };

  useEffect(() => { loadItems(); }, []);

  useEffect(() => {
    let result = items;
    if (filters.searchQuery) result = InventoryStorage.searchItems(filters.searchQuery);
    if (filters.category) result = result.filter(item => item.category === filters.category);
    result = InventoryStorage.sortItems(result, filters.sortBy);
    setFilteredItems(result);
  }, [items, filters]);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (InventoryStorage.deleteItem(id)) loadItems();
  };

  const handleSaveItem = (itemData: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => {
    const success = editingItem
      ? InventoryStorage.updateItem(editingItem.id, itemData)
      : InventoryStorage.addItem(itemData);
    if (success) {
      loadItems();
      setIsModalOpen(false);
      setEditingItem(null);
    }
    return success;
  };

  const handleFiltersChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // レシートスキャン
  const handleScanReceipt = async () => {
    setScanError(null);
    try {
      const detected = await scanReceipt(setScanProgress);
      setScannedItems(detected);
    } catch (err) {
      if (err instanceof Error && err.message.includes("cancelled")) return;
      setScanError(
        err instanceof Error ? err.message : "スキャンに失敗しました"
      );
    } finally {
      setScanProgress(null);
    }
  };

  // スキャン結果を在庫に追加
  const handleConfirmScannedItems = (items: ParsedReceiptItem[]) => {
    items.forEach(item => InventoryStorage.addItem(item));
    loadItems();
    setScannedItems(null);
  };

  const progressLabel = (() => {
    if (!scanProgress) return null;
    switch (scanProgress.status) {
      case "camera": return "カメラを起動中...";
      case "loading": return `OCRエンジン読み込み中... ${scanProgress.percent}%`;
      case "recognizing": return `テキスト認識中... ${scanProgress.percent}%`;
      default: return null;
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Header onAddItem={handleAddItem} onScanReceipt={handleScanReceipt} />

        {/* スキャン進捗オーバーレイ */}
        {scanProgress && progressLabel && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center shadow-xl max-w-sm w-full mx-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-700 font-medium">{progressLabel}</p>
              {scanProgress.status === "loading" && (
                <p className="text-gray-400 text-sm mt-2">初回のみ日本語データをダウンロードします</p>
              )}
              <div className="mt-4 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress.percent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* スキャンエラー */}
        {scanError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
            <p className="text-red-700 text-sm">{scanError}</p>
            <button onClick={() => setScanError(null)} className="text-red-400 hover:text-red-600 ml-4 flex-shrink-0">✕</button>
          </div>
        )}

        <AlertsSection items={items} />
        <FilterControls filters={filters} onFiltersChange={handleFiltersChange} />
        <InventoryGrid
          items={filteredItems}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />

        {isModalOpen && (
          <ItemModal
            item={editingItem}
            onSave={handleSaveItem}
            onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
          />
        )}

        {scannedItems && (
          <ReceiptPreviewModal
            items={scannedItems}
            onConfirm={handleConfirmScannedItems}
            onClose={() => setScannedItems(null)}
          />
        )}
      </div>
    </div>
  );
}
