import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe } from "@/types";

export function subscribeToRecipes(
  familyId: string,
  callback: (recipes: Recipe[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "families", familyId, "recipes"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const recipes = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Recipe)
    );
    callback(recipes);
  });
}

export async function addRecipe(
  familyId: string,
  data: Omit<Recipe, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "families", familyId, "recipes"), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateRecipe(
  familyId: string,
  recipeId: string,
  data: Partial<Omit<Recipe, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "families", familyId, "recipes", recipeId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteRecipe(
  familyId: string,
  recipeId: string
): Promise<void> {
  await deleteDoc(doc(db, "families", familyId, "recipes", recipeId));
}
