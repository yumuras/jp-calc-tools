// 家電の電気代。電気代 = 消費電力(kW) × 使用時間(h) × 単価(円/kWh)

// 全国家庭電気製品公正取引協議会の目安単価（税込）
export const DEFAULT_PRICE = 31;

// よく使う家電の目安。W は使っている間の平均的な消費電力で、機種や使い方で大きく変わる
export const PRESETS = [
  { name: "エアコン（冷房・6畳）", watts: 500, hours: 8 },
  { name: "エアコン（暖房・6畳）", watts: 700, hours: 8 },
  { name: "冷蔵庫（400L前後）", watts: 35, hours: 24 },
  { name: "テレビ（50型液晶）", watts: 150, hours: 4 },
  { name: "LED照明（シーリング）", watts: 40, hours: 6 },
  { name: "電子レンジ", watts: 1000, hours: 0.2 },
  { name: "電気ケトル", watts: 1250, hours: 0.1 },
  { name: "炊飯器（炊飯）", watts: 700, hours: 0.5 },
  { name: "ドライヤー", watts: 1200, hours: 0.17 },
  { name: "ノートパソコン", watts: 30, hours: 8 },
  { name: "デスクトップパソコン", watts: 150, hours: 6 },
  { name: "こたつ", watts: 200, hours: 5 },
  { name: "ホットカーペット（2畳）", watts: 200, hours: 6 },
  { name: "扇風機", watts: 30, hours: 8 },
];

/** 1台分の電気代（円）。数値でない・負の入力は 0 として扱う。 */
export function applianceCost({ watts, hoursPerDay, daysPerMonth = 30 }, pricePerKwh = DEFAULT_PRICE) {
  const w = Math.max(0, Number(watts) || 0);
  const h = Math.min(24, Math.max(0, Number(hoursPerDay) || 0));
  const days = Math.min(31, Math.max(0, Number(daysPerMonth) || 0));
  const price = Math.max(0, Number(pricePerKwh) || 0);
  const perHour = (w / 1000) * price;
  const perDay = perHour * h;
  const perMonth = perDay * days;
  return { perHour, perDay, perMonth, perYear: perMonth * 12, kwhPerMonth: (w / 1000) * h * days };
}

/** 複数台の合計（月・年・kWh）。 */
export function totalCost(appliances, pricePerKwh = DEFAULT_PRICE) {
  return appliances
    .map((a) => applianceCost(a, pricePerKwh))
    .reduce(
      (sum, c) => ({
        perMonth: sum.perMonth + c.perMonth,
        perYear: sum.perYear + c.perYear,
        kwhPerMonth: sum.kwhPerMonth + c.kwhPerMonth,
      }),
      { perMonth: 0, perYear: 0, kwhPerMonth: 0 },
    );
}

/** 表示用の円。1円未満は小数1桁、それ以上は整数で3桁区切り。 */
export function formatYen(yen) {
  if (yen < 1) return `${yen.toFixed(1)}円`;
  return `${Math.round(yen).toLocaleString("ja-JP")}円`;
}
