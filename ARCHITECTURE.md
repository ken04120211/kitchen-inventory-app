# キッチン在庫管理アプリ — 仕様・設計・アーキテクチャ

> 最終更新: 2026-05-06

---

## 1. アプリ概要

キッチンにある食材・調味料・レトルト・カップ麺などの在庫をスマートフォンやタブレットで管理するアプリ。

| 項目 | 内容 |
|------|------|
| 動作環境 | Webブラウザ / Android（Fire タブレット含む）/ iOS |
| データ保存 | ブラウザ / デバイスの LocalStorage（ローカル保存） |
| サーバー | 不要（完全フロントエンド） |
| 公開URL | GitHub Pages（https://ken04120211.github.io/kitchen-inventory-app/） |

---

## 2. 技術スタック

```
フレームワーク : Next.js 16.2.4（App Router、静的エクスポート）
言語          : TypeScript 5
スタイル      : Tailwind CSS v4
アイコン      : lucide-react
ネイティブ化  : Capacitor 8.x（Android / iOS）
CI/CD         : GitHub Actions → GitHub Pages
```

---

## 3. ディレクトリ構成

```
claude_test001/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # HTMLルート（lang="ja"、タイトル等）
│   │   └── page.tsx            # メインページ（状態管理の中心）
│   ├── components/
│   │   ├── Header.tsx          # ヘッダー＋食材追加ボタン
│   │   ├── AlertsSection.tsx   # 期限切れ・在庫切れ警告バナー
│   │   ├── FilterControls.tsx  # 検索・カテゴリー・ソート操作
│   │   ├── InventoryGrid.tsx   # 在庫一覧グリッド
│   │   ├── InventoryCard.tsx   # 個別食材カード
│   │   └── ItemModal.tsx       # 食材追加・編集モーダル
│   ├── lib/
│   │   ├── storage.ts          # LocalStorage 操作クラス
│   │   └── utils.ts            # 日付・色・アイコン等のユーティリティ
│   └── types/
│       └── index.ts            # TypeScript 型定義
├── android/                    # Capacitor Android プロジェクト
├── ios/                        # Capacitor iOS プロジェクト
├── next.config.ts              # Next.js 設定（basePath 切り替え）
├── capacitor.config.ts         # Capacitor 設定
└── .github/workflows/
    └── deploy.yml              # GitHub Actions（自動デプロイ）
```

---

## 4. データ設計

### 4-1. 食材データ（FoodItem）

```typescript
interface FoodItem {
  id: string;         // 一意ID（タイムスタンプ+乱数）
  name: string;       // 食材名（必須）
  category: FoodCategory;  // カテゴリー（必須）
  quantity: number;   // 数量（必須、0以上）
  unit: Unit;         // 単位
  expiry?: string;    // 消費期限（ISO日付文字列、任意）
  note?: string;      // メモ（任意）
  createdAt: string;  // 作成日時（ISO文字列）
  updatedAt: string;  // 更新日時（ISO文字列）
}
```

### 4-2. カテゴリー（FoodCategory）

`野菜` / `肉類` / `魚類` / `乳製品` / `調味料` / `レトルト` / `カップ麺` / `冷凍食品` / `その他`

### 4-3. 単位（Unit）

`個` / `本` / `袋` / `パック` / `kg` / `g` / `L` / `ml`

### 4-4. フィルター状態（InventoryFilters）

```typescript
interface InventoryFilters {
  searchQuery: string;               // テキスト検索
  category: FoodCategory | "";       // カテゴリー絞り込み
  sortBy: "name" | "category" | "quantity" | "expiry";  // ソート順
}
```

---

## 5. データ保存（LocalStorage）

データはサーバーに送信されず、**端末のブラウザ内（LocalStorage）にのみ保存**される。

```
保存キー: "kitchen_inventory"
保存形式: JSON 文字列（FoodItem[] の配列）
```

### InventoryStorage クラスのメソッド一覧

