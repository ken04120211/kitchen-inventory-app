"use client";

import { Plus, Camera, ShoppingCart, Users, Settings, BookMarked } from "lucide-react";

interface HeaderProps {
  onAddItem: () => void;
  onScanReceipt: () => void;
  onOpenKnownItems: () => void;
  onOpenShoppingList: () => void;
  onOpenSettings: () => void;
  familyName?: string;
  userName?: string;
}

export default function Header({
  onAddItem,
  onScanReceipt,
  onOpenKnownItems,
  onOpenShoppingList,
  onOpenSettings,
  familyName,
  userName,
}: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl mb-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">🍳 キッチン在庫管理</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {familyName && (
              <span className="flex items-center gap-1 text-blue-100">
                <Users size={14} />
                {familyName}
              </span>
            )}
            {userName && (
              <span className="text-blue-200">{userName}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onOpenKnownItems}
            className="flex items-center gap-2 bg-white/20 text-white border border-white/40 px-4 py-2.5 rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm"
          >
            <BookMarked size={18} />
            よく買う品目
          </button>
          <button
            onClick={onOpenShoppingList}
            className="flex items-center gap-2 bg-white/20 text-white border border-white/40 px-4 py-2.5 rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm"
          >
            <ShoppingCart size={18} />
            買い物リスト
          </button>
          <button
            onClick={onScanReceipt}
            className="flex items-center gap-2 bg-white/20 text-white border border-white/40 px-4 py-2.5 rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm"
          >
            <Camera size={18} />
            レシート読み取り
          </button>
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md text-sm"
          >
            <Plus size={18} />
            食材追加
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 bg-white/10 text-white/70 border border-white/20 px-3 py-2.5 rounded-lg hover:bg-white/20 transition-colors text-sm"
            title="設定"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
