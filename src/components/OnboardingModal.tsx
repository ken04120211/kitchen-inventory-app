"use client";

import { useState } from "react";

const STORAGE_KEY = "onboarding_done_v1";

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

const SLIDES = [
  {
    emoji: "🍳",
    title: "キッチン在庫管理へようこそ",
    description: "家族みんなで食材をリアルタイム共有。食品ロスを減らして、買い忘れもなくしましょう。",
    bg: "from-blue-500 to-purple-600",
  },
  {
    emoji: "📦",
    title: "食材を管理する",
    description: "「＋」ボタンで食材を追加。数量・賞味期限・カテゴリを記録でき、残り少ない食材はアラートでお知らせします。",
    bg: "from-green-500 to-teal-600",
  },
  {
    emoji: "📷",
    title: "レシートをスキャン",
    description: "カメラアイコンからレシートを撮影するだけで、購入した食材を自動で一括登録できます。",
    bg: "from-orange-500 to-red-500",
  },
  {
    emoji: "🛒",
    title: "買い物リストを自動生成",
    description: "カートアイコンから在庫が少ない食材の買い物リストを作成。よく買う品目を登録しておくとさらに便利です。",
    bg: "from-purple-500 to-pink-600",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "家族と共有する",
    description: "設定から招待コードを発行して家族を招待。在庫の変更はリアルタイムで全員に反映されます。",
    bg: "from-blue-600 to-cyan-500",
  },
];

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [current, setCurrent] = useState(0);
  const isLast = current === SLIDES.length - 1;

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    onClose();
  };

  const next = () => {
    if (isLast) {
      handleClose();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const slide = SLIDES[current];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* カラーヘッダー */}
        <div className={`bg-gradient-to-br ${slide.bg} flex flex-col items-center justify-center py-12 px-6 text-white`}>
          <div className="text-7xl mb-4">{slide.emoji}</div>
          <h2 className="text-xl font-bold text-center leading-tight">{slide.title}</h2>
        </div>

        {/* 説明 */}
        <div className="px-6 pt-6 pb-4">
          <p className="text-gray-600 text-sm text-center leading-relaxed">{slide.description}</p>
        </div>

        {/* ドットインジケーター */}
        <div className="flex justify-center gap-2 pb-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-blue-500" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* ボタン */}
        <div className="flex gap-3 px-6 pb-8">
          {!isLast && (
            <button
              onClick={handleClose}
              className="flex-1 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              スキップ
            </button>
          )}
          <button
            onClick={next}
            className={`py-3 rounded-xl font-medium text-white transition-colors ${
              isLast ? "flex-1 bg-blue-600 hover:bg-blue-700" : "flex-1 bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLast ? "さっそく始める 🎉" : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
