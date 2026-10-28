# jp-calc-tools

仕事とくらしの「これってどうなる？」をすぐ計算できる、無料の計算ツール集です。ビルド不要の静的サイト（HTML + JavaScript）で、計算はすべてブラウザ内で行います。

## ツール

| パス | 内容 |
| --- | --- |
| `yukyu/` | パート・アルバイトの有給は何日？（労働基準法39条の法定最低日数。比例付与・年5日取得義務に対応） |
| `eigyobi/` | 営業日計算（○営業日後・前、期間の営業日数。祝日は `assets/holidays.js` で2020〜2099年を規則から計算） |
| `denkidai/` | 家電の電気代計算（1時間・1日・1か月・1年、複数家電の合計。単価の初期値は目安単価31円/kWh） |
| `kyuyo/` | 時給・日給・月給・年収の換算（1日の時間・週の日数・賞与の月数に対応。額面のみ） |
| `password/` | パスワードの強さチェック（総当たりで破られるまでの時間と弱点）と生成（`crypto.getRandomValues`） |
| `url-check/` | 怪しいURLチェック（本当の行き先、企業名の偽装、そっくり文字、短縮URLなどをルールで判定。通信しない） |
| `security-check/` | セキュリティ診断（ブラウザが最新か・OSのサポート・HTTPS・WebRTCでのIP漏れを100点満点で採点。通信しない） |
| `about/` `privacy/` `404.html` | 運営者情報、プライバシーポリシー・免責事項、404ページ |

## ローカルで見る

```bash
uv run python -m http.server 8000   # http://localhost:8000/ を開く
```

`file://` で直接開くと、ES modules の読み込みが止まるので、簡易サーバー経由で開いてください。

## テスト

```bash
npm test   # Node.js 20以上。依存パッケージなし
```

計算ロジックは `assets/*.js` に置き、画面（HTML）とテストの両方から読み込みます。

## 公開（Cloudflare Workers）

`wrangler.jsonc` の設定で、リポジトリ直下を静的サイトとして配信します（ビルドなし）。`tests/` や README などは `.assetsignore` で配信対象から外しています。

1. Cloudflare のダッシュボードで Workers & Pages → Create application → このリポジトリを接続
2. ビルドコマンドは空欄、デプロイコマンドは `npx wrangler deploy`
3. main に push するたびに自動で公開されます

公開URLは `https://jp-calc-tools.pages.dev` を前提に、各ページの canonical・OGP・構造化データと `sitemap.xml`・`robots.txt` に書いています。URLが変わったら次で一括置換します。

```bash
grep -rl 'jp-calc-tools.pages.dev' --include='*.html' --include='*.xml' --include='*.txt' . | xargs sed -i 's#https://jp-calc-tools.pages.dev#https://新しいURL#g'
```

## ツールを足すとき

1. `<ツール名>/index.html` と `assets/<ツール名>.js` を作る
2. `tests/<ツール名>.test.mjs` に計算ロジックのテストを書く
3. トップの `index.html` と `404.html` の一覧、各ツールの「ほかの計算ツール」に追加する
4. head に canonical・OGP・構造化データ（既存ページをコピー）を入れ、`sitemap.xml` にURLを足す
