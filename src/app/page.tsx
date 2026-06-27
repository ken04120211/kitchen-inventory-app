"use client";

import { useState, useEffect, useCallback } from "react";
import { FoodItem, InventoryFilters, KnownItem, Recipe } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const FAMILY_ID_CACHE_KEY = "cached_family_id_v1";
const loadCachedFamilyId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FAMILY_ID_CACHE_KEY);
};
const saveCachedFamilyId = (id: string) => localStorage.setItem(FAMILY_ID_CACHE_KEY, id);
const clearCachedFamilyId = () => localStorage.removeItem(FAMILY_ID_CACHE_KEY);

import {
  subscribeToItems,
  addItem as fsAddItem,
  updateItem as fsUpdateItem,
  deleteItem as fsDeleteItem,
} from "@/lib/firestoreDB";
import {
  subscribeToRecipes,
  addRecipe as fsAddRecipe,
  updateRecipe as fsUpdateRecipe,
  deleteRecipe as fsDeleteRecipe,
} from "@/lib/recipeDB";
import { getUserFamilyId, getFamily, Family } from "@/lib/familyDB";
import { KnownItemsStorage } from "@/lib/knownItemsStorage";
import { scanReceipt, ScanProgress } from "@/lib/receiptScanner";
import { ParsedReceiptItem } from "@/lib/receiptParser";
import LoginPage from "@/components/LoginPage";
import FamilySetupModal from "@/components/FamilySetupModal";
import Header from "@/components/Header";
import RecipeTab from "@/components/RecipeTab";
import InventoryTab from "@/components/InventoryTab";
import ItemModal from "@/components/ItemModal";
import ReceiptPreviewModal from "@/components/ReceiptPreviewModal";
import KnownItemsModal from "@/components/KnownItemsModal";
import ShoppingListModal from "@/components/ShoppingListModal";
import SettingsModal from "@/components/SettingsModal";
import OnboardingModal, { hasSeenOnboarding } from "@/components/OnboardingModal";
import { ChefHat, Package } from "lucide-react";

type Tab = "recipe" | "inventory";

