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
} from "firebase/firestore";
import { User } from "firebase/auth";
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

export async function getUserFamilyId(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data().familyId ?? null;
}

export async function createFamily(user: User, familyName: string): Promise<string> {
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

export async function joinFamily(user: User, inviteCode: string): Promise<string> {
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

export async function getFamily(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(db, "families", familyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Family;
}
