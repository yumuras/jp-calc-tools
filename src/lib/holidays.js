// 日本の祝日（国民の祝日に関する法律）を計算で求める。対応範囲は 2020〜2099 年。
// 祝日のデータを年ごとに持たず規則から出すので、法改正がない限り更新は不要。
// 法改正や特例があったら EXCEPTIONS に足し、tests/holidays.test.mjs で確認する。

export const MIN_YEAR = 2020;
export const MAX_YEAR = 2099;

// 東京オリンピック特措法で移動した祝日（年 → 名前 → [月, 日]）
const EXCEPTIONS = {
  2020: { 海の日: [7, 23], スポーツの日: [7, 24], 山の日: [8, 10] },
  2021: { 海の日: [7, 22], スポーツの日: [7, 23], 山の日: [8, 8] },
};

const key = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function dateKey(date) {
  return key(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** m月の第n月曜日 */
function nthMonday(year, month, n) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const firstMonday = 1 + ((8 - firstDow) % 7);
  return firstMonday + 7 * (n - 1);
}

// 春分・秋分の日は国立天文台の暦要項で決まる。1980〜2099年はこの近似式で一致する。
function vernalEquinox(year) {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function autumnalEquinox(year) {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

const cache = new Map();

/** その年の祝日・休日の一覧（"YYYY-MM-DD" → 名前）。 */
export function holidaysOf(year) {
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError(`${MIN_YEAR}〜${MAX_YEAR}年のみ対応しています`);
  }
  if (cache.has(year)) return cache.get(year);

  const base = [
    ["元日", 1, 1],
    ["成人の日", 1, nthMonday(year, 1, 2)],
    ["建国記念の日", 2, 11],
    ["天皇誕生日", 2, 23],
    ["春分の日", 3, vernalEquinox(year)],
    ["昭和の日", 4, 29],
    ["憲法記念日", 5, 3],
    ["みどりの日", 5, 4],
    ["こどもの日", 5, 5],
    ["海の日", 7, nthMonday(year, 7, 3)],
    ["山の日", 8, 11],
    ["敬老の日", 9, nthMonday(year, 9, 3)],
    ["秋分の日", 9, autumnalEquinox(year)],
    ["スポーツの日", 10, nthMonday(year, 10, 2)],
    ["文化の日", 11, 3],
    ["勤労感謝の日", 11, 23],
  ];

  const result = new Map();
  for (const [name, month, day] of base) {
    const [m, d] = EXCEPTIONS[year]?.[name] ?? [month, day];
    result.set(key(year, m, d), name);
  }

  // 国民の休日：前日と翌日が祝日に挟まれた平日
  const holidayDates = [...result.keys()].map((k) => new Date(`${k}T00:00:00`));
  for (const date of holidayDates) {
    const between = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const after = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2);
    if (!result.has(dateKey(between)) && result.has(dateKey(after)) && between.getDay() !== 0) {
      result.set(dateKey(between), "国民の休日");
    }
  }

  // 振替休日：祝日が日曜なら、その後の最初の祝日でない日
  for (const date of holidayDates) {
    if (date.getDay() !== 0) continue;
    const d = new Date(date);
    do {
      d.setDate(d.getDate() + 1);
    } while (result.has(dateKey(d)));
    result.set(dateKey(d), "振替休日");
  }

  const sorted = new Map([...result.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
  cache.set(year, sorted);
  return sorted;
}

/** 祝日・休日ならその名前、そうでなければ null。 */
export function holidayName(date) {
  return holidaysOf(date.getFullYear()).get(dateKey(date)) ?? null;
}
