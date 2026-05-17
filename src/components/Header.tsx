import { Plus, Camera, BookMarked } from "lucide-react";

interface HeaderProps {
  onAddItem: () => void;
  onScanReceipt: () => void;
  onOpenKnownItems: () => void;
}

export default function Header({ onAddItem, onScanReceipt, onOpenKnownItems }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl mb-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-center sm:text-left">
            🍳 キッチン在庫管理
          </h1>
          <p className="text-blue-100 text-center sm:text-left">
            食材・調味料・レトルト・カップ麺の在庫を簡単管理
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={onOpenKnownItems}
            className="flex items-center gap-2 bg-white/20 text-white border border-white/40 px-4 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors"
          >
            <BookMarked size={20} />
            よく買う品目
          </button>
          <button
            onClick={onScanReceipt}
            className="flex items-center gap-2 bg-white/20 text-white border border-white/40 px-4 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors"
          >
            <Camera size={20} />
            レシート読み取り
          </button>
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md"
          >
            <Plus size={20} />
            食材追加
          </button>
        </div>
      </div>
    </header>
  );
}
