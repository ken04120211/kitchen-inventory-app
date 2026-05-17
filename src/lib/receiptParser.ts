import { FoodCategory, Unit, KnownItem } from "@/types";

export type ParsedReceiptItem = {
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: Unit;
};

const categoryKeywords: Record<FoodCategory, string[]> = {
  "野菜": [
    "たまねぎ", "玉ねぎ", "玉葱", "にんじん", "人参", "じゃがいも", "馬鈴薯",
    "キャベツ", "ほうれん草", "ほうれん", "トマト", "なす", "茄子", "きゅうり",
    "ねぎ", "葱", "ごぼう", "牛蒡", "ブロッコリー", "もやし", "にら", "韮",
    "ピーマン", "かぼちゃ", "南瓜", "れんこん", "蓮根", "さつまいも", "大根",
    "白菜", "レタス", "小松菜", "チンゲン", "アスパラ", "パプリカ", "えだまめ",
    "枝豆", "いんげん", "絹さや", "しいたけ", "椎茸", "えのき", "まいたけ", "しめじ",
    "野菜",
  ],
  "肉類": [
    "牛肉", "豚肉", "鶏肉", "ひき肉", "挽き肉", "ミンチ", "ベーコン", "ハム",
    "ソーセージ", "ウインナー", "チキン", "もも肉", "胸肉", "ロース", "バラ",
    "ささみ", "レバー", "豚バラ", "豚ロース", "鶏もも", "鶏胸", "合いびき",
  ],
  "魚類": [
    "鮭", "サーモン", "さば", "サバ", "まぐろ", "マグロ", "たい", "タイ",
    "えび", "エビ", "海老", "いか", "イカ", "たこ", "タコ", "あじ", "アジ",
    "さんま", "サンマ", "ぶり", "ブリ", "かつお", "ちくわ", "さつま揚げ",
    "かまぼこ", "蒲鉾", "刺身", "あさり", "しじみ", "帆立", "ホタテ", "ししゃも",
  ],
  "乳製品": [
    "牛乳", "ヨーグルト", "チーズ", "バター", "生クリーム", "豆乳",
    "アイスクリーム", "プリン",
  ],
  "調味料": [
    "しょうゆ", "醤油", "みそ", "味噌", "塩", "砂糖", "酢", "みりん",
    "料理酒", "マヨネーズ", "ケチャップ", "ソース", "ドレッシング",
    "サラダ油", "オリーブオイル", "こしょう", "胡椒", "だし", "めんつゆ",
    "ポン酢", "カレー粉", "コンソメ", "鶏がら", "にんにく", "しょうが", "生姜",
  ],
  "レトルト": [
    "レトルト", "カレー", "シチュー", "ハヤシ", "パスタソース", "ミートソース",
    "缶詰", "ツナ缶", "サバ缶", "おかゆ", "丼の素",
  ],
  "カップ麺": [
    "カップ", "カップラーメン", "カップヌードル", "袋麺", "即席",
    "どん兵衛", "赤いきつね", "マルちゃん",
  ],
  "冷凍食品": [
    "冷凍", "フローズン", "冷凍餃子", "餃子", "シュウマイ", "唐揚げ",
    "コロッケ", "冷凍うどん", "冷凍野菜",
  ],
  "その他": [],
};

const skipKeywords = [
  "小計", "合計", "税", "お釣り", "お預り", "ポイント", "値引", "割引",
  "領収", "レシート", "電話", "TEL", "住所", "スタッフ", "ありがとう",
  "またの", "営業", "レジ", "担当", "現金", "クレジット", "Suica", "PayPay",
  "nanaco", "ナナコ", "イトーヨーカドー", "セブン", "イオン", "ヨーカドー",
];

function inferCategory(name: string): FoodCategory {
  for (const [category, keywords] of Object.entries(categoryKeywords) as [FoodCategory, string[]][]) {
    if (category === "その他") continue;
    if (keywords.some(kw => name.includes(kw))) return category;
  }
  return "その他";
}

