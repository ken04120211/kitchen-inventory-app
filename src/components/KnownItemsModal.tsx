"use client";

import { useState } from "react";
import { KnownItem, FoodCategory, Unit } from "@/types";
import { KnownItemsStorage, CATEGORY_OPTIONS, UNIT_OPTIONS } from "@/lib/knownItemsStorage";
import { Plus, Trash2, X, Pencil, Check } from "lucide-react";

interface Props {
  items: KnownItem[];
  onChange: (items: KnownItem[]) => void;
  onClose: () => void;
}

const emptyForm = (): Omit<KnownItem, "id"> => ({
  name: "",
  aliases: [],
  category: "その他",
  unit: "個",
  defaultQuantity: 1,
});

export default function KnownItemsModal({ items, onChange, onClose }: Props) {
  const [form, setForm] = useState<Omit<KnownItem, "id">>(emptyForm());
  const [aliasInput, setAliasInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const reload = () => onChange(KnownItemsStorage.getItems());

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      KnownItemsStorage.updateItem(editingId, form);
    } else {
      KnownItemsStorage.addItem(form);
    }
    reload();
    setForm(emptyForm());
    setAliasInput("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item: KnownItem) => {
    setForm({ name: item.name, aliases: item.aliases, category: item.category, unit: item.unit, defaultQuantity: item.defaultQuantity });
    setAliasInput("");
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    KnownItemsStorage.deleteItem(id);
    reload();
  };

  const addAlias = () => {
    const v = aliasInput.trim();
    if (v && !form.aliases.includes(v)) {
      setForm(f => ({ ...f, aliases: [...f.aliases, v] }));
    }
    setAliasInput("");
  };

  const removeAlias = (alias: string) => {
    setForm(f => ({ ...f, aliases: f.aliases.filter(a => a !== alias) }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">よく買う品目の設定</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {items.length === 0 && !showForm && (
            <p className="text-gray-400 text-sm text-center py-6">品目が登録されていません</p>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.category} · {item.unit}
                  {item.aliases.length > 0 && ` · 別表記: ${item.aliases.join(", ")}`}
                </p>
              </div>
              <button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-600 p-1"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>
          ))}

          {showForm && (
            <div className="border border-blue-200 rounded-lg p-4 space-y-3 bg-blue-50">
              <div>
                <label className="text-xs font-medium text-gray-600">品目名</label>
                <input
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="例: たまねぎ"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600">カテゴリ</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as FoodCategory }))}
                  >
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">単位</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value as Unit }))}
                  >
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">レシート上の別表記（任意）</label>
                <div className="flex gap-2 mt-1">
                  <input
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="例: 玉ねぎ, タマネギ"
                    value={aliasInput}
                    onChange={e => setAliasInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAlias())}
                  />
                  <button onClick={addAlias} className="px-3 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">追加</button>
                </div>
                {form.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.aliases.map(a => (
                      <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-300 rounded-full text-xs">
                        {a}
                        <button onClick={() => removeAlias(a)} className="text-gray-400 hover:text-gray-600"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  <Check size={14} />{editingId ? "更新" : "登録"}
                </button>
                <button onClick={() => { setShowForm(false); setForm(emptyForm()); setEditingId(null); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {!showForm && (
          <div className="p-4 border-t">
            <button
              onClick={() => { setForm(emptyForm()); setEditingId(null); setShowForm(true); }}
              className="flex items-center gap-2 w-full justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <Plus size={16} />品目を追加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
