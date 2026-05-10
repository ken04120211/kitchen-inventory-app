import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { parseReceiptText, ParsedReceiptItem } from "./receiptParser";

export type ScanProgress = {
  status: "camera" | "loading" | "recognizing" | "done";
  percent: number;
};

export async function scanReceipt(
  onProgress?: (p: ScanProgress) => void
): Promise<ParsedReceiptItem[]> {
  onProgress?.({ status: "camera", percent: 0 });

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
  });

  if (!photo.dataUrl) throw new Error("写真の取得に失敗しました");

  onProgress?.({ status: "loading", percent: 0 });

  // Tesseract.js を動的インポート（初回のみ日本語データをダウンロード）
  const Tesseract = (await import("tesseract.js")).default;

  const result = await Tesseract.recognize(photo.dataUrl, "jpn", {
    logger: ({ status, progress }) => {
      if (status === "loading tesseract core") {
        onProgress?.({ status: "loading", percent: Math.round(progress * 40) });
      } else if (status === "loading language traineddata") {
        onProgress?.({ status: "loading", percent: 40 + Math.round(progress * 30) });
      } else if (status === "recognizing text") {
        onProgress?.({ status: "recognizing", percent: 70 + Math.round(progress * 30) });
      }
    },
  });

  onProgress?.({ status: "done", percent: 100 });

  const text = result.data.text;
  if (!text.trim()) throw new Error("テキストを読み取れませんでした");

  const items = parseReceiptText(text);
  if (items.length === 0) throw new Error("食材を検出できませんでした");

  return items;
}