function extractQuantityAndUnit(text: string): { quantity: number; unit: Unit; cleanedText: string } {
  const patterns: [RegExp, Unit][] = [
    [/(\d+\.?\d*)\s*kg/i, "kg"],
    [/(\d+\.?\d*)\s*g(?!\w)/i, "g"],
    [/(\d+\.?\d*)\s*[Ll](?!\w)/i, "L"],
    [/(\d+\.?\d*)\s*ml/i, "ml"],
    [/(\d+)\s*パック/, "パック"],
    [/(\d+)\s*袋/, "袋"],
    [/(\d+)\s*本/, "本"],
    [/(\d+)\s*個/, "個"],
    [/[×ｘx]\s*(\d+)/, "個"],
    [/(\d+)\s*[Pp](?:\b|$)/, "パック"],
  ];

  for (const [pattern, unit] of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        quantity: parseFloat(match[1]),
        unit,
        cleanedText: text.replace(match[0], "").trim(),
      };
    }
  }
  return { quantity: 1, unit: "個", cleanedText: text };
}

function bigramSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return na === nb ? 1 : 0;
  const counts = new Map<string, number>();
  for (let i = 0; i < na.length - 1; i++) {
    const bg = na.slice(i, i + 2);
    counts.set(bg, (counts.get(bg) ?? 0) + 1);
  }
  let intersect = 0;
  for (let i = 0; i < nb.length - 1; i++) {
    const bg = nb.slice(i, i + 2);
    const c = counts.get(bg) ?? 0;
    if (c > 0) { counts.set(bg, c - 1); intersect++; }
  }
  return (2 * intersect) / (na.length + nb.length - 2);
}

function matchKnownItem(line: string, knownItems: KnownItem[]): KnownItem | null {
  const normalized = line.replace(/\s+/g, "").toLowerCase();
  let best: { item: KnownItem; score: number } | null = null;
  for (const item of knownItems) {
    const candidates = [item.name, ...item.aliases];
    for (const candidate of candidates) {
      const cn = candidate.replace(/\s+/g, "").toLowerCase();
      if (normalized.includes(cn) || cn.includes(normalized)) {
        return item;
      }
      const score = bigramSimilarity(normalized, cn);
      if (score >= 0.6 && (!best || score > best.score)) {
        best = { item, score };
      }
    }
  }
  return best?.item ?? null;
}

function cleanProductName(text: string): string {
  return text
    .replace(/[¥￥]\s*[\d,，]+/g, "")
    .replace(/[\d,，]+\s*円/g, "")
    .replace(/^\*+/, "")
    .replace(/\*+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldSkipLine(line: string): boolean {
  if (line.length < 2) return true;
  // 数字・記号のみ
  if (/^[\d\s¥￥,，\.\-\/：:*]+$/.test(line)) return true;
  // 日付パターン
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(line)) return true;
  // 時刻パターン
  if (/^\d{1,2}:\d{2}/.test(line)) return true;
  return skipKeywords.some(kw => line.includes(kw));
}

export function parseReceiptText(rawText: string, knownItems: KnownItem[] = []): ParsedReceiptItem[] {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  const items: ParsedReceiptItem[] = [];
  const seenNames = new Set<string>();

  for (const line of lines) {
    if (shouldSkipLine(line)) continue;

    const matched = matchKnownItem(line, knownItems);
    if (matched) {
      if (seenNames.has(matched.name)) continue;
      seenNames.add(matched.name);
      const { quantity } = extractQuantityAndUnit(line);
      items.push({
        name: matched.name,
        category: matched.category,
        quantity,
        unit: matched.unit,
      });
      continue;
    }

    const { quantity, unit, cleanedText } = extractQuantityAndUnit(line);
    const name = cleanProductName(cleanedText);

    if (name.length < 2) continue;
    if (/^[\d\s¥￥,，\.\-]+$/.test(name)) continue;
    if (seenNames.has(name)) continue;

    seenNames.add(name);
    items.push({ name, category: inferCategory(name), quantity, unit });
  }

  return items;
}
