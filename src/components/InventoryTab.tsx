"use client";

import { Plus, Camera, ShoppingCart, BookMarked } from "lucide-react";
import { FoodItem, InventoryFilters } from "@/types";
import AlertsSection from "./AlertsSection";
import FilterControls from "./FilterControls";
import InventoryGrid from "./InventoryGrid";

interface Props {
  items: FoodItem[];
  filteredItems: FoodItem[];
  filters: InventoryFilters;
  onFiltersChange: (f: Partial<InventoryFilters>) => void;
  onAddItem: () => void;
  onEditItem: (item: FoodItem) => void;
  onDeleteItem: (id: string) => Promise<void>;
  onConsumeItem: (id: string) => Promise<void>;
  onScanReceipt: () => void;
  onOpenShoppingList: () => void;
  onOpenKnownItems: () => void;
}

export default function InventoryTab({
  items,
  filteredItems,
  filters,
  onFiltersChange,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onConsumeItem,
  onScanReceipt,
  onOpenShoppingList,
  onOpenKnownItems,
}: Props) {
  return (
    <div className="space-y-4">
      {/* アクションボタン（モバイルのみ・デスクトップはサイドバーに移動） */}
      <div className="md:hidden grid grid-cols-3 gap-2">
        <button
          onClick={onAddItem}
          className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={17} />
          食材追加
        </button>
        <button
          onClick={onScanReceipt}
          className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Camera size={17} />
          レシート
        </button>
        <button
          onClick={onOpenShoppingList}
          className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ShoppingCart size={17} />
          買い物リスト
        </button>
      </div>

      {/* よく買う品目（モバイルのみ） */}
      <button
        onClick={onOpenKnownItems}
        className="md:hidden w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
      >
        <BookMarked size={14} />
        よく買う品目を管理
      </button>

      {/* アラート */}
      <AlertsSection items={items} />

      {/* フィルター */}
      <FilterControls filters={filters} onFiltersChange={onFiltersChange} />

      {/* 在庫グリッド */}
      <InventoryGrid
        items={filteredItems}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onConsumeItem={onConsumeItem}
      />
    </div>
  );
}
