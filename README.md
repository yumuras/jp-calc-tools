# jp-calc-tools

仕事とくらしの「これってどうなる？」をすぐ計算できる、無料の計算ツール集です。[Astro](https://astro.build/) で静的サイトとして書き出し、計算はすべてブラウザ内で行います。

## ツール

| パス | 内容 |
| --- | --- |
| `yukyu/` | パート・アルバイトの有給は何日？（労働基準法39条の法定最低日数。比例付与・年5日取得義務に対応） |
| `eigyobi/` | 営業日計算（○営業日後・前、期間の営業日数。祝日は `src/lib/holidays.js` で2020〜2099年を規則から計算） |
| `denkidai/` | 家電の電気代計算（1時間・1日・1か月・1年、複数家電の合計。単価の初期値は目安単価31円/kWh） |
| `kyuyo/` | 時給・日給・月給・年収の換算（1日の時間・週の日数・賞与の月数に対応。額面のみ） |
| `password/` | パスワードの強さチェック（総当たりで破られるまでの時間と弱点）と生成（`crypto.getRandomValues`） |
| `url-check/` | 怪しいURLチェック（本当の行き先、企業名の偽装、そっくり文字、短縮URLなどをルールで判定。通信しない） |
| `security-check/` | セキュリティ診断（ブラウザが最新か・OSのサポート・HTTPS・WebRTCでのIP漏れを100点満点で採点。通信しない） |
| `about/` `privacy/` `404` | 運営者情報、プライバシーポリシー・免責事項、404ページ |

## フォルダ構成

| 場所 | 中身 |
| --- | --- |
| `src/pages/` | 各ページ（`src/pages/kyuyo/index.astro` → `/kyuyo/`）。`sitemap.xml.js` で sitemap も作る |
| `src/layouts/` | 共通の head（canonical・OGP・構造化データ）・サイトバー・パンくず・フッター。`Tool.astro` はツール用 |
| `src/data/tools.js` | ツールの一覧。トップのカード、「ほかの計算ツール」、404、sitemap はここから作る |
| `src/lib/` | 計算ロジック。ページとテストの両方から読み込む |
| `public/` | そのまま配信するファイル（CSS、テーマ切替、favicon、OGP画像、robots.txt） |
| `tests/` | 計算ロジックのテスト |

## ローカルで見る

```bash
npm install
npm run dev     # http://localhost:4321/ を開く。保存すると自動で反映
```

公開と同じ形で確かめるときは `npm run build && npm run preview` です。

## テスト

```bash
npm test   # Node.js 22.12以上
```

## 公開（Cloudflare Workers）

`wrangler.jsonc` の設定で、デプロイ前に `npm run build` を実行し、書き出した `dist/` を静的サイトとして配信します。ダッシュボードのビルドコマンドは空欄のままで動きます。

1. Cloudflare のダッシュボードで Workers & Pages → Create application → このリポジトリを接続
2. ビルドコマンドは空欄、デプロイコマンドは `npx wrangler deploy`（Previews Base 側のデプロイコマンドは `npx wrangler versions upload`）
3. 独自ドメイン（mainichi-keisan.com）は Workers の設定 → Domains でカスタムドメインとして接続
4. main に push するたびに自動で公開されます

公開URLは `astro.config.mjs` の `site` に1か所だけ書いています（canonical・OGP・構造化データ・sitemap はここから作る）。`public/robots.txt` の Sitemap 行もあわせて直してください。

## ツールを足すとき

1. `src/lib/<ツール名>.js` に計算ロジックを書き、`tests/<ツール名>.test.mjs` にテストを書く
2. `src/data/tools.js` の `TOOLS` に1件足し、`CATEGORIES` のどこに出すかを決める
3. `src/pages/<ツール名>/index.astro` を作る（既存のツールページをコピーして、`Tool` に渡す値と中身を書き換える）

トップのカード、各ツールの「ほかの計算ツール」、404 の一覧、sitemap.xml には自動で入ります。
