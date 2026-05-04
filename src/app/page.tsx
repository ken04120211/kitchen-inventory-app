"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { FoodItem, InventoryFilters } from "@/types";
import { InventoryStorage } from "@/lib/storage";
import Header from "@/components/Header";
import InventoryGrid from "@/components/InventoryGrid";
import ItemModal from "@/components/ItemModal";
import AlertsSection from "@/components/AlertsSection";
import FilterControls from "@/components/FilterControls";

export default function Home() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    searchQuery: "",
    category: "",
    sortBy: "name",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  const loadItems = () => {
    const loadedItems = InventoryStorage.getItems();
    setItems(loadedItems);
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    let result = items;

    if (filters.searchQuery) {
      result = InventoryStorage.searchItems(filters.searchQuery);
    }

    if (filters.category) {
      result = result.filter(item => item.category === filters.category);
    }

    result = InventoryStorage.sortItems(result, filters.sortBy);
    setFilteredItems(result);
  }, [items, filters]);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (InventoryStorage.deleteItem(id)) {
      loadItems();
    }
  };

  const handleSaveItem = (itemData: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => {
    let success = false;
    
    if (editingItem) {
      success = InventoryStorage.updateItem(editingItem.id, itemData);
    } else {
      success = InventoryStorage.addItem(itemData);
    }

    if (success) {
      loadItems();
      setIsModalOpen(false);
      setEditingItem(null);
    }
    
    return success;
  };

  const handleFiltersChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Header onAddItem={handleAddItem} />
        <AlertsSection items={items} />
        <FilterControls
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        <InventoryGrid
          items={filteredItems}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />
        
        {isModalOpen && (
          <ItemModal
            item={editingItem}
            onSave={handleSaveItem}
            onClose={() => {
              setIsModalOpen(false);
              setEditingItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
}