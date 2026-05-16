"use client";

import { useState, useEffect, useCallback } from "react";
import { FoodItem, InventoryFilters } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToItems,
  addItem as fsAddItem,
  updateItem as fsUpdateItem,
  deleteItem as fsDeleteItem,
} from "@/lib/firestoreDB";
import { getUserFamilyId, getFamily, Family } from "@/lib/familyDB";
import { scanReceipt, ScanProgress } from "@/lib/receiptScanner";
import { ParsedReceiptItem } from "@/lib/receiptParser";
import LoginPage from "@/components/LoginPage";
import FamilySetupModal from "@/components/FamilySetupModal";
import Header from "@/components/Header";
import InventoryGrid from "@/components/InventoryGrid";
import ItemModal from "@/components/ItemModal";
import AlertsSection from "@/components/AlertsSection";
import FilterControls from "@/components/FilterControls";
import ReceiptPreviewModal from "@/components/ReceiptPreviewModal";
import ShoppingListModal from "@/components/ShoppingListModal";

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();

  const [familyId, setFamilyId] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyLoading, setFamilyLoading] = useState(false);

  const [items, setItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    searchQuery: "",
    category: "",
    sortBy: "name",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scannedItems, setScannedItems] = useState<ParsedReceiptItem[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // ユーザーが変わったら familyId を取得
  useEffect(() => {
    if (!user) {
      setFamilyId(null);
      setFamily(null);
      setItems([]);
      return;
    }
    setFamilyLoading(true);
    getUserFamilyId(user.uid)
      .then(async (id) => {
        setFamilyId(id);
        if (id) {
          const f = await getFamily(id);
          setFamily(f);
        }
      })
      .finally(() => setFamilyLoading(false));
  }, [user]);

  // familyId が決まったら Firestore をリアルタイム購読
  useEffect(() => {
    if (!familyId) return;
    const unsubscribe = subscribeToItems(familyId, setItems);
    return unsubscribe;
  }, [familyId]);

  // クライアントサイドでフィルタリング・ソート
  useEffect(() => {
    let result = [...items];
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.note && i.note.toLowerCase().includes(q))
      );
    }
    if (filters.category) {
      result = result.filter((i) => i.category === filters.category);
    }
    switch (filters.sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "category":
        result.sort(
          (a, b) =>
            a.category.localeCompare(b.category) ||
            a.name.localeCompare(b.name)
        );
        break;
      case "quantity":
        result.sort((a, b) => a.quantity - b.quantity);
        break;
      case "expiry":
        result.sort((a, b) => {
          if (!a.expiry && !b.expiry) return 0;
          if (!a.expiry) return 1;
          if (!b.expiry) return -1;
          return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
        });
        break;
    }
    setFilteredItems(result);
  }, [items, filters]);

  const handleFamilySetupComplete = async (id: string) => {
    setFamilyId(id);
    const f = await getFamily(id);
    setFamily(f);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!familyId) return;
    await fsDeleteItem(familyId, id);
  };

  const handleConsumeItem = async (id: string) => {
    if (!familyId) return;
    const item = items.find((i) => i.id === id);
    if (!item || item.quantity <= 0) return;
    await fsUpdateItem(familyId, id, { quantity: item.quantity - 1 });
  };

  const handleSaveItem = useCallback(
    async (itemData: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => {
      if (!familyId) return;
      if (editingItem) {
        await fsUpdateItem(familyId, editingItem.id, itemData);
      } else {
        await fsAddItem(familyId, itemData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
    },
    [familyId, editingItem]
  );

  const handleFiltersChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

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

  const handleConfirmScannedItems = async (scanned: ParsedReceiptItem[]) => {
    if (!familyId) return;
    await Promise.all(scanned.map((item) => fsAddItem(familyId, item)));
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

  // ローディング中
  if (authLoading || familyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 未ログイン
  if (!user) return <LoginPage />;

  // 家族グループ未設定
  if (!familyId) {
    return <FamilySetupModal user={user} onSetupComplete={handleFamilySetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Header
          onAddItem={handleAddItem}
          onScanReceipt={handleScanReceipt}
          onOpenShoppingList={() => setIsShoppingListOpen(true)}
          familyName={family?.name}
          userName={user.displayName ?? undefined}
          inviteCode={family?.inviteCode}
          onLogout={logout}
        />

        {/* スキャン進捗オーバーレイ */}
        {scanProgress && progressLabel && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center shadow-xl max-w-sm w-full mx-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-700 font-medium">{progressLabel}</p>
              {scanProgress.status === "loading" && (
                <p className="text-gray-400 text-sm mt-2">
                  初回のみ日本語データをダウンロードします
                </p>
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
            <button
              onClick={() => setScanError(null)}
              className="text-red-400 hover:text-red-600 ml-4 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        <AlertsSection items={items} />
        <FilterControls filters={filters} onFiltersChange={handleFiltersChange} />
        <InventoryGrid
          items={filteredItems}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onConsumeItem={handleConsumeItem}
        />

        {isModalOpen && (
          <ItemModal
            item={editingItem}
            onSave={handleSaveItem}
            onClose={() => {
              setIsModalOpen(false);
              setEditingItem(null);
            }}
          />
        )}

        {scannedItems && (
          <ReceiptPreviewModal
            items={scannedItems}
            onConfirm={handleConfirmScannedItems}
            onClose={() => setScannedItems(null)}
          />
        )}

        {isShoppingListOpen && (
          <ShoppingListModal
            items={items}
            onClose={() => setIsShoppingListOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
