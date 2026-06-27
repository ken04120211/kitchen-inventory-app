"use client";

import { useState } from "react";
import { Users, Plus, LogIn, Copy, Check } from "lucide-react";
import { createFamily, joinFamily } from "@/lib/familyDB";

interface FamilySetupModalProps {
  user: { uid: string; displayName: string | null; email: string | null };
  onSetupComplete: (familyId: string) => void;
}

export default function FamilySetupModal({ user, onSetupComplete }: FamilySetupModalProps) {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const familyId = await createFamily(user, familyName.trim());
      onSetupComplete(familyId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`作成に失敗しました: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const familyId = await joinFamily(user, inviteCode.trim());
      onSetupComplete(familyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "参加に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 text-center">
          <Users size={32} className="mx-auto mb-2" />
          <h2 className="text-xl font-bold">家族グループ設定</h2>
          <p className="text-blue-100 text-sm mt-1">
            {user.displayName ?? user.email} でログイン中
          </p>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab("create")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "create"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            新規作成
          </button>
          <button
            onClick={() => setTab("join")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "join"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            招待コードで参加
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {tab === "create" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  グループ名
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="例: 田中家"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!familyName.trim() || loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Plus size={18} />
                {loading ? "作成中..." : "グループを作成"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  招待コード（6桁）
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="例: AB12CD"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest text-center font-mono text-lg uppercase"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={inviteCode.trim().length < 6 || loading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <LogIn size={18} />
                {loading ? "参加中..." : "グループに参加"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
