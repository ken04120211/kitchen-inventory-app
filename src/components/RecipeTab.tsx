"use client";

import { useState } from "react";
import { Plus, ChefHat, Users, Edit2, Trash2, Sparkles } from "lucide-react";
import { Recipe, FoodItem } from "@/types";
import { getRecipeMatchRate } from "@/lib/ingredientMatcher";
import RecipeEditModal from "./RecipeEditModal";
import CookModal from "./CookModal";

const GRADIENTS = [
  "from-orange-400 to-red-500",
  "from-emerald-400 to-teal-500",
  "from-blue-400 to-indigo-500",
  "from-purple-400 to-pink-500",
  "from-yellow-400 to-orange-500",
  "from-cyan-400 to-blue-500",
];
function cardGradient(name: string) {
  return GRADIENTS[(name.charCodeAt(0) ?? 0) % GRADIENTS.length];
}

interface Props {
  familyId: string;
  recipes: Recipe[];
  items: FoodItem[];
  onAdd: (data: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, data: Partial<Recipe>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCook: (deductions: { itemId: string; newQty: number }[]) => Promise<void>;
}

export default function RecipeTab({ familyId, recipes, items, onAdd, onUpdate, onDelete, onCook }: Props) {
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null | "new">(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 在庫マッチング計算
  const recipesWithMatch = recipes.map((r) => ({
    recipe: r,
    ...getRecipeMatchRate(r, items),
  }));

  // 「今日作れる」= 50%以上の食材が在庫にある
  const cookableRecipes = recipesWithMatch
    .filter((r) => r.total > 0 && r.matched / r.total >= 0.5)
    .sort((a, b) => b.matched / b.total - a.matched / a.total);

  const handleDelete = async (id: string) => {
    if (!confirm("このレシピを削除しますか？")) return;
    setDeletingId(id);
    try { await onDelete(id); } finally { setDeletingId(null); }
  };

  const matchColor = (matched: number, total: number) => {
    const r = matched / total;
    if (r >= 1) return "text-green-600 bg-green-50";
    if (r >= 0.5) return "text-yellow-600 bg-yellow-50";
    return "text-gray-500 bg-gray-100";
  };

  return (
    <>
      <div className="space-y-6">
        {/* ── 今日作れる料理 ───────────────────── */}
        {cookableRecipes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-orange-500" />
              <h2 className="text-base font-bold text-gray-800">今日作れる料理</h2>
              <span className="text-xs text-gray-400">在庫の食材で作れます</span>
            </div>
            {/* モバイル: 横スクロール / デスクトップ: グリッド */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0 md:gap-4">
              {cookableRecipes.map(({ recipe, matched, total }) => (
                <button
                  key={recipe.id}
                  onClick={() => setCookingRecipe(recipe)}
                  className="flex-shrink-0 w-36 md:w-auto rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow text-left"
                >
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="w-full h-24 object-cover"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        el.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-24 bg-gradient-to-br ${cardGradient(recipe.name)} flex items-center justify-center ${recipe.imageUrl ? "hidden" : ""}`}
                  >
                    <span className="text-4xl font-bold text-white/80">
                      {recipe.name[0]}
                    </span>
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-sm font-semibold text-gray-900 truncate">{recipe.name}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${matchColor(matched, total)}`}>
                      {matched}/{total}種 在庫あり
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── すべてのレシピ ───────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">
              レシピ一覧
              {recipes.length > 0 && (
                <span className="text-sm font-normal text-gray-400 ml-2">{recipes.length}件</span>
              )}
            </h2>
            <button
              onClick={() => setEditingRecipe("new")}
              className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus size={16} />
              追加
            </button>
          </div>

          {recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-2xl">
              <ChefHat size={52} className="text-gray-300 mb-4" />
              <p className="text-gray-600 font-semibold mb-1">まだレシピがありません</p>
              <p className="text-gray-400 text-sm mb-5">よく作る料理を登録しておきましょう</p>
              <button
                onClick={() => setEditingRecipe("new")}
                className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                <Plus size={18} />
                最初のレシピを追加
              </button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
              {recipesWithMatch.map(({ recipe, matched, total }) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex">
                    {/* サムネイル */}
                    <div className="w-24 flex-shrink-0 relative">
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          className="w-24 h-full min-h-[88px] object-cover"
                          onError={(e) => {
                            const el = e.currentTarget;
                            el.style.display = "none";
                            el.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-24 min-h-[88px] bg-gradient-to-br ${cardGradient(recipe.name)} flex items-center justify-center ${recipe.imageUrl ? "hidden" : ""}`}
                      >
                        <span className="text-3xl font-bold text-white/80">{recipe.name[0]}</span>
                      </div>
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{recipe.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span className="flex items-center gap-0.5">
                              <Users size={11} />{recipe.defaultServings}人前
                            </span>
                            {total > 0 && (
                              <span className={`px-1.5 py-0.5 rounded-full font-medium ${matchColor(matched, total)}`}>
                                食材 {matched}/{total}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {recipe.ingredients.map((i) => i.name).join(" · ")}
                          </p>
                        </div>
                      </div>

                      {/* アクション */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => setCookingRecipe(recipe)}
                          className="flex items-center gap-1 bg-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                        >
                          <ChefHat size={12} />料理する
                        </button>
                        <button
                          onClick={() => setEditingRecipe(recipe)}
                          className="flex items-center gap-1 border border-gray-200 text-gray-600 px-2 py-1 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                        >
                          <Edit2 size={11} />編集
                        </button>
                        <button
                          onClick={() => handleDelete(recipe.id)}
                          disabled={deletingId === recipe.id}
                          className="flex items-center gap-1 border border-red-100 text-red-400 px-2 py-1 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 size={11} />削除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {editingRecipe !== null && (
        <RecipeEditModal
          familyId={familyId}
          recipe={editingRecipe === "new" ? undefined : editingRecipe}
          onSave={editingRecipe === "new" ? onAdd : (data) => onUpdate(editingRecipe.id, data)}
          onClose={() => setEditingRecipe(null)}
        />
      )}
      {cookingRecipe && (
        <CookModal
          recipe={cookingRecipe}
          items={items}
          onCook={onCook}
          onClose={() => setCookingRecipe(null)}
        />
      )}
    </>
  );
}
