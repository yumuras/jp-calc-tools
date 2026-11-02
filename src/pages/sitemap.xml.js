// sitemap.xml。ツールは src/data/tools.js の一覧から作る。
import { TOOLS } from "../data/tools.js";

export function GET({ site }) {
  const paths = ["/", ...TOOLS.map((t) => `/${t.slug}/`), "/about/", "/privacy/"];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
