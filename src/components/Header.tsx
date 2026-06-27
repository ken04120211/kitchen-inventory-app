"use client";

import { Plus, Camera, ShoppingCart, Settings, BookMarked, ChefHat, Users } from "lucide-react";

interface HeaderProps {
  onAddItem: () => void;
  onScanReceipt: () => void;
  onOpenKnownItems: () => void;
  onOpenShoppingList: () => void;
  onOpenSettings: () => void;
  onOpenRecipes: () => void;
  familyName?: string;
  userName?: string;
}

export default function Header({
  onAddItem,
  onScanReceipt,
  onOpenKnownItems,
  onOpenShoppingList,
  onOpenSettings,
  onOpenRecipes,
  familyName,
  userName,
}: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 pt-5 pb-4 rounded-xl mb-6 shadow-lg">
      {/* 上段: アプリ名 + ファミリー情報 + 設定 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📋 キッチンプランナー</h1>
          <div className="flex items-center gap-3 mt-0.5 text-sm text-blue-100">
            {familyName && (
              <span className="flex items-center gap-1">
                <Users size={13} />
                {familyName}
              </span>
            )}
            {userName && <span className="text-blue-200">{userName}</span>}
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full transition-colors"
          title="設定"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* 下段: アクションボタン */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* 主要アクション: レシピ + 食材追加 */}
        <button
          onClick={onOpenRecipes}
          className="flex items-center justify-center gap-2 bg-orange-400/90 hover:bg-orange-400 text-white px-3 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <ChefHat size={17} />
          レシピ
        </button>
        <button
          onClick={onAddItem}
          className="flex items-center justify-center gap-2 bg-white text-blue-600 px-3 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
        >
          <Plus size={17} />
          食材追加
        </button>

        {/* サブアクション: 買い物リスト + スキャン */}
        <button
          onClick={onOpenShoppingList}
          className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          <ShoppingCart size={17} />
          買い物リスト
        </button>
        <button
          onClick={onScanReceipt}
          className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          <Camera size={17} />
          レシート
        </button>

        {/* よく買う品目: 全幅 or 右寄せ */}
        <button
          onClick={onOpenKnownItems}
          className="col-span-2 sm:col-span-4 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white/80 border border-white/20 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          <BookMarked size={14} />
          よく買う品目を管理
        </button>
      </div>
    </header>
  );
}
