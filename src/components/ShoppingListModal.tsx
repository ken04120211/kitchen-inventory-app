"use client";

import { useState, useMemo } from "react";
import { X, Copy, Check, Plus, Trash2, ShoppingCart } from "lucide-react";
import { FoodItem } from "@/types";
import { InventoryStorage } from "@/lib/storage";
import { getCategoryIcon } from "@/lib/utils";

interface ShoppingListModalProps {
  items: FoodItem[];
  onClose: () => void;
}

type ListItem = {
  id: string;
  name: string;
  display: string;
  reason: string;
  reasonColor: string;
  checked: boolean;
  isCustom: boolean;
};

function buildSuggestions(items: FoodItem[]): ListItem[] {
  const seen = new Set<string>();
  const result: ListItem[] = [];

  const addItem = (item: FoodItem, reason: string, reasonColor: string) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    result.push({
      id: item.id,
      name: item.name,
      display: `${getCategoryIcon(item.category)} ${item.name}`,
      reason,
      reasonColor,
      checked: true,
      isCustom: false,
    });
  };

  InventoryStorage.getExpiredItems().forEach(i => addItem(i, "期限切れ", "bg-red-100 text-red-700"));
  InventoryStorage.getExpiringItems(3).forEach(i => addItem(i, "期限間近", "bg-orange-100 text-orange-700"));
  items.filter(i => i.quantity <= 0).forEach(i => addItem(i, "在庫なし", "bg-red-100 text-red-700"));
  items.filter(i => i.quantity > 0 && i.quantity <= 3).forEach(i => addItem(i, "在庫少", "bg-yellow-100 text-yellow-700"));

  return result;
}

export default function ShoppingListModal({ items, onClose }: ShoppingListModalProps) {
  const suggestions = useMemo(() => buildSuggestions(items), [items]);
  const [listItems, setListItems] = useState<ListItem[]>(suggestions);
  const [customInput, setCustomInput] = useState("");
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) => {
    setListItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const remove = (id: string) => {
    setListItems(prev => prev.filter(i => i.id !== id));
  };

  const addCustom = () => {
    const name = customInput.trim();
    if (!name) return;
    setListItems(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name,
        display: name,
        reason: "",
        reasonColor: "",
        checked: true,
        isCustom: true,
      },
    ]);
    setCustomInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addCustom();
  };

  const checkedItems = listItems.filter(i => i.checked);

  const copyToClipboard = async () => {
    const today = new Date().toLocaleDateString("ja-JP");
    const lines = [
      `買い物リスト（${today}）`,
      "",
      ...checkedItems.map(i => `□ ${i.name}${i.reason ? `（${i.reason}）` : ""}`),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShoppingCart size={20} />
                買い物リスト
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                在庫が少ない・期限切れの食材を自動提案
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* リスト */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {listItems.length === 0 && (
            <p className="text-center text-gray-400 py-8">提案がありません</p>
          )}
          {listItems.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                item.checked ? "border-orange-200 bg-orange-50/40" : "border-gray-200 bg-gray-50/50 opacity-50"
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggle(item.id)}
                className="w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0"
              />
              <span className={`flex-1 text-sm font-medium ${item.checked ? "text-gray-800" : "line-through text-gray-400"}`}>
                {item.display}
              </span>
              {item.reason && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${item.reasonColor}`}>
                  {item.reason}
                </span>
              )}
              <button
                onClick={() => remove(item.id)}
                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* カスタム追加 */}
        <div className="px-4 pb-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="食材を手動追加..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={addCustom}
              disabled={!customInput.trim()}
              className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              追加
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            閉じる
          </button>
          <button
            onClick={copyToClipboard}
            disabled={checkedItems.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "コピーしました" : `コピー（${checkedItems.length}件）`}
          </button>
        </div>
      </div>
    </div>
  );
}
