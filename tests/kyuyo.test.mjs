import { test } from "node:test";
import assert from "node:assert/strict";

import { convertPay, formatYen, monthlyHours } from "../src/lib/kyuyo.js";

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test("月の労働時間：8時間×週5日は約173.3時間", () => {
  close(monthlyHours(8, 5), 2080 / 12);
});

test("時給1,500円・8時間・週5日", () => {
  const r = convertPay(1500, "hourly");
  assert.equal(r.daily, 12000);
  close(r.monthly, 260000);
  close(r.annual, 3120000);
  close(r.annualHours, 2080);
});

test("年収から戻すと元の時給になる", () => {
  const r = convertPay(3120000, "annual");
  close(r.hourly, 1500);
});

test("賞与4か月分：年収480万円なら月給30万円", () => {
  const r = convertPay(4800000, "annual", { bonusMonths: 4 });
  close(r.monthly, 300000);
  const back = convertPay(300000, "monthly", { bonusMonths: 4 });
  close(back.annual, 4800000);
});

test("パート：時給1,100円・5時間・週3日", () => {
  const r = convertPay(1100, "hourly", { hoursPerDay: 5, daysPerWeek: 3 });
  assert.equal(r.daily, 5500);
  close(r.monthly, 71500);
  close(r.annual, 858000);
});

test("日給から換算", () => {
  const r = convertPay(10000, "daily", { hoursPerDay: 8 });
  assert.equal(r.hourly, 1250);
});

test("不正な条件は null", () => {
  assert.equal(convertPay(1000, "hourly", { hoursPerDay: 0 }), null);
  assert.equal(convertPay(1000, "hourly", { daysPerWeek: 8 }), null);
  assert.equal(convertPay("", "hourly").hourly, 0); // 空欄は0円として扱う
  assert.equal(convertPay(-1, "hourly"), null);
});

test("円の表示", () => {
  assert.equal(formatYen(1500.4), "1,500円");
  assert.equal(formatYen(3120000), "3,120,000円");
});
