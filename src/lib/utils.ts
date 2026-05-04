import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FoodCategory, StockStatus, ExpiryStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}/${month}/${day}`;
}

export function getRelativeDate(dateString: string): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const today = new Date();
  
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)}日前に期限切れ`;
  } else if (diffDays === 0) {
    return "今日が期限";
  } else if (diffDays === 1) {
    return "明日が期限";
  } else if (diffDays <= 7) {
    return `あと${diffDays}日`;
  } else {
    return formatDate(dateString);
  }
}

export function getExpiryStatus(dateString: string, warningDays: number = 7): ExpiryStatus {
  if (!dateString) return "normal";
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return "expired";
  } else if (diffDays <= 3) {
    return "danger";
  } else if (diffDays <= warningDays) {
    return "warning";
  } else {
    return "normal";
  }
}

export function getStockStatus(quantity: number, lowStockThreshold: number = 3): StockStatus {
  if (quantity <= 0) {
    return "out";
  } else if (quantity <= lowStockThreshold) {
    return "low";
  } else {
    return "normal";
  }
}

export function getCategoryIcon(category: FoodCategory): string {
  const icons = {
    "野菜": "🥬",
    "肉類": "🥩",
    "魚類": "🐟",
    "乳製品": "🥛",
    "調味料": "🧂",
    "レトルト": "🥫",
    "カップ麺": "🍜",
    "冷凍食品": "❄️",
    "その他": "📦"
  };
  return icons[category] || "📦";
}

export function getStockStatusColor(quantity: number, lowStockThreshold: number = 3): string {
  const status = getStockStatus(quantity, lowStockThreshold);
  switch (status) {
    case "out":
      return "text-red-600";
    case "low":
      return "text-yellow-600";
    default:
      return "text-green-600";
  }
}

export function getExpiryStatusColor(dateString: string): string {
  const status = getExpiryStatus(dateString);
  switch (status) {
    case "expired":
    case "danger":
      return "text-red-600";
    case "warning":
      return "text-orange-600";
    default:
      return "text-gray-600";
  }
}

export function generateCSV(items: any[]): string {
  const headers = ["食材名", "カテゴリー", "数量", "単位", "消費期限", "メモ", "作成日"];
  const csvContent = [
    headers.join(","),
    ...items.map(item => [
      `"${item.name || ""}"`,
      `"${item.category || ""}"`,
      item.quantity || 0,
      `"${item.unit || ""}"`,
      item.expiry || "",
      `"${(item.note || "").replace(/"/g, '""')}"`,
      item.createdAt ? formatDate(item.createdAt) : ""
    ].join(","))
  ].join("\n");
  
  return csvContent;
}

export function downloadFile(content: string, filename: string, mimeType: string = "text/plain"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}