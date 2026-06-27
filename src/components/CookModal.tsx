"use client";

import { useState, useMemo } from "react";
import { X, ChefHat, CheckCircle, AlertCircle } from "lucide-react";
import { Recipe, FoodItem } from "@/types";
import { matchIngredientToInventory } from "@/lib/ingredientMatcher";

interface IngredientResult {
  name: string;
  requiredQty: number;
  unit: string;
  matched: FoodItem | null;
  newQty: number;
}

interface Props {
  recipe: Recipe;
  items: FoodItem[];
  onCook: (deductions: { itemId: string; newQty: number }[]) => Promise<void>;
  onClose: () => void;
}

export default function CookModal({ recipe, items, onCook, onClose }: Props) {
  const [servings, setServings] = useState(recipe.defaultServings);
  const [cooking, setCooking] = useState(false);
  const [done, setDone] = useState(false);

  const results = useMemo((): IngredientResult[] => {
    const multiplier = servings / recipe.defaultServings;
    return recipe.ingredients.map((ing) => {
      const requiredQty = ing.quantity * multiplier;
      const matched = matchIngredientToInventory(ing.name, items);
      return {
        name: ing.name,
        requiredQty,
        unit: ing.unit,
        matched,
        newQty: matched ? Math.max(0, matched.quantity - requiredQty) : 0,
      };
    });
  }, [recipe, items, servings]);

  const matchedCount = results.filter((r) => r.matched).length;

  const handleCook = async () => {
    setCooking(true);
    try {
      const deductions = results
        .filter((r) => r.matched)
        .map((r) => ({ itemId: r.matched!.id, newQty: r.newQty }));
      await onCook(deductions);
      setDone(true);
    } finally {
      setCooking(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">料理完了！</h3>
          <p className="text-gray-500 text-sm mb-6">
            {matchedCount}種類の食材を在庫から消費しました
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ChefHat size={22} className="text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">{recipe.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* 人数 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">作る人数</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setServings((v) => Math.max(1, v - 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-400 hover:text-orange-500 text-xl font-bold transition-colors"
              >
                −
              </button>
              <span className="text-3xl font-bold text-gray-900 w-10 text-center">
                {servings}
              </span>
              <button
                onClick={() => setServings((v) => Math.min(20, v + 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-400 hover:text-orange-500 text-xl font-bold transition-colors"
              >
                ＋
              </button>
              <span className="text-gray-500 text-sm">人前</span>
              {servings !== recipe.defaultServings && (
                <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                  基本{recipe.defaultServings}人前から調整
                </span>
              )}
            </div>
          </div>

          {/* 食材の在庫照合 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">使用する食材</p>
              <span className="text-xs text-gray-400">
                {matchedCount}/{results.length} 種類が在庫に存在
              </span>
            </div>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    r.matched ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  {r.matched ? (
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{r.name}</span>
                      <span className="text-xs text-gray-500">
                        {r.requiredQty % 1 === 0
                          ? r.requiredQty
                          : r.requiredQty.toFixed(1)}{r.unit}
                      </span>
                    </div>
                    {r.matched ? (
                      <p className="text-xs text-gray-500 mt-0.5">
                        在庫「{r.matched.name}」: {r.matched.quantity}{r.matched.unit}
                        {" → "}
                        <span className={r.newQty === 0 ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>
                          {r.newQty % 1 === 0 ? r.newQty : r.newQty.toFixed(1)}{r.matched.unit}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">在庫に見つかりません（スキップ）</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {matchedCount === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              在庫と一致する食材が見つかりませんでした。材料名が在庫の食材名と異なる可能性があります。
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleCook}
            disabled={cooking || matchedCount === 0}
            className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <ChefHat size={20} />
            {cooking ? "処理中..." : `作った！（${matchedCount}種類の在庫を消費）`}
          </button>
        </div>
      </div>
    </div>
  );
}
