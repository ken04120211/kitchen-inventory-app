"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function getErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-blocked":
      return "ポップアップがブロックされました。ブラウザのポップアップ許可設定を確認してください。";
    case "auth/popup-closed-by-user":
      return "ログインがキャンセルされました。";
    case "auth/unauthorized-domain":
      return "このドメインは Firebase で許可されていません。Firebase コンソールの Authentication → 承認済みドメインを確認してください。";
    case "auth/operation-not-allowed":
      return "Google ログインが有効化されていません。Firebase コンソールで Google プロバイダを有効にしてください。";
    default:
      return `ログインに失敗しました（${code}）`;
  }
}

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "unknown";
      setError(getErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
        <div className="text-6xl mb-4">🍳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">キッチン在庫管理</h1>
        <p className="text-gray-500 mb-8 text-sm">
          家族と一緒に食材を管理しましょう
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-left">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "ログイン中..." : "Google でログイン"}
        </button>
        <p className="text-xs text-gray-400 mt-4">
          ログインすることで家族との在庫共有が可能になります
        </p>
      </div>
    </div>
  );
}
