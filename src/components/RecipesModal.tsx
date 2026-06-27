"use client";

import { useState } from "react";
import { X, ChefHat, Plus, Edit2, Trash2, Users } from "lucide-react";
import { Recipe, FoodItem } from "@/types";
import RecipeEditModal from "./RecipeEditModal";
import CookModal from "./CookModal";

interface Props {
  recipes: Recipe[];
  items: FoodItem[];
  familyId: string;
  onAdd: (data: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, data: Partial<Recipe>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCook: (deductions: { itemId: string; newQty: number }[]) => Promise<void>;
  onClose: () => void;
}

export default function RecipesModal({
  recipes,
  items,
  familyId,
  onAdd,
  onUpdate,
  onDelete,
  onCook,
  onClose,
}: Props) {
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null | "new">(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ChefHat size={22} className="text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">レシピ管理</h2>
              <span className="text-sm text-gray-400">({recipes.length}件)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingRecipe("new")}
                className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <Plus size={16} />
                追加
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
          </div>

          {/* レシピ一覧 */}
          <div className="overflow-y-auto flex-1 p-4">
            {recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ChefHat size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">まだレシピがありません</p>
                <p className="text-gray-400 text-sm mt-1">
                  「追加」ボタンからレシピを登録してください
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users size={11} />
                            {recipe.defaultServings}人前
                          </span>
                          <span>{recipe.ingredients.length}種類の食材</span>
                        </div>
                        {/* 材料サマリ */}
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                          {recipe.ingredients.map((ing) => ing.name).join("・")}
                        </p>
                        {recipe.memo && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">
                            {recipe.memo}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setCookingRecipe(recipe)}
                          className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors whitespace-nowrap"
                        >
                          <ChefHat size={13} />
                          料理する
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingRecipe(recipe)}
                            className="flex-1 flex items-center justify-center gap-1 border border-gray-300 text-gray-600 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-100 transition-colors"
                          >
                            <Edit2 size={12} />
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(recipe.id)}
                            disabled={deletingId === recipe.id}
                            className="flex-1 flex items-center justify-center gap-1 border border-red-200 text-red-500 px-2 py-1.5 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 size={12} />
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* レシピ追加/編集モーダル */}
      {editingRecipe !== null && (
        <RecipeEditModal
          familyId={familyId}
          recipe={editingRecipe === "new" ? undefined : editingRecipe}
          onSave={
            editingRecipe === "new"
              ? onAdd
              : (data) => onUpdate(editingRecipe.id, data)
          }
          onClose={() => setEditingRecipe(null)}
        />
      )}

      {/* 料理実行モーダル */}
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
