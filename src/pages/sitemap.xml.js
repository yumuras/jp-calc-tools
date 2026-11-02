// sitemap.xml。ツールは src/data/tools.js の一覧から作る。
import { TOOLS } from "../data/tools.js";

// 解説記事はツール一覧に入れないので、ここで親のツールの直後に足す。
const ARTICLES = {
  yukyu: ["/yukyu/hayami/"],
  denkidai: ["/denkidai/danbou/", "/denkidai/kaden/"],
  kyuyo: ["/kyuyo/jikyu-gesshu/"],
};

export function GET({ site }) {
  const toolPaths = TOOLS.flatMap((t) => [`/${t.slug}/`, ...(ARTICLES[t.slug] ?? [])]);
  const paths = ["/", ...toolPaths, "/about/", "/privacy/"];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
