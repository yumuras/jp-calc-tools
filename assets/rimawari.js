// 不動産投資の利回り。金額はすべて円。
// 表面利回り = 年間家賃 ÷ 物件価格
// 実質利回り = (年間家賃 × (1 − 空室率) − 年間経費) ÷ (物件価格 + 購入時の諸費用)

const num = (v) => Math.max(0, Number(v) || 0);

/** 利回りと年間の手残り家賃。物件価格が0以下なら null。 */
export function yields({ price, purchaseCosts = 0, monthlyRent, annualExpenses = 0, vacancyRate = 0 }) {
  const p = num(price);
  if (!(p > 0)) return null;
  const costs = num(purchaseCosts);
  const vacancy = Math.min(100, num(vacancyRate)) / 100;
  const annualRent = num(monthlyRent) * 12;
  const netIncome = annualRent * (1 - vacancy) - num(annualExpenses);
  return {
    annualRent,
    netIncome,
    grossYield: annualRent / p,
    netYield: netIncome / (p + costs),
  };
}

/** 目標の表面利回り（%）で買える物件価格の上限。目標が0以下なら null。 */
export function maxPriceForYield(monthlyRent, targetYieldPercent) {
  const target = Number(targetYieldPercent);
  if (!(target > 0)) return null;
  return (num(monthlyRent) * 12) / (target / 100);
}

/** 表示用の円。1万円以上は「○万円」（小数1桁まで）。 */
export function formatYen(yen) {
  const sign = yen < 0 ? "−" : "";
  const abs = Math.abs(yen);
  if (abs >= 10000) return `${sign}${(Math.round(abs / 1000) / 10).toLocaleString("ja-JP")}万円`;
  return `${sign}${Math.round(abs).toLocaleString("ja-JP")}円`;
}

/** 表示用の利回り（%、小数2桁）。 */
export function formatPercent(ratio) {
  return `${(ratio * 100).toFixed(2)}%`;
}
