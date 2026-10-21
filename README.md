# jp-calc-tools

仕事とくらしの「これってどうなる？」をすぐ計算できる、無料の計算ツール集です。ビルド不要の静的サイト（HTML + JavaScript）で、計算はすべてブラウザ内で行います。

## ツール

| パス | 内容 |
| --- | --- |
| `yukyu/` | 有給休暇の付与日数計算（労働基準法39条、比例付与・年5日取得義務に対応） |

## ローカルで見る

```bash
python3 -m http.server 8000   # http://localhost:8000/ を開く
```

`file://` で直接開くと、ES modules の読み込みが止まるので、簡易サーバー経由で開いてください。

## テスト

```bash
npm test   # Node.js 20以上。依存パッケージなし
```

計算ロジックは `assets/*.js` に置き、画面（HTML）とテストの両方から読み込みます。

## 公開（Cloudflare Pages）

1. Cloudflare のダッシュボードで Workers & Pages → Create → Pages → このリポジトリを接続
2. ビルドコマンドは空欄、出力ディレクトリは `/`
3. main に push するたびに自動で公開されます

## ツールを足すとき

1. `<ツール名>/index.html` と `assets/<ツール名>.js` を作る
2. `tests/<ツール名>.test.mjs` に計算ロジックのテストを書く
3. トップの `index.html` の一覧に追加する
