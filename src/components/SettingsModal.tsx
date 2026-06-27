"use client";

import { useState } from "react";
import { X, Copy, Check, LogOut, Users, User, Edit2, Crown, AlertTriangle } from "lucide-react";
import { Family, updateFamilyName, leaveFamily } from "@/lib/familyDB";

interface SimpleUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

interface SettingsModalProps {
  user: SimpleUser;
  family: Family;
  onClose: () => void;
  onFamilyNameUpdate: (name: string) => void;
  onLeaveFamily: () => void;
  onLogout: () => void;
}

export default function SettingsModal({
  user,
  family,
  onClose,
  onFamilyNameUpdate,
  onLeaveFamily,
  onLogout,
}: SettingsModalProps) {
  const [tab, setTab] = useState<"account" | "group">("account");

  // グループ名編集
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(family.name);
  const [nameLoading, setNameLoading] = useState(false);

  // 招待コードコピー
  const [copied, setCopied] = useState(false);

  // 退出確認
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const isOwner = family.members[user.uid]?.role === "owner";
  const members = Object.values(family.members).sort((a, b) =>
    a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0
  );

  const handleSaveName = async () => {
    if (!newName.trim() || newName === family.name) {
      setEditingName(false);
      return;
    }
    setNameLoading(true);
    try {
      await updateFamilyName(family.id, newName.trim());
      onFamilyNameUpdate(newName.trim());
      setEditingName(false);
    } finally {
      setNameLoading(false);
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(family.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    setLeaveLoading(true);
    try {
      await leaveFamily(user.uid, family.id);
      onLeaveFamily();
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-semibold">設定</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab("account")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === "account" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <User size={16} /> アカウント
          </button>
          <button
            onClick={() => setTab("group")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === "group" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users size={16} /> グループ
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* アカウントタブ */}
          {tab === "account" && (
            <>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="w-14 h-14 rounded-full"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <User size={28} className="text-blue-500" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{user.displayName ?? "ユーザー"}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Google アカウント</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
              >
                <LogOut size={16} />
                ログアウト
              </button>
            </>
          )}

          {/* グループタブ */}
          {tab === "group" && (
            <>
              {/* グループ名 */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">グループ名</p>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      autoFocus
                      className="flex-1 px-3 py-1.5 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={nameLoading}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {nameLoading ? "保存中" : "保存"}
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setNewName(family.name); }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{family.name}</span>
                    {isOwner && (
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="グループ名を変更"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 招待コード */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">招待コード</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold tracking-widest text-gray-800">
                    {family.inviteCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? "コピー済み" : "コピー"}
                  </button>
                </div>
                <p className="text-xs text-gray-400">このコードを家族に共有してグループに招待できます</p>
              </div>

              {/* メンバー一覧 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  メンバー（{members.length}人）
                </p>
                {members.map((m) => (
                  <div key={m.uid} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    </div>
                    {m.role === "owner" && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        <Crown size={11} />
                        オーナー
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* グループ退出 */}
              <div className="border-t border-gray-200 pt-4">
                {confirmLeave ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                    <div className="flex items-start gap-2 text-red-700 text-sm">
                      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>グループを退出すると、在庫データへのアクセスができなくなります。本当に退出しますか？</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleLeave}
                        disabled={leaveLoading}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {leaveLoading ? "処理中..." : "退出する"}
                      </button>
                      <button
                        onClick={() => setConfirmLeave(false)}
                        className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmLeave(true)}
                    className="w-full py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    グループを退出
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
