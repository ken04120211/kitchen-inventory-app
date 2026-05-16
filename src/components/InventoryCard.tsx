import { Edit, Trash2, Calendar, MinusCircle } from "lucide-react";
import { FoodItem } from "@/types";
import {
  getCategoryIcon,
  getStockStatusColor,
  getExpiryStatusColor,
  getRelativeDate
} from "@/lib/utils";

interface InventoryCardProps {
  item: FoodItem;
  onEdit: () => void;
  onDelete: () => void;
  onConsume: () => void;
}

export default function InventoryCard({ item, onEdit, onDelete, onConsume }: InventoryCardProps) {
  const handleDelete = () => {
    if (confirm(`「${item.name}」を削除してもよろしいですか？`)) {
      onDelete();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-lg text-gray-900 flex-1 mr-2">
          {item.name}
        </h3>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full whitespace-nowrap">
          <span>{getCategoryIcon(item.category)}</span>
          <span>{item.category}</span>
        </span>
      </div>

      {/* 在庫数 */}
      <div className="mb-3">
        <div className={`text-2xl font-bold ${getStockStatusColor(item.quantity)}`}>
          {item.quantity} {item.unit}
        </div>
      </div>

      {/* 消費期限 */}
      {item.expiry && (
        <div className="mb-3">
          <div className={`flex items-center gap-1 text-sm ${getExpiryStatusColor(item.expiry)}`}>
            <Calendar size={16} />
            <span>{getRelativeDate(item.expiry)}</span>
          </div>
        </div>
      )}

      {/* メモ */}
      {item.note && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 italic border-l-3 border-gray-200 pl-3">
            💭 {item.note}
          </p>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onConsume}
          disabled={item.quantity <= 0}
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <MinusCircle size={16} />
          1つ消費
        </button>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            <Edit size={16} />
            編集
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            <Trash2 size={16} />
            削除
          </button>
        </div>
      </div>
    </div>
  );
}