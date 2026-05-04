import { FoodItem } from "@/types";
import InventoryCard from "./InventoryCard";

interface InventoryGridProps {
  items: FoodItem[];
  onEditItem: (item: FoodItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function InventoryGrid({ items, onEditItem, onDeleteItem }: InventoryGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">在庫がありません</h3>
        <p className="text-gray-500">「食材追加」ボタンから最初の食材を追加しましょう</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <InventoryCard
          key={item.id}
          item={item}
          onEdit={() => onEditItem(item)}
          onDelete={() => onDeleteItem(item.id)}
        />
      ))}
    </div>
  );
}