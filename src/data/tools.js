// ツールの一覧。トップのカード、各ページの「ほかの計算ツール」、404、sitemap.xml はここから作る。
// ツールを足すときは、ここに1件足して src/pages/<slug>/index.astro を作る。
// 並び順は sitemap・関連リンク・404 の順。トップでの並びは CATEGORIES で決める。

export const TOOLS = [
  {
    slug: "yukyu",
    name: "パート・アルバイトの有給は何日？",
    desc: "週の勤務日数と入社日から、法律上もらえる有給休暇の最低日数がわかります。",
    summary: "法律上もらえる有給休暇の最低日数",
    when: "「パートに有給はない」と言われたとき",
    icon: `<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18M8 14h3M8 17.5h6"/></svg>`,
  },
  {
    slug: "eigyobi",
    name: "営業日計算",
    desc: "○営業日後の日付や、期間の営業日数を計算します。土日・祝日・年末年始に対応。",
    summary: "○営業日後の日付と期間の営業日数",
    when: "「5営業日以内に返送」の期限を知りたいとき",
    icon: `<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18M9 15.5l2 2 4-4"/></svg>`,
  },
  {
    slug: "denkidai",
    name: "家電の電気代計算",
    desc: "消費電力と使う時間から、1時間・1日・1か月・1年の電気代がわかります。複数の家電の合計も。",
    summary: "1時間・1日・1か月・1年の電気代",
    when: "エアコンやドライヤーの電気代が気になったとき",
    icon: `<svg viewBox="0 0 24 24"><path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z"/></svg>`,
  },
  {
    slug: "kyuyo",
    name: "時給・月給・年収の換算",
    desc: "時給・日給・月給・年収のどれか1つから、残りをまとめて換算します。賞与にも対応。",
    summary: "時給・日給・月給・年収をまとめて換算",
    when: "時給の求人と月給の求人を比べたいとき",
    icon: `<svg viewBox="0 0 24 24"><path d="M6 3.5l6 7.5 6-7.5M12 11v9.5M7.5 13.5h9M7.5 17h9"/></svg>`,
  },
  {
    slug: "rimawari",
    name: "不動産投資の利回り計算",
    desc: "物件価格と家賃から表面利回り・実質利回りを計算。目標の利回りから買える価格も逆算できます。",
    summary: "表面利回り・実質利回りと、目標利回りから買える価格",
    when: "投資用マンションの広告の利回りを確かめたいとき",
    icon: `<svg viewBox="0 0 24 24"><path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/></svg>`,
  },
  {
    slug: "pdf",
    name: "PDFの結合・分割",
    desc: "複数のPDFを1つにまとめたり、必要なページだけ抜き出したり。ファイルは送信せず、ブラウザの中だけで処理します。",
    summary: "PDFの結合とページの抜き出し（ファイルは送信しない）",
    when: "スキャンした書類を1つのPDFにまとめたいとき",
    icon: `<svg viewBox="0 0 24 24"><path d="M6 2.5h8l4.5 4.5v14.5h-12.5z"/><path d="M14 2.5V7h4.5"/><path d="M9 13h6M9 16.5h6"/></svg>`,
  },
  {
    slug: "password",
    name: "パスワード生成・強さチェック",
    desc: "ランダムで強いパスワードをワンタップで自動生成。記号なし・数字だけ（暗証番号）にも対応し、強さもチェックできます。",
    summary: "ランダムで強いパスワードの自動作成と、破られるまでの時間",
    when: "パスワードを新しく決めるとき",
    icon: `<svg viewBox="0 0 24 24"><circle cx="8" cy="15.5" r="4.5"/><path d="M11.3 12.2L20.5 3M17 6.5l3 3M14.5 9l2 2"/></svg>`,
  },
  {
    slug: "url-check",
    name: "怪しいURLチェック",
    desc: "SMSやメールのリンクを貼ると、本当の行き先や偽装の特徴をその場でチェックします。",
    summary: "偽SMS・フィッシングのリンクの見分け",
    when: "宅配便や銀行を名乗るSMSが届いたとき",
    icon: `<svg viewBox="0 0 24 24"><path d="M12 2.8l8 3v6.1c0 4.9-3.4 8.2-8 9.3-4.6-1.1-8-4.4-8-9.3V5.8z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.4"/></svg>`,
  },
  {
    slug: "security-check",
    name: "セキュリティ診断",
    desc: "ボタン1つで、ブラウザが最新か・通信が暗号化されているか・IPアドレスが漏れていないかを100点満点で診断します。",
    summary: "ブラウザと接続の安全性を100点満点でチェック",
    when: "自分のスマホやパソコンが安全か気になったとき",
    icon: `<svg viewBox="0 0 24 24"><path d="M3.5 15.5a8.5 8.5 0 1 1 17 0"/><path d="M12 15.5l4-5"/><circle cx="12" cy="15.5" r="1.3"/><path d="M3.5 19.5h17"/></svg>`,
  },
];

export const CATEGORIES = [
  { name: "仕事・お金", tools: ["yukyu", "kyuyo", "eigyobi"] },
  { name: "くらし", tools: ["denkidai"] },
  { name: "不動産", tools: ["rimawari"] },
  { name: "PDF", tools: ["pdf"] },
  { name: "セキュリティ", tools: ["security-check", "url-check", "password"] },
];

export const toolBySlug = (slug) => TOOLS.find((t) => t.slug === slug);
