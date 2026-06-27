import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadRecipeImage(
  familyId: string,
  blob: Blob,
  ext: string
): Promise<string> {
  const path = `families/${familyId}/recipe-images/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: `image/${ext}` });
  return getDownloadURL(storageRef);
}

export async function deleteRecipeImage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // 削除失敗は無視（既に削除済みの場合など）
  }
}
