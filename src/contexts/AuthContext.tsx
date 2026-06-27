"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export type QuickAuth = {
  uid: string;
  displayName: string | null;
  email: string | null;
};

type AuthContextType = {
  user: User | null;
  quickAuth: QuickAuth | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const QUICK_AUTH_KEY = "quick_auth_v1";

function loadQuickAuth(): QuickAuth | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(QUICK_AUTH_KEY) ?? "null");
  } catch {
    return null;
  }
}

function saveQuickAuth(data: QuickAuth) {
  localStorage.setItem(QUICK_AUTH_KEY, JSON.stringify(data));
}

function clearQuickAuth() {
  localStorage.removeItem(QUICK_AUTH_KEY);
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [quickAuth, setQuickAuth] = useState<QuickAuth | null>(loadQuickAuth);
  const [loading, setLoading] = useState<boolean>(() => !loadQuickAuth());

  useEffect(() => {
    // Firebase JS SDK の認証状態を監視（主にブラウザ・Firestoreアクセス用）
    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setLoading(false);
        if (u) {
          const data = { uid: u.uid, displayName: u.displayName, email: u.email };
          saveQuickAuth(data);
          setQuickAuth(data);
        } else {
          clearQuickAuth();
          setQuickAuth(null);
        }
      },
      () => { setLoading(false); }
    );

    // ネイティブ認証状態をプラグインから監視（iOS用）
    let removeNativeListener: (() => void) | null = null;
    const setupNativeListener = async () => {
      const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
      const handle = await FirebaseAuthentication.addListener("authStateChange", (result) => {
        if (result.user) {
          const u = result.user;
          const data: QuickAuth = {
            uid: u.uid,
            displayName: u.displayName ?? null,
            email: u.email ?? null,
          };
          setQuickAuth(data);
          saveQuickAuth(data);
          setLoading(false);
        } else {
          clearQuickAuth();
          setQuickAuth(null);
          setLoading(false);
        }
      });
      removeNativeListener = () => handle.remove();
    };
    setupNativeListener();

    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
      removeNativeListener?.();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const result = await FirebaseAuthentication.signInWithGoogle();

    // ネイティブ認証成功後、Firebase JS SDK（Firestore用）へも認証を試みる
    const idToken = result.credential?.idToken ?? null;
    const accessToken = result.credential?.accessToken ?? null;
    if (!idToken && !accessToken) return;

    const credential = GoogleAuthProvider.credential(idToken, accessToken ?? undefined);
    for (let i = 0; i < 3; i++) {
      try {
        await signInWithCredential(auth, credential);
        return;
      } catch {
        if (i < 2) await new Promise(r => setTimeout(r, (i + 1) * 2000));
      }
    }
  };

  const logout = async () => {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    await FirebaseAuthentication.signOut().catch(() => {});
    await signOut(auth);
    clearQuickAuth();
    setQuickAuth(null);
  };

  return (
    <AuthContext.Provider value={{ user, quickAuth, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
