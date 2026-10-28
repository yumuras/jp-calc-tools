// 怪しいURLチェック。SMSやメールの文面からURLを取り出し、
// フィッシングでよく使われる特徴をルールで判定する（通信はしない）。

// 有名企業・サービスと公式ドメイン（登録ドメイン単位）。
// keywords がホスト名に入っているのに、公式ドメインでなければ警告する。
export const BRANDS = [
  { name: "Amazon", keywords: ["amazon"], domains: ["amazon.co.jp", "amazon.com", "amazon.jp"] },
  { name: "楽天", keywords: ["rakuten"], domains: ["rakuten.co.jp", "rakuten.com", "rakuten-card.co.jp", "rakuten-bank.co.jp", "rakuten-sec.co.jp"] },
  { name: "Apple", keywords: ["apple", "icloud"], domains: ["apple.com", "icloud.com"] },
  { name: "Google", keywords: ["google"], domains: ["google.com", "google.co.jp"] },
  { name: "Microsoft", keywords: ["microsoft", "outlook"], domains: ["microsoft.com", "live.com", "outlook.com", "office.com"] },
  { name: "ドコモ", keywords: ["docomo"], domains: ["docomo.ne.jp", "nttdocomo.co.jp"] },
  { name: "ソフトバンク", keywords: ["softbank"], domains: ["softbank.jp", "softbank.co.jp"] },
  { name: "ヤマト運輸", keywords: ["kuroneko", "yamato"], domains: ["kuronekoyamato.co.jp", "yamato-hd.co.jp"] },
  { name: "佐川急便", keywords: ["sagawa"], domains: ["sagawa-exp.co.jp"] },
  { name: "日本郵便・ゆうちょ銀行", keywords: ["japanpost", "jppost", "yucho", "jp-bank"], domains: ["japanpost.jp"] },
  { name: "三菱UFJ銀行", keywords: ["mufg"], domains: ["mufg.jp"] },
  { name: "三井住友銀行・カード", keywords: ["smbc"], domains: ["smbc.co.jp", "smbc-card.com"] },
  { name: "みずほ銀行", keywords: ["mizuho"], domains: ["mizuhobank.co.jp", "mizuho-fg.co.jp", "mizuho-sc.com"] },
  { name: "PayPay", keywords: ["paypay"], domains: ["paypay.ne.jp", "paypay-card.co.jp", "paypay-bank.co.jp"] },
  { name: "メルカリ", keywords: ["mercari", "merpay"], domains: ["mercari.com", "merpay.com"] },
  { name: "イオン", keywords: ["aeon"], domains: ["aeon.co.jp", "aeon.com", "aeonbank.co.jp"] },
  { name: "JCB", keywords: ["jcb"], domains: ["jcb.co.jp", "jcb.jp"] },
  { name: "エポスカード", keywords: ["eposcard"], domains: ["eposcard.co.jp"] },
  { name: "国税庁（e-Tax）", keywords: ["e-tax", "etax"], domains: ["nta.go.jp"] },
  { name: "マイナポータル", keywords: ["myna"], domains: ["myna.go.jp", "digital.go.jp"] },
];

export const SHORTENERS = new Set([
  "bit.ly", "t.co", "tinyurl.com", "is.gd", "x.gd", "ow.ly", "cutt.ly", "rebrand.ly",
  "buff.ly", "t.ly", "shorturl.at", "rb.gy", "goo.su", "amzn.to", "lin.ee",
]);

// 詐欺に使われることが多いドメインの末尾（正規のサイトもある）
export const RISKY_TLDS = new Set([
  "top", "xyz", "icu", "cfd", "sbs", "buzz", "click", "cyou", "bond", "vip", "rest",
  "monster", "lol", "quest", "mom", "work", "support", "shop", "online", "site", "live",
]);

// 2階層で1つのドメインになる末尾（例：example.co.jp の co.jp）
const SECOND_LEVEL = new Set([
  "co.jp", "ne.jp", "or.jp", "go.jp", "ac.jp", "ad.jp", "ed.jp", "gr.jp", "lg.jp",
  "co.uk", "org.uk", "ac.uk", "com.au", "com.cn", "com.tw", "com.hk", "co.kr", "com.br",
]);