export default function Home() {
  const { user, quickAuth, loading: authLoading, logout } = useAuth();

  const effectiveUid = user?.uid ?? quickAuth?.uid ?? null;
  const effectiveDisplayName = user?.displayName ?? quickAuth?.displayName ?? null;
  const effectiveEmail = user?.email ?? quickAuth?.email ?? null;

  const [familyId, setFamilyId] = useState<string | null>(() =>
    (typeof window !== "undefined" && localStorage.getItem("quick_auth_v1"))
      ? loadCachedFamilyId()
      : null
  );
  const [family, setFamily] = useState<Family | null>(null);

  const [familySearchDone, setFamilySearchDone] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!(localStorage.getItem("quick_auth_v1") && loadCachedFamilyId());
  });

  const [items, setItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    searchQuery: "",
    category: "",
    sortBy: "name",
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("recipe");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [isKnownItemsOpen, setIsKnownItemsOpen] = useState(false);
  const [knownItems, setKnownItems] = useState<KnownItem[]>([]);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scannedItems, setScannedItems] = useState<ParsedReceiptItem[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    setKnownItems(KnownItemsStorage.getItems());
  }, []);

  useEffect(() => {
    if (!effectiveUid) {
      setFamilyId(null);
      setFamily(null);
      setItems([]);
      clearCachedFamilyId();
      setFamilySearchDone(false);
      return;
    }

    getUserFamilyId(effectiveUid)
      .then(async (id) => {
        if (id) {
          saveCachedFamilyId(id);
          setFamilyId(id);
          try {
            const f = await getFamily(id, effectiveUid);
            setFamily(f);
            if (f && !hasSeenOnboarding()) setShowOnboarding(true);
          } catch {
            // getFamily失敗はfamilyIdは保持したまま先に進む
          }
        } else {
          const hasCached = !!loadCachedFamilyId();
          if (!hasCached) setFamilyId(null);
        }
        setFamilySearchDone(true);
      })
      .catch(() => {
        // 権限エラー（web認証未確定）: userが確定した際に再実行
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUid, user]);

  useEffect(() => {
    if (!effectiveUid || familySearchDone) return;
    const t = setTimeout(() => setFamilySearchDone(true), 10000);
    return () => clearTimeout(t);
  }, [effectiveUid, familySearchDone]);

  useEffect(() => {
    if (!familyId) return;
    const unsubItems = subscribeToItems(familyId, setItems);
    const unsubRecipes = subscribeToRecipes(familyId, setRecipes);
    return () => { unsubItems(); unsubRecipes(); };
  }, [familyId, user]);

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
    saveCachedFamilyId(id);
    setFamilyId(id);
    setFamilySearchDone(true);
    const f = await getFamily(id);
    setFamily(f);
    if (!hasSeenOnboarding()) setShowOnboarding(true);
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
      const detected = await scanReceipt(setScanProgress, knownItems);
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

  const handleCook = async (deductions: { itemId: string; newQty: number }[]) => {
    if (!familyId) return;
    await Promise.all(
      deductions.map(({ itemId, newQty }) =>
        fsUpdateItem(familyId, itemId, { quantity: newQty })
      )
    );
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

  if (authLoading && !quickAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authLoading && !user && !quickAuth) return <LoginPage />;

  if (effectiveUid && !familyId && !familySearchDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!familyId && familySearchDone && effectiveUid) {
    return (
      <FamilySetupModal
        user={{ uid: effectiveUid, displayName: effectiveDisplayName, email: effectiveEmail }}
        onSetupComplete={handleFamilySetupComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-6 pb-24 max-w-2xl">
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          familyName={family?.name}
          userName={effectiveDisplayName ?? undefined}
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

        {/* タブ本体 */}
        {activeTab === "recipe" ? (
          <RecipeTab
            recipes={recipes}
            items={items}
            onAdd={async (data) => { await fsAddRecipe(familyId!, data); }}
            onUpdate={(id, data) => fsUpdateRecipe(familyId!, id, data)}
            onDelete={(id) => fsDeleteRecipe(familyId!, id)}
            onCook={handleCook}
          />
        ) : (
          <InventoryTab
            items={items}
            filteredItems={filteredItems}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onConsumeItem={handleConsumeItem}
            onScanReceipt={handleScanReceipt}
            onOpenShoppingList={() => setIsShoppingListOpen(true)}
            onOpenKnownItems={() => setIsKnownItemsOpen(true)}
          />
        )}
      </div>

      {/* ボトムタブナビ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-40">
        <div className="flex max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab("recipe")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === "recipe"
                ? "text-orange-500 border-t-2 border-orange-500 -mt-px"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <ChefHat size={22} />
            レシピ
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === "inventory"
                ? "text-blue-600 border-t-2 border-blue-600 -mt-px"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Package size={22} />
            在庫
          </button>
        </div>
      </nav>

      {/* モーダル類 */}
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

      {isKnownItemsOpen && (
        <KnownItemsModal
          items={knownItems}
          onChange={setKnownItems}
          onClose={() => setIsKnownItemsOpen(false)}
        />
      )}

      {isShoppingListOpen && (
        <ShoppingListModal
          items={items}
          onClose={() => setIsShoppingListOpen(false)}
        />
      )}

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      {isSettingsOpen && family && effectiveUid && (
        <SettingsModal
          user={{
            uid: effectiveUid,
            displayName: effectiveDisplayName,
            email: effectiveEmail,
            photoURL: user?.photoURL ?? null,
          }}
          family={family}
          onClose={() => setIsSettingsOpen(false)}
          onFamilyNameUpdate={(name) => setFamily((f) => f ? { ...f, name } : f)}
          onLeaveFamily={() => {
            clearCachedFamilyId();
            setFamilyId(null);
            setFamily(null);
            setItems([]);
            setFamilySearchDone(false);
            setIsSettingsOpen(false);
          }}
          onLogout={logout}
        />
      )}
    </div>
  );
}
