import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { FoodItem, FoodCategory, Unit } from "@/types";

interface ItemModalProps {
  item?: FoodItem | null;
  onSave: (item: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onClose: () => void;
}

const categories: FoodCategory[] = [
  "野菜",
  "肉類", 
  "魚類",
  "乳製品",
  "調味料",
  "レトルト",
  "カップ麺",
  "冷凍食品",
  "その他"
];

const units: Unit[] = [
  "個",
  "本",
  "袋",
  "パック",
  "kg",
  "g",
  "L",
  "ml"
];

export default function ItemModal({ item, onSave, onClose }: ItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "" as FoodCategory | "",
    quantity: 0,
    unit: "個" as Unit,
    expiry: "",
    note: ""
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        expiry: item.expiry || "",
        note: item.note || ""
      });
    }
  }, [item]);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push("食材名は必須です");
    }
    if (!formData.category) {
      newErrors.push("カテゴリーは必須です");
    }
    if (formData.quantity < 0) {
      newErrors.push("数量は0以上で入力してください");
    }
    if (formData.expiry && isNaN(new Date(formData.expiry).getTime())) {
      newErrors.push("有効な消費期限を入力してください");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await onSave({
        name: formData.name.trim(),
        category: formData.category as FoodCategory,
        quantity: formData.quantity,
        unit: formData.unit,
        expiry: formData.expiry || undefined,
        note: formData.note.trim() || undefined,
      });
    } catch {
      setErrors(["保存に失敗しました"]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {item ? "食材編集" : "食材追加"}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* エラー表示 */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              {errors.map((error, index) => (
                <div key={index} className="text-red-600 text-sm">
                  {error}
                </div>
              ))}
            </div>
          )}

          {/* 食材名 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              食材名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例: 玉ねぎ"
              required
            />
          </div>

          {/* カテゴリー */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリー <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as FoodCategory }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">選択してください</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 数量と単位 */}
          <div className="mb-4 flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                単位
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as Unit }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 消費期限 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              消費期限
            </label>
            <input
              type="date"
              value={formData.expiry}
              onChange={(e) => setFormData(prev => ({ ...prev, expiry: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* メモ */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="例: 冷蔵庫の野菜室に保存"
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}