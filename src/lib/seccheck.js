// ブラウザのセキュリティ診断。判定はすべて端末の中で行い、外部には通信しない。
//
// 「最新のブラウザか」は、年ごとに数字を書き換えなくて済むよう、
// リリース周期から今日の日付で期待されるバージョンを計算して比べる。
//   Chrome・Edge：約4週ごと。休暇期の間隔を含めた実績は平均約32日（Chrome 141 = 2025-09-30）
//   Firefox：約4週ごと。実績は平均約28.5日（Firefox 144 = 2025-10-14）
//   Safari：年1回の秋（Safari 26 = 2025-09-15。以降は年号に合わせた番号）
// 周期の誤差は TOLERANCE で吸収する。

const DAY = 24 * 60 * 60 * 1000;

const CADENCE = {
  chrome: { base: 141, date: Date.UTC(2025, 8, 30), everyDays: 32 },
  firefox: { base: 144, date: Date.UTC(2025, 9, 14), everyDays: 28.5 },
  safari: { base: 26, date: Date.UTC(2025, 8, 15), everyDays: 365.25 },
};

// 期待バージョンから何版遅れまでを「最新」とみなすか
const TOLERANCE = { chrome: 4, firefox: 4, safari: 1 };

export const BROWSER_LABELS = {
  chrome: "Google Chrome",
  edge: "Microsoft Edge",
  firefox: "Firefox",
  safari: "Safari",
  opera: "Opera",
  samsung: "Samsung Internet",
  other: "その他のブラウザ",
};