// --- punycode（xn--）を日本語やキリル文字などに戻す（RFC 3492） ---
function decodePunycodeLabel(input) {
  const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
  const output = [];
  let i = 0, n = 128, bias = 72;
  const basic = input.lastIndexOf("-");
  for (let j = 0; j < Math.max(basic, 0); j++) output.push(input.charCodeAt(j));
  const digit = (c) => (c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : base);
  const adapt = (delta, numPoints, first) => {
    let k = 0;
    delta = first ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    for (; delta > ((base - tMin) * tMax) >> 1; k += base) delta = Math.floor(delta / (base - tMin));
    return Math.floor(k + ((base - tMin + 1) * delta) / (delta + skew));
  };
  for (let index = basic > 0 ? basic + 1 : 0; index < input.length; ) {
    const oldi = i;
    for (let w = 1, k = base; ; k += base) {
      if (index >= input.length) throw new Error("bad punycode");
      const d = digit(input.charCodeAt(index++));
      if (d >= base) throw new Error("bad punycode");
      i += d * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (d < t) break;
      w *= base - t;
    }
    const len = output.length + 1;
    bias = adapt(i - oldi, len, oldi === 0);
    n += Math.floor(i / len);
    i %= len;
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
}

export function toUnicodeHost(host) {
  return host
    .split(".")
    .map((label) => {
      if (!label.startsWith("xn--")) return label;
      try {
        return decodePunycodeLabel(label.slice(4));
      } catch {
        return label;
      }
    })
    .join(".");
}

/** 登録ドメイン（example.co.jp / example.com）。IPアドレスならそのまま */
export function registrableDomain(host) {
  if (isIpAddress(host)) return host;
  const labels = host.split(".").filter(Boolean);
  const take = labels.length >= 3 && SECOND_LEVEL.has(labels.slice(-2).join(".")) ? 3 : 2;
  return labels.slice(-take).join(".");
}

function isIpAddress(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
}

/** 文面から最初のURLらしきものを取り出す */
export function extractUrl(text) {
  const trim = (s) => s.replace(/[)\]）」』】>。、，．,.!！?？'"]+$/u, "");
  const withScheme = text.match(/(?:https?|hxxps?):\/\/[^\s<>"「」『』【】]+/iu);
  if (withScheme) return { raw: trim(withScheme[0]).replace(/^hxxp/i, "http"), hadScheme: true };
  const bare = text.match(/(?:[\p{L}\p{N}-]+\.)+[\p{L}]{2,}(?::\d+)?(?:[/?#][^\s<>"「」『』【】]*)?/u);
  if (bare) return { raw: trim(bare[0]), hadScheme: false };
  return null;
}

// 似せた綴りを戻す（amaz0n → amazon、arnazon → amazon）
function unconfuse(s) {
  return s.replace(/0/g, "o").replace(/1/g, "l").replace(/rn/g, "m").replace(/vv/g, "w").replace(/3/g, "e");
}

/**
 * 判定結果
 * findings: { level: "danger" | "warn" | "info", title, detail }
 */
export function checkUrl(text) {
  const found = extractUrl(String(text ?? ""));
  if (!found) return null;

  let url;
  try {
    url = new URL(found.hadScheme ? found.raw : `https://${found.raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  const unicodeHost = toUnicodeHost(host);
  const domain = registrableDomain(host);
  const findings = [];
  const add = (level, title, detail) => findings.push({ level, title, detail });

  if (url.username || url.password) {
    add("danger", "「@」の前は飾りです", `「${decodeURIComponent(url.username)}」と書いてありますが、実際の行き先は「@」の後ろの ${unicodeHost} です。`);
  }

  if (isIpAddress(host)) {
    add("danger", "ドメイン名ではなく数字（IPアドレス）です", "正規の企業がSMSやメールでIPアドレスのリンクを送ることは、まずありません。");
  }

  if (host.split(".").some((l) => l.startsWith("xn--"))) {
    const latin = /[a-z]/i.test(unicodeHost);
    const lookalike = /[Ͱ-ϿЀ-ӿ]/.test(unicodeHost);
    if (latin && lookalike) {
      add("danger", "見た目がそっくりな別の文字が混ざっています", `アルファベットに見えますが、ロシア文字やギリシャ文字が入っています。本当の文字は ${host} です。`);
    } else {
      add("info", "日本語などを使ったドメインです", `ブラウザ上では ${host} として扱われます。`);
    }
  }

  const plainHost = host.replace(/[^a-z0-9.-]/g, "");
  for (const brand of BRANDS) {
    const official = brand.domains.includes(domain);
    if (official) continue;
    const direct = brand.keywords.some((k) => plainHost.includes(k));
    const disguised = !direct && brand.keywords.some((k) => unconfuse(plainHost).includes(k));
    if (direct) {
      add("danger", `${brand.name}の名前が入っていますが、公式のドメインではありません`, `本当の行き先は ${domain} です。${brand.name}の公式は ${brand.domains.join("、")} などです。`);
    } else if (disguised) {
      add("danger", `${brand.name}に似せた綴りです`, `0とo、rnとm のように、似た文字に置きかえています。本当の行き先は ${domain} です。`);
    }
  }

  if (SHORTENERS.has(domain) || SHORTENERS.has(host)) {
    add("warn", "短縮URLです", "本当の行き先が隠れています。短縮URLを展開するサービスで行き先を確かめてから開いてください。");
  }

  const tld = host.split(".").pop();
  if (RISKY_TLDS.has(tld)) {
    add("warn", `末尾が「.${tld}」です`, "安く取れるため、詐欺サイトによく使われるドメインの末尾です（正規のサイトもあります）。");
  }

  if (url.protocol === "http:" && found.hadScheme) {
    add("warn", "暗号化されていない http です", "入力した内容が途中で読まれるおそれがあります。ログインやカード情報の入力は絶対にしないでください。");
  }

  if (url.port) {
    add("warn", `ポート番号（:${url.port}）がついています`, "一般向けのサイトではめったに使いません。");
  }

  if (host.split(".").length >= 5 || /-{2,}|(-[a-z0-9]+){3,}/.test(domain)) {
    add("warn", "ドメインが不自然に長い・区切りが多いです", "本物らしく見せるために、企業名やlogin・secureなどの単語を並べることがあります。");
  }

  const order = { danger: 0, warn: 1, info: 2 };
  findings.sort((a, b) => order[a.level] - order[b.level]);
  const verdict = findings.some((f) => f.level === "danger") ? "danger" : findings.some((f) => f.level === "warn") ? "warn" : "none";

  return { url: url.href, host, unicodeHost, domain, findings, verdict };
}
