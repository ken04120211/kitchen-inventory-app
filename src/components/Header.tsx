"use client";

import { Settings, Users } from "lucide-react";

interface HeaderProps {
  onOpenSettings: () => void;
  familyName?: string;
  userName?: string;
}

export default function Header({ onOpenSettings, familyName, userName }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 pt-5 pb-4 rounded-xl mb-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📋 キッチンプランナー</h1>
          <div className="flex items-center gap-3 mt-0.5 text-sm text-blue-100">
            {familyName && (
              <span className="flex items-center gap-1">
                <Users size={13} />
                {familyName}
              </span>
            )}
            {userName && <span className="text-blue-200">{userName}</span>}
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full transition-colors"
          title="設定"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
