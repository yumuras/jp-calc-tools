import { test } from "node:test";
import assert from "node:assert/strict";

import { formatPercent, formatYen, maxPriceForYield, yields } from "../assets/rimawari.js";

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("2,000万円・家賃10万円なら表面利回り6%", () => {
  const r = yields({ price: 20_000_000, monthlyRent: 100_000 });
  assert.equal(r.annualRent, 1_200_000);
  close(r.grossYield, 0.06);
  close(r.netYield, 0.06);
});

test("実質利回りは空室・経費・諸費用を引く", () => {
  const r = yields({
    price: 20_000_000,
    purchaseCosts: 1_500_000,
    monthlyRent: 100_000,
    annualExpenses: 300_000,
    vacancyRate: 5,
  });
  // 120万 × 0.95 − 30万 = 84万、84万 ÷ 2,150万
  close(r.netIncome, 840_000);
  close(r.netYield, 840_000 / 21_500_000);
  close(r.grossYield, 0.06);
});

test("経費が家賃を上回ると手残りはマイナス", () => {
  const r = yields({ price: 10_000_000, monthlyRent: 10_000, annualExpenses: 200_000 });
  assert.equal(r.netIncome, -80_000);
  assert.ok(r.netYield < 0);
});

test("物件価格が0や空なら null", () => {
  assert.equal(yields({ price: 0, monthlyRent: 100_000 }), null);
  assert.equal(yields({ price: "", monthlyRent: 100_000 }), null);
});

test("空室率は100%まで", () => {
  const r = yields({ price: 10_000_000, monthlyRent: 50_000, vacancyRate: 150 });
  assert.equal(r.netIncome, 0);
});

test("家賃10万円で表面6%なら上限2,000万円", () => {
  close(maxPriceForYield(100_000, 6), 20_000_000);
  assert.equal(maxPriceForYield(100_000, 0), null);
});

test("表示の形式", () => {
  assert.equal(formatYen(20_000_000), "2,000万円");
  assert.equal(formatYen(840_000), "84万円");
  assert.equal(formatYen(-80_000), "−8万円");
  assert.equal(formatYen(9_800), "9,800円");
  assert.equal(formatYen(1_234_567), "123.5万円");
  assert.equal(formatPercent(0.06), "6.00%");
});
