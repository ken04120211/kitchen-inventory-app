"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Recipe, RecipeIngredient, Unit } from "@/types";

const UNIT_OPTIONS: Unit[] = ["個", "本", "袋", "パック", "kg", "g", "L", "ml"];

interface Props {
  recipe?: Recipe;
  onSave: (data: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onClose: () => void;
}

const emptyIngredient = (): RecipeIngredient => ({
  name: "",
  quantity: 1,
  unit: "個",
});

export default function RecipeEditModal({ recipe, onSave, onClose }: Props) {
  const [name, setName] = useState(recipe?.name ?? "");
  const [defaultServings, setDefaultServings] = useState(recipe?.defaultServings ?? 2);
  const [memo, setMemo] = useState(recipe?.memo ?? "");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    recipe?.ingredients.length ? recipe.ingredients : [emptyIngredient()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateIngredient = (i: number, patch: Partial<RecipeIngredient>) => {
    setIngredients((prev) =>
      prev.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing))
    );
  };

  const removeIngredient = (i: number) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("料理名を入力してください"); return; }
    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    if (validIngredients.length === 0) { setError("材料を1つ以上入力してください"); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        defaultServings,
        memo: memo.trim(),
        ingredients: validIngredients,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {recipe ? "レシピを編集" : "レシピを追加"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 料理名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">料理名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 豚汁、チャーハン"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* 基本人数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">基本人数</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDefaultServings((v) => Math.max(1, v - 1))}
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold"
              >
                −
              </button>
              <span className="text-xl font-semibold w-8 text-center">{defaultServings}</span>
              <button
                onClick={() => setDefaultServings((v) => Math.min(20, v + 1))}
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold"
              >
                ＋
              </button>
              <span className="text-sm text-gray-500">人前</span>
            </div>
          </div>

          {/* 材料 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              材料 <span className="text-gray-400 font-normal">（在庫と照合して消費されます）</span>
            </label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, { name: e.target.value })}
                    placeholder="食材名"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, { quantity: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.5}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, { unit: e.target.value as Unit })}
                    className="w-18 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeIngredient(i)}
                    disabled={ingredients.length === 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addIngredient}
              className="mt-2 flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-medium"
            >
              <Plus size={16} />
              材料を追加
            </button>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="調理のポイントなど"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
        </div>

        {/* フッター */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
