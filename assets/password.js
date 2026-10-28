// パスワードの強さチェックと生成。
// 強さ = 長さ × log2(使われている文字の種類の数)（ビット）。
// 破られるまでの時間は、総当たりで全体の半分を試すまでの平均時間。

export const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digit: "0123456789",
  symbol: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
};

// 紛らわしい文字（0とO、1とlとI など）
export const AMBIGUOUS = "0O1lI|`'\"";

// 日本語などASCII以外の文字が入っているときに足す種類の数（控えめな目安）
const OTHER_SIZE = 100;

// 1秒あたりの試行回数の想定
export const ATTACK_SPEEDS = {
  offline: { label: "流出したデータを高性能なPCで解析（1秒に1兆回）", perSecond: 1e12 },
  online: { label: "ログイン画面から1回ずつ試す（1秒に10回）", perSecond: 10 },
};

// よく使われるパスワード（流出データの上位でよく見るもの）
const COMMON = new Set([
  "123456", "123456789", "12345678", "12345", "1234567", "1234567890", "111111", "000000",
  "123123", "654321", "666666", "112233", "121212", "123321", "1qaz2wsx", "qwerty",
  "qwerty123", "qwertyuiop", "asdfgh", "zxcvbnm", "password", "password1", "password123",
  "passw0rd", "p@ssw0rd", "abc123", "abcd1234", "iloveyou", "admin", "welcome", "letmein",
  "monkey", "dragon", "master", "sunshine", "princess", "football", "baseball", "superman",
  "pokemon", "naruto", "doraemon", "sakura", "hello", "test", "guest", "root", "aaaaaa",
]);

export function charsetSize(password) {
  let size = 0;
  if (/[a-z]/.test(password)) size += CHARSETS.lower.length;
  if (/[A-Z]/.test(password)) size += CHARSETS.upper.length;
  if (/[0-9]/.test(password)) size += CHARSETS.digit.length;
  if (/[!-/:-@[-`{-~]/.test(password)) size += CHARSETS.symbol.length;
  if (/[^\x21-\x7e]/.test(password)) size += OTHER_SIZE;
  return size;
}

export function entropyBits(password) {
  const length = [...password].length;
  const size = charsetSize(password);
  return length === 0 || size === 0 ? 0 : length * Math.log2(size);
}

/** 平均で破られるまでの秒数（全体の半分を試す） */
export function crackSeconds(bits, perSecond) {
  return 2 ** bits / 2 / perSecond;
}

const UNITS = [
  [60, "秒"],
  [60, "分"],
  [24, "時間"],
  [365.25, "日"],
];

/** 秒数を「3時間」「約120万年」のような日本語にする */
export function formatDuration(seconds) {
  if (!(seconds >= 1)) return "一瞬";
  let value = seconds;
  for (const [size, unit] of UNITS) {
    if (value < size) return `約${Math.floor(value)}${unit}`;
    value /= size;
  }
  // ここから単位は「年」
  const big = [[1e16, "京"], [1e12, "兆"], [1e8, "億"], [1e4, "万"]];
  if (value >= 1e20) return "1垓年以上";
  for (const [size, unit] of big) {
    if (value >= size) return `約${Math.floor(value / size).toLocaleString("ja-JP")}${unit}年`;
  }
  return `約${Math.floor(value)}年`;
}

function hasSequence(password, run = 4) {
  const s = password.toLowerCase();
  const rows = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop", "asdfghjkl", "zxcvbnm"];
  for (let i = 0; i + run <= s.length; i++) {
    const part = s.slice(i, i + run);
    const reversed = [...part].reverse().join("");
    if (rows.some((row) => row.includes(part) || row.includes(reversed))) return true;
  }
  return false;
}

/** 強さの判定と、総当たり以外の弱点の指摘 */
export function checkPassword(password) {
  const length = [...password].length;
  const warnings = [];
  const lower = password.toLowerCase();
  const common = COMMON.has(lower) || COMMON.has(lower.replace(/[0-9!@#$%^&*]+$/, ""));

  if (common) warnings.push("よく使われるパスワード（またはその末尾に数字や記号を足しただけ）です。総当たりより先に試されるので、すぐに破られます。");
  if (length > 0 && length < 12) warnings.push("12文字未満です。長さを増やすのが一番効果があります。");
  if (/(.)\1{2,}/u.test(password)) warnings.push("同じ文字が3回以上続いています。");
  if (hasSequence(password)) warnings.push("abcd・1234・qwerty のような並びが入っています。");
  if (/^[0-9]+$/.test(password)) warnings.push("数字だけです。");
  if (/(19|20)\d{2}(0[1-9]|1[0-2])?/.test(password)) warnings.push("西暦や誕生日のような数字が入っています。");

  const bits = common ? Math.min(entropyBits(password), 10) : entropyBits(password);
  let level;
  if (bits < 40) level = "weak";
  else if (bits < 60) level = "fair";
  else if (bits < 80) level = "strong";
  else level = "very-strong";
  if (warnings.length >= 2 && level !== "weak") level = level === "very-strong" ? "strong" : "fair";

  return { length, charsetSize: charsetSize(password), bits, common, level, warnings };
}

export const LEVEL_LABELS = {
  weak: "弱い",
  fair: "ふつう",
  strong: "強い",
  "very-strong": "とても強い",
};

/** 0 以上 max 未満の偏りのない整数（randomUint32 は 0〜2^32-1 を返す関数） */
function randomBelow(max, randomUint32) {
  const limit = 2 ** 32 - (2 ** 32 % max);
  let x;
  do x = randomUint32();
  while (x >= limit);
  return x % max;
}

export function cryptoRandomUint32() {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}

/**
 * パスワードを作る。選んだ文字の種類は必ず1文字以上入る。
 * sets: { lower, upper, digit, symbol } の true/false
 */
export function generatePassword(length, sets, { excludeAmbiguous = false, randomUint32 = cryptoRandomUint32 } = {}) {
  const groups = Object.keys(CHARSETS)
    .filter((key) => sets[key])
    .map((key) => [...CHARSETS[key]].filter((c) => !excludeAmbiguous || !AMBIGUOUS.includes(c)));
  if (groups.length === 0) throw new Error("文字の種類を1つ以上選んでください");
  if (!(length >= groups.length)) throw new Error(`長さは${groups.length}文字以上にしてください`);

  const pool = groups.flat();
  // 全体から一様に選び、選んだ種類が全部入っていなければ作り直す（偏りが出ない）
  for (;;) {
    const chars = Array.from({ length }, () => pool[randomBelow(pool.length, randomUint32)]);
    if (groups.every((g) => chars.some((c) => g.includes(c)))) return chars.join("");
  }
}
