import type { NextConfig } from "next";

const buildTarget = process.env.BUILD_TARGET;
const isCapacitor  = buildTarget === "capacitor";
const isGithubPages = buildTarget === "github-pages";
const isStatic = isCapacitor || isGithubPages;

const nextConfig: NextConfig = {
  // Capacitor(iOS)・GitHub Pages → 静的エクスポート
  // Ubuntu サーバー(デフォルト) → standalone（SSR + API Routes 対応）
  output: isStatic ? "export" : "standalone",
  trailingSlash: isStatic,
  images: {
    unoptimized: isStatic,
  },
  basePath: isGithubPages ? "/kitchen-inventory-app" : "",
};

export default nextConfig;
