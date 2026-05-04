import { AlertTriangle, Calendar, Package } from "lucide-react";
import { FoodItem } from "@/types";
import { InventoryStorage } from "@/lib/storage";
import { getRelativeDate } from "@/lib/utils";

interface AlertsSectionProps {
  items: FoodItem[];
}

export default function AlertsSection({ items }: AlertsSectionProps) {
  const lowStockItems = InventoryStorage.getLowStockItems();
  const expiringItems = InventoryStorage.getExpiringItems();
  const expiredItems = InventoryStorage.getExpiredItems();

  if (lowStockItems.length === 0 && expiringItems.length === 0 && expiredItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {expiredItems.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <AlertTriangle className="text-red-600 mt-0.5" size={20} />
          <div>
            <strong className="font-semibold">期限切れの食材があります:</strong>
            <div className="mt-1">
              {expiredItems.map((item, index) => (
                <span key={item.id}>
                  {item.name}
                  {index < expiredItems.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {expiringItems.length > 0 && (
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg">
          <Calendar className="text-orange-600 mt-0.5" size={20} />
          <div>
            <strong className="font-semibold">期限が近い食材があります:</strong>
            <div className="mt-1">
              {expiringItems.map((item, index) => (
                <span key={item.id}>
                  {item.name} ({getRelativeDate(item.expiry!)})
                  {index < expiringItems.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <Package className="text-yellow-600 mt-0.5" size={20} />
          <div>
            <strong className="font-semibold">在庫が少ない食材があります:</strong>
            <div className="mt-1">
              {lowStockItems.map((item, index) => (
                <span key={item.id}>
                  {item.name} ({item.quantity}{item.unit})
                  {index < lowStockItems.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}