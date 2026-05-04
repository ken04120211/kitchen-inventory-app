import { Search } from "lucide-react";
import { InventoryFilters, FoodCategory } from "@/types";

interface FilterControlsProps {
  filters: InventoryFilters;
  onFiltersChange: (filters: Partial<InventoryFilters>) => void;
}

const categories: (FoodCategory | "")[] = [
  "",
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

const sortOptions = [
  { value: "name", label: "名前順" },
  { value: "category", label: "カテゴリー順" },
  { value: "quantity", label: "在庫数順" },
  { value: "expiry", label: "消費期限順" }
] as const;

export default function FilterControls({ filters, onFiltersChange }: FilterControlsProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 検索 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="食材を検索..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* カテゴリーフィルター */}
        <div className="min-w-[200px]">
          <select
            value={filters.category}
            onChange={(e) => onFiltersChange({ category: e.target.value as FoodCategory | "" })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">すべてのカテゴリー</option>
            {categories.slice(1).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* ソート */}
        <div className="min-w-[200px]">
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as InventoryFilters["sortBy"] })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}