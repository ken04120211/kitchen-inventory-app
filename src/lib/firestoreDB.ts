import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FoodItem } from "@/types";

export function subscribeToItems(
  familyId: string,
  callback: (items: FoodItem[]) => void
): Unsubscribe {
  const q = query(collection(db, "families", familyId, "items"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as FoodItem)
    );
    callback(items);
  });
}

export async function addItem(
  familyId: string,
  item: Omit<FoodItem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "families", familyId, "items"), {
    ...item,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateItem(
  familyId: string,
  itemId: string,
  patch: Partial<Omit<FoodItem, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "families", familyId, "items", itemId), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteItem(
  familyId: string,
  itemId: string
): Promise<void> {
  await deleteDoc(doc(db, "families", familyId, "items", itemId));
}