| メソッド | 役割 |
|----------|------|
| `getItems()` | 全件取得 |
| `setItems(items)` | 全件上書き保存 |
| `addItem(item)` | 追加（ID・タイムスタンプを自動付与） |
| `updateItem(id, data)` | 更新（updatedAt を自動更新） |
| `deleteItem(id)` | 削除 |
| `getItemById(id)` | ID で1件取得 |
| `getItemsByCategory(cat)` | カテゴリー絞り込み |
| `getLowStockItems(threshold=3)` | 在庫少（3以下）の取得 |
| `getExpiringItems(days=7)` | 7日以内に期限が来る食材の取得 |
| `getExpiredItems()` | 期限切れの取得 |
| `searchItems(query)` | 名前・カテゴリー・メモのテキスト検索 |
| `sortItems(items, sortBy)` | ソート |
| `exportData()` | JSON エクスポート用文字列生成 |
| `importData(json)` | JSON インポート（失敗時は自動ロールバック） |
| `clearAll()` | 全データ削除 |

> **注意**: データはデバイスごとに独立して保存される。異なるブラウザや端末間での同期機能は現時点では存在しない。

---

## 6. 状態管理

状態管理はサードパーティライブラリ（Redux等）を使わず、**React の `useState` / `useEffect` のみ**で実装している。

### page.tsx の状態一覧

```typescript
// 在庫データ
const [items, setItems] = useState<FoodItem[]>([]);

// フィルター後の表示データ
const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);

// 検索・絞り込み・ソートの条件
const [filters, setFilters] = useState<InventoryFilters>({
  searchQuery: "",
  category: "",
  sortBy: "name",
});

// モーダル表示フラグ
const [isModalOpen, setIsModalOpen] = useState(false);

// 編集中の食材（null = 新規追加モード）
const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
```

### データフロー

```
LocalStorage
    ↓ 読み込み（初回マウント時）
items（state）
    ↓ フィルター・ソート適用（filtersが変わるたびに自動再計算）
filteredItems（state）
    ↓ 描画
InventoryGrid → InventoryCard × N

ユーザー操作（追加・編集・削除）
    ↓
InventoryStorage（LocalStorage 書き込み）
    ↓
loadItems() → items 更新 → filteredItems 自動更新 → 再描画
```

### useEffect の役割

```typescript
// [1] 初回マウント時にLocalStorageから読み込む
useEffect(() => { loadItems(); }, []);

// [2] items または filters が変化するたびにフィルター・ソートを再計算
useEffect(() => {
  let result = items;
  if (filters.searchQuery) result = InventoryStorage.searchItems(...);
  if (filters.category)   result = result.filter(...);
  result = InventoryStorage.sortItems(result, filters.sortBy);
  setFilteredItems(result);
}, [items, filters]);
```

---

## 7. コンポーネント設計

### コンポーネント階層図

```
page.tsx（状態・イベントハンドラーを一元管理）
├── Header.tsx            onAddItem を受け取る
├── AlertsSection.tsx     items を受け取り警告表示
├── FilterControls.tsx    filters・onFiltersChange を受け取る
├── InventoryGrid.tsx     filteredItems・編集・削除コールバックを受け取る
│   └── InventoryCard.tsx × N  item・onEdit・onDelete を受け取る
└── ItemModal.tsx（条件表示）  item・onSave・onClose を受け取る
```

**設計方針**: ビジネスロジック（データ操作・状態）は `page.tsx` に集約し、各コンポーネントは表示に専念する（プレゼンテーション/コンテナ分離パターン）。

---

## 8. アラート判定ロジック（utils.ts）

### 消費期限ステータス（ExpiryStatus）

| ステータス | 条件 | 表示色 |
|-----------|------|--------|
| `expired` | 今日より前 | 赤 |
| `danger` | 3日以内 | 赤 |
| `warning` | 7日以内 | オレンジ |
| `normal` | 8日以上先、または未設定 | グレー |

### 在庫ステータス（StockStatus）

| ステータス | 条件 | 表示色 |
|-----------|------|--------|
| `out` | 数量 = 0 | 赤 |
| `low` | 数量 ≤ 3 | 黄 |
| `normal` | 数量 > 3 | 緑 |

---

## 9. マルチプラットフォーム対応

### 構成図