/** User-Agent からブラウザの種類とメジャーバージョンを取り出す */
export function parseBrowser(ua) {
  const num = (re) => {
    const m = ua.match(re);
    return m ? Number(m[1]) : null;
  };
  if (/SamsungBrowser\//.test(ua)) return { name: "samsung", version: num(/SamsungBrowser\/(\d+)/), cadence: null };
  if (/OPR\/|Opera/.test(ua)) return { name: "opera", version: num(/Chrome\/(\d+)/), cadence: "chrome" };
  if (/Edg(A|iOS)?\//.test(ua)) return { name: "edge", version: num(/Edg(?:A|iOS)?\/(\d+)/), cadence: "chrome" };
  if (/CriOS\//.test(ua)) return { name: "chrome", version: num(/CriOS\/(\d+)/), cadence: "chrome" };
  if (/FxiOS\//.test(ua)) return { name: "firefox", version: num(/FxiOS\/(\d+)/), cadence: "firefox" };
  if (/Firefox\//.test(ua)) return { name: "firefox", version: num(/Firefox\/(\d+)/), cadence: "firefox" };
  if (/Chrome\//.test(ua)) return { name: "chrome", version: num(/Chrome\/(\d+)/), cadence: "chrome" };
  if (/Version\/\d+.*Safari\//.test(ua)) return { name: "safari", version: num(/Version\/(\d+)/), cadence: "safari" };
  return { name: "other", version: null, cadence: null };
}

/** その日付で出ているはずの最新メジャーバージョン */
export function expectedVersion(cadence, now) {
  const c = CADENCE[cadence];
  if (!c) return null;
  const elapsed = Math.max(0, (now.getTime() - c.date) / DAY);
  return c.base + Math.floor(elapsed / c.everyDays);
}

/** OS の推定（UAで分かる範囲。macOS・Android の細かい版はUAに出ないので見ない） */
export function parseOs(ua) {
  const win = ua.match(/Windows NT (\d+\.\d+)/);
  if (win) {
    const names = { "10.0": "Windows 10/11", "6.3": "Windows 8.1", "6.2": "Windows 8", "6.1": "Windows 7", "6.0": "Windows Vista", "5.1": "Windows XP" };
    return { name: names[win[1]] ?? "Windows", unsupported: win[1] !== "10.0" };
  }
  if (/iPhone|iPad|iPod/.test(ua)) return { name: /iPad/.test(ua) ? "iPadOS" : "iOS", unsupported: false };
  if (/Android/.test(ua)) return { name: "Android", unsupported: false };
  if (/Mac OS X|Macintosh/.test(ua)) return { name: "macOS", unsupported: false };
  if (/CrOS/.test(ua)) return { name: "ChromeOS", unsupported: false };
  if (/Linux/.test(ua)) return { name: "Linux", unsupported: false };
  return { name: "不明", unsupported: false };
}

/**
 * WebRTC の候補（candidate 行）から見えるアドレスを判定する。
 * 端末のIPアドレスがそのまま出ていれば "exposed"、"xxxx.local" で隠れていれば "masked"。
 */
export function classifyCandidates(lines) {
  const addresses = new Set();
  let masked = false;
  for (const line of lines) {
    const parts = line.replace(/^a=/, "").split(" ");
    // candidate:foundation component protocol priority address port typ type ...
    const address = parts[4];
    if (!address) continue;
    if (address.endsWith(".local")) masked = true;
    else if (/^[0-9.]+$/.test(address) || address.includes(":")) addresses.add(address);
  }
  if (addresses.size > 0) return { status: "exposed", addresses: [...addresses] };
  return { status: masked ? "masked" : "none", addresses: [] };
}

/**
 * 診断項目をまとめる。env は画面側で集めた値。
 * 戻り値の各項目：{ id, title, status: "pass" | "warn" | "fail", weight, detail, advice }
 */
export function evaluate(env, now = new Date()) {
  const items = [];

  // 1. ブラウザ
  const browser = parseBrowser(env.userAgent);
  const label = BROWSER_LABELS[browser.name];
  const expected = browser.cadence ? expectedVersion(browser.cadence, now) : null;
  if (expected && browser.version) {
    const behind = expected - browser.version;
    const ok = behind <= TOLERANCE[browser.cadence];
    items.push({
      id: "browser",
      title: "ブラウザが最新か",
      status: ok ? "pass" : behind <= TOLERANCE[browser.cadence] * 3 ? "warn" : "fail",
      weight: 40,
      detail: `${label} ${browser.version}（今の最新はおよそ ${expected}）`,
      advice: ok ? "最新に近い状態です。自動更新をオンのままにしておきましょう。" : "古いブラウザは、知られている弱点を突かれる危険があります。設定画面からブラウザを更新してください。",
    });
  } else {
    items.push({
      id: "browser",
      title: "ブラウザが最新か",
      status: "warn",
      weight: 40,
      detail: `${label}${browser.version ? ` ${browser.version}` : ""}（このブラウザは自動では判定できません）`,
      advice: "ブラウザの設定画面で、更新が来ていないか確認してください。",
    });
  }

  // 2. OS
  const os = parseOs(env.userAgent);
  items.push({
    id: "os",
    title: "サポート中のOSか",
    status: os.unsupported ? "fail" : "pass",
    weight: 20,
    detail: os.name,
    advice: os.unsupported
      ? "このOSはメーカーのサポート（セキュリティ更新）が終わっています。新しいOSへの移行をおすすめします。"
      : "OSのアップデートは、届いたらなるべく早く入れましょう。",
  });

  // 3. 暗号化された接続
  items.push({
    id: "https",
    title: "暗号化された接続か",
    status: env.protocol === "https:" && env.isSecureContext ? "pass" : "fail",
    weight: 20,
    detail: env.protocol === "https:" ? "HTTPS（暗号化あり）" : "HTTP（暗号化なし）",
    advice: env.protocol === "https:"
      ? "このページとの通信は暗号化されています。ほかのサイトでも、アドレスが https:// で始まるか確認する習慣をつけましょう。"
      : "通信が暗号化されていません。パスワードやカード番号は入力しないでください。",
  });

  // 4. WebRTC でのIPアドレス
  const rtc = env.webrtc ?? { status: "none", addresses: [] };
  items.push({
    id: "webrtc",
    title: "端末のIPアドレスが漏れていないか（WebRTC）",
    status: rtc.status === "exposed" ? "warn" : "pass",
    weight: 20,
    detail:
      rtc.status === "exposed" ? `見えているアドレス：${rtc.addresses.join("、")}`
      : rtc.status === "masked" ? "アドレスは隠されています"
      : "WebRTC からアドレスは見えません",
    advice: rtc.status === "exposed"
      ? "ビデオ通話などの機能（WebRTC）から、端末のIPアドレスがサイトに見えています。ブラウザを最新にするか、プライバシー保護の設定を見直してください。"
      : "問題ありません。",
  });

  return items;
}

const POINTS = { pass: 1, warn: 0.5, fail: 0 };

export function score(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  const got = items.reduce((sum, i) => sum + i.weight * POINTS[i.status], 0);
  return total === 0 ? 0 : Math.round((got / total) * 100);
}

export function grade(points) {
  if (points >= 90) return { label: "とても安全", level: "ok" };
  if (points >= 70) return { label: "おおむね安全", level: "ok" };
  if (points >= 50) return { label: "注意が必要", level: "warn" };
  return { label: "危険", level: "danger" };
}
