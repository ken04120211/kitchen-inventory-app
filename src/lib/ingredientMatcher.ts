import { FoodItem, Recipe } from "@/types";

function bigram(s: string): Set<string> {
  const set = new Set<string>();
  const t = s.replace(/\s/g, "");
  for (let i = 0; i < t.length - 1; i++) set.add(t[i] + t[i + 1]);
  return set;
}

export function similarity(a: string, b: string): number {
  const sa = bigram(a.toLowerCase());
  const sb = bigram(b.toLowerCase());
  if (sa.size === 0 || sb.size === 0)
    return a.toLowerCase() === b.toLowerCase() ? 1 : 0;
  let inter = 0;
  for (const g of sa) if (sb.has(g)) inter++;
  return (2 * inter) / (sa.size + sb.size);
}

export function matchIngredientToInventory(
  name: string,
  items: FoodItem[]
): FoodItem | null {
  let best: FoodItem | null = null;
  let bestScore = 0.35;
  for (const item of items) {
    const score = similarity(name, item.name);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

export function getRecipeMatchRate(
  recipe: Recipe,
  items: FoodItem[]
): { matched: number; total: number } {
  const total = recipe.ingredients.length;
  if (total === 0) return { matched: 0, total: 0 };
  const matched = recipe.ingredients.filter(
    (ing) => matchIngredientToInventory(ing.name, items) !== null
  ).length;
  return { matched, total };
}
