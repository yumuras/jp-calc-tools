// 時給・日給・月給・年収の換算（すべて額面）。
// 月の労働時間 = 1日の時間 × 週の日数 × 52週 ÷ 12
// 年収 = 月給 × (12 + 賞与の月数)

export const UNITS = {
  hourly: "時給",
  daily: "日給",
  monthly: "月給",
  annual: "年収",
};

export function monthlyHours(hoursPerDay, daysPerWeek) {
  return (hoursPerDay * daysPerWeek * 52) / 12;
}

/**
 * amount（unit の金額）から、時給・日給・月給・年収をすべて求める。
 * 条件が不正（時間や日数が0以下）なら null。
 */
export function convertPay(amount, unit, { hoursPerDay = 8, daysPerWeek = 5, bonusMonths = 0 } = {}) {
  const value = Number(amount);
  const h = Number(hoursPerDay);
  const d = Number(daysPerWeek);
  const bonus = Math.max(0, Number(bonusMonths) || 0);
  if (!(value >= 0) || !(h > 0) || !(d > 0) || h > 24 || d > 7) return null;

  const mh = monthlyHours(h, d);
  const toHourly = {
    hourly: (v) => v,
    daily: (v) => v / h,
    monthly: (v) => v / mh,
    annual: (v) => v / (12 + bonus) / mh,
  }[unit];
  if (!toHourly) throw new Error(`unknown unit: ${unit}`);

  const hourly = toHourly(value);
  const monthly = hourly * mh;
  return {
    hourly,
    daily: hourly * h,
    monthly,
    annual: monthly * (12 + bonus),
    monthlyHours: mh,
    annualHours: mh * 12,
  };
}

export function formatYen(yen) {
  return `${Math.round(yen).toLocaleString("ja-JP")}円`;
}