```
┌──────────────────────────────────────────────────┐
│                Next.js アプリ（共通）              │
│    TypeScript + Tailwind CSS + React Hooks        │
└──────────┬───────────────────┬───────────────────┘
           │                   │
    静的エクスポート        静的エクスポート
    (basePath あり)        (basePath なし)
           │                   │
    ┌──────┴──────┐     ┌──────┴──────────┐
    │ GitHub Pages│     │  Capacitor      │
    │（Web公開）  │     │  ビルド（out/） │
    └─────────────┘     └──────┬──────────┘
                               │
               ┌───────────────┴──────────────┐
               │                              │
        Android プロジェクト           iOS プロジェクト
        (android/)                    (ios/)
               │                              │
        Android Studio              Xcode
        → APK / AAB                 → IPA
               │                              │
        Fire タブレット / Android端末    iPhone / iPad
```

### ビルドコマンド

| 用途 | コマンド |
|------|----------|
| Web 開発サーバー | `npm run dev` |
| GitHub Pages 用ビルド | `npm run build` |
| Capacitor 用ビルド | `npm run build:capacitor` |
| Android 同期 | `npm run sync:android` |
| iOS 同期 | `npm run sync:ios` |
| Android Studio を開く | `npm run open:android` |
| Xcode を開く | `npm run open:ios` |
| アイコン・スプラッシュ生成 | `npm run generate:icons` |

### basePath 切り替えの仕組み

```typescript
// next.config.ts
const isCapacitor = process.env.BUILD_TARGET === "capacitor";

basePath: (!isCapacitor && process.env.NODE_ENV === "production")
  ? "/kitchen-inventory-app"   // GitHub Pages 用
  : ""                         // Capacitor / ローカル用
```

---

## 10. CI/CD（GitHub Actions）

```
mainブランチへのpush
    ↓
1. checkout
2. Node.js 22 セットアップ
3. npm ci（依存関係インストール）
4. npm run build（Next.js 静的エクスポート → out/ ）
5. out/ を GitHub Pages アーティファクトとしてアップロード
    ↓
6. GitHub Pages にデプロイ
```

---

## 11. アプリアイコン・スプラッシュ画像のカスタマイズ

### 仕組み

`@capacitor/assets` パッケージを使い、**1枚の元画像から Android・iOS 全サイズのアイコンを自動生成**する。

```
resources/
├── icon.png          ← 元アイコン画像（1024×1024 px 推奨、PNG）
└── splash.png        ← スプラッシュ画像（2732×2732 px 推奨、PNG）※任意
```

生成されるファイル例:

```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png        (48×48)
├── mipmap-hdpi/ic_launcher.png        (72×72)
├── mipmap-xhdpi/ic_launcher.png       (96×96)
├── mipmap-xxhdpi/ic_launcher.png      (144×144)
└── mipmap-xxxhdpi/ic_launcher.png     (192×192)

ios/App/App/Assets.xcassets/AppIcon.appiconset/
└── AppIcon-512@2x.png                 (1024×1024)
```

### アイコン変更手順

1. 使いたい画像（1024×1024 px の PNG）を用意する
2. `resources/icon.png` として保存する
3. 以下コマンドを実行してアイコンを生成する:
   ```bash
   npm run generate:icons
   ```
4. Android / iOS に反映する:
   ```bash
   npm run sync:android   # Android
   npm run sync:ios       # iOS
   ```
5. Android Studio / Xcode で再ビルドしてインストールする

> **著作権について**: 第三者のキャラクター画像（サンリオ等）は個人端末での私的利用の範囲で使用すること。GitHubなどの公開リポジトリにはアップロードしない。

### generate:icons コマンドの設定

```json
// package.json
"generate:icons": "npx capacitor-assets generate --iconBackgroundColor #ffffff --splashBackgroundColor #667eea"
```

| オプション | 意味 |
|-----------|------|
| `--iconBackgroundColor` | アダプティブアイコンの背景色（Androidのみ） |
| `--splashBackgroundColor` | スプラッシュ画面の背景色 |

---

## 12. 制限・今後の課題

| 項目 | 現状 | 課題 |
|------|------|------|
| データ同期 | 端末ごとに独立 | クラウド同期（Firebase等）が必要 |
| バックアップ | なし（JSON エクスポート機能はコード上実装済み、UIは未接続） | エクスポート/インポートUIを追加 |
| 複数ユーザー | 非対応 | ユーザー認証が必要 |
| オフライン | 完全対応（PWA/Capacitor） | — |
| プッシュ通知 | 非対応 | Capacitor Notifications プラグインで実装可能 |
