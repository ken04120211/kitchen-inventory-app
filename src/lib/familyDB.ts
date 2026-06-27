import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  arrayUnion,
  arrayRemove,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FamilyMember = {
  uid: string;
  displayName: string;
  email: string;
  role: "owner" | "member";
};

export type Family = {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
  members: Record<string, FamilyMember>;
};

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ネイティブFirebase認証トークンを使ったFirestore REST APIフォールバック
// web SDK認証が失敗している場合でもネイティブ認証でFirestoreにアクセス可能
async function getUserFamilyIdNative(uid: string): Promise<string | null | undefined> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return undefined;

    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const { user: nativeUser } = await FirebaseAuthentication.getCurrentUser();
    if (!nativeUser || nativeUser.uid !== uid) return undefined;

    const { token } = await FirebaseAuthentication.getIdToken({ forceRefresh: false });
    if (!token) return undefined;

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) return null;
    if (!response.ok) return undefined;

    const data = await response.json();
    return (data.fields?.familyId?.stringValue as string | undefined) ?? null;
  } catch {
    return undefined;
  }
}

export async function getUserFamilyId(uid: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return snap.data().familyId ?? null;
  } catch {
    // web SDK認証失敗時はネイティブトークンでRESTフォールバック
    const result = await getUserFamilyIdNative(uid);
    if (result !== undefined) return result;
    throw new Error("permission-denied");
  }
}

type UserInfo = { uid: string; displayName: string | null; email: string | null };

export async function createFamily(user: UserInfo, familyName: string): Promise<string> {
  const inviteCode = generateInviteCode();
  const familyRef = doc(collection(db, "families"));

  const member: FamilyMember = {
    uid: user.uid,
    displayName: user.displayName ?? "ユーザー",
    email: user.email ?? "",
    role: "owner",
  };

  await setDoc(familyRef, {
    name: familyName,
    inviteCode,
    memberIds: [user.uid],
    members: { [user.uid]: member },
    createdAt: new Date().toISOString(),
  });

  await setDoc(doc(db, "users", user.uid), {
    displayName: user.displayName,
    email: user.email,
    familyId: familyRef.id,
  });

  return familyRef.id;
}

export async function joinFamily(user: UserInfo, inviteCode: string): Promise<string> {
  const q = query(
    collection(db, "families"),
    where("inviteCode", "==", inviteCode.trim().toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("招待コードが見つかりません");

  const familyDoc = snapshot.docs[0];
  const familyId = familyDoc.id;

  const member: FamilyMember = {
    uid: user.uid,
    displayName: user.displayName ?? "ユーザー",
    email: user.email ?? "",
    role: "member",
  };

  await updateDoc(doc(db, "families", familyId), {
    memberIds: arrayUnion(user.uid),
    [`members.${user.uid}`]: member,
  });

  await setDoc(doc(db, "users", user.uid), {
    displayName: user.displayName,
    email: user.email,
    familyId,
  });

  return familyId;
}

// Firestore REST API レスポンスの値をパースするヘルパー
function parseRestValue(v: Record<string, unknown>): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue as string, 10);
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue" in v) {
    const arr = v.arrayValue as { values?: Record<string, unknown>[] };
    return (arr.values ?? []).map(parseRestValue);
  }
  if ("mapValue" in v) {
    const map = v.mapValue as { fields?: Record<string, Record<string, unknown>> };
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(map.fields ?? {})) {
      out[k] = parseRestValue(val);
    }
    return out;
  }
  return null;
}

async function getFamilyNative(familyId: string, uid: string): Promise<Family | null | undefined> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return undefined;

    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const { user: nativeUser } = await FirebaseAuthentication.getCurrentUser();
    if (!nativeUser || nativeUser.uid !== uid) return undefined;

    const { token } = await FirebaseAuthentication.getIdToken({ forceRefresh: false });
    if (!token) return undefined;

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/families/${familyId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) return null;
    if (!response.ok) return undefined;

    const data = await response.json();
    const fields = data.fields as Record<string, Record<string, unknown>> | undefined;
    if (!fields) return null;

    const parsed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      parsed[k] = parseRestValue(v);
    }
    return { id: familyId, ...parsed } as Family;
  } catch {
    return undefined;
  }
}

export async function getFamily(familyId: string, uid?: string): Promise<Family | null> {
  try {
    const snap = await getDoc(doc(db, "families", familyId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Family;
  } catch {
    if (!uid) return null;
    const result = await getFamilyNative(familyId, uid);
    return result !== undefined ? result : null;
  }
}

export async function updateFamilyName(familyId: string, name: string): Promise<void> {
  await updateDoc(doc(db, "families", familyId), { name });
}

export async function leaveFamily(uid: string, familyId: string): Promise<void> {
  await updateDoc(doc(db, "families", familyId), {
    memberIds: arrayRemove(uid),
    [`members.${uid}`]: deleteField(),
  });
  await updateDoc(doc(db, "users", uid), { familyId: null });
}
