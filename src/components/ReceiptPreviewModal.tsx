"use client";

import { useState } from "react";
import { X, Trash2, CheckSquare, Square } from "lucide-react";
import { FoodCategory, Unit } from "@/types";
import { ParsedReceiptItem } from "@/lib/receiptParser";

interface ReceiptPreviewModalProps {
  items: ParsedReceiptItem[];
  onConfirm: (items: ParsedReceiptItem[]) => void;
  onClose: () => void;
}

type EditableItem = ParsedReceiptItem & { id: string; selected: boolean };

const categories: FoodCategory[] = [
  "野菜", "肉類", "魚類", "乳製品", "調味料", "レトルト", "カップ麺", "冷凍食品", "その他",
];
const units: Unit[] = ["個", "本", "袋", "パック", "kg", "g", "L", "ml"];

export default function ReceiptPreviewModal({ items, onConfirm, onClose }: ReceiptPreviewModalProps) {
  const [editableItems, setEditableItems] = useState<EditableItem[]>(
    items.map((item, i) => ({ ...item, id: String(i), selected: true }))
  );

  const update = (id: string, patch: Partial<EditableItem>) => {
    setEditableItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const remove = (id: string) => {
    setEditableItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleAll = () => {
    const allSelected = editableItems.every(i => i.selected);
    setEditableItems(prev => prev.map(i => ({ ...i, selected: !allSelected })));
  };

  const selectedItems = editableItems.filter(i => i.selected);

  const handleConfirm = () => {
    onConfirm(selectedItems.map(({ id: _id, selected: _sel, ...item }) => item));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">レシート読み取り結果</h2>
              <p className="text-green-100 text-sm mt-1">
                {editableItems.length}品を検出 — 追加したい食材を選択してください
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 全選択トグル */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {editableItems.every(i => i.selected)
              ? <CheckSquare size={18} className="text-blue-500" />
              : <Square size={18} />
            }
            すべて選択 / 解除
          </button>
          <span className="ml-auto text-sm text-gray-500">{selectedItems.length}件選択中</span>
        </div>

        {/* 食材リスト */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {editableItems.length === 0 && (
            <p className="text-center text-gray-400 py-8">食材がありません</p>
          )}
          {editableItems.map(item => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 transition-colors ${
                item.selected ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-gray-50/50 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* チェックボックス */}
                <button
                  onClick={() => update(item.id, { selected: !item.selected })}
                  className="mt-1 flex-shrink-0"
                >
                  {item.selected
                    ? <CheckSquare size={20} className="text-blue-500" />
                    : <Square size={20} className="text-gray-400" />
                  }
                </button>

                <div className="flex-1 space-y-2">
                  {/* 食材名 */}
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => update(item.id, { name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="食材名"
                  />

                  <div className="flex gap-2">
                    {/* カテゴリー */}
                    <select
                      value={item.category}
                      onChange={e => update(item.id, { category: e.target.value as FoodCategory })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* 数量 */}
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={e => update(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    {/* 単位 */}
                    <select
                      value={item.unit}
                      onChange={e => update(item.id, { unit: e.target.value as Unit })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {/* 削除 */}
                <button
                  onClick={() => remove(item.id)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors mt-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedItems.length === 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            追加する ({selectedItems.length}件)
          </button>
        </div>
      </div>
    </div>
  );
}
