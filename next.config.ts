import type { NextConfig } from "next";

const isCapacitor = process.env.BUILD_TARGET === "capacitor";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Capacitorビルド時はbasePath不要、GitHub Pages用のみ設定
  basePath: (!isCapacitor && process.env.NODE_ENV === "production")
    ? "/kitchen-inventory-app"
    : "",
};

export default nextConfig;
