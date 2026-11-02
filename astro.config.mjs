// @ts-check
import { defineConfig } from "astro/config";

// 静的サイトとして dist/ に書き出す。URL は /kyuyo/ のように末尾スラッシュつき。
export default defineConfig({
  site: "https://mainichi-keisan.com",
  trailingSlash: "always",
  build: { format: "directory" },
});
