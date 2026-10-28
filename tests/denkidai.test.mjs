import { test } from "node:test";
import assert from "node:assert/strict";

import { applianceCost, formatYen, totalCost } from "../src/lib/denkidai.js";

test("1000Wを1時間使うと31円（単価31円/kWh）", () => {
  const c = applianceCost({ watts: 1000, hoursPerDay: 1, daysPerMonth: 30 }, 31);
  assert.equal(c.perHour, 31);
  assert.equal(c.perDay, 31);
  assert.equal(c.perMonth, 930);
  assert.equal(c.perYear, 11160);
  assert.equal(c.kwhPerMonth, 30);
});

test("500Wのエアコンを8時間・30日", () => {
  const c = applianceCost({ watts: 500, hoursPerDay: 8, daysPerMonth: 30 }, 31);
  assert.equal(c.perDay, 124);
  assert.equal(c.perMonth, 3720);
});

test("単価を変えると比例して変わる", () => {
  const a = applianceCost({ watts: 100, hoursPerDay: 10 }, 30);
  const b = applianceCost({ watts: 100, hoursPerDay: 10 }, 45);
  assert.equal(b.perMonth / a.perMonth, 1.5);
});

test("おかしな入力は0扱い、時間は24時間まで", () => {
  assert.equal(applianceCost({ watts: "", hoursPerDay: 5 }).perMonth, 0);
  assert.equal(applianceCost({ watts: -100, hoursPerDay: 5 }).perMonth, 0);
  assert.equal(applianceCost({ watts: 1000, hoursPerDay: 30, daysPerMonth: 1 }, 10).perDay, 240);
});

test("複数台の合計", () => {
  const t = totalCost([
    { watts: 1000, hoursPerDay: 1, daysPerMonth: 30 },
    { watts: 500, hoursPerDay: 2, daysPerMonth: 30 },
  ], 31);
  assert.equal(t.perMonth, 1860);
  assert.equal(t.kwhPerMonth, 60);
});

test("円の表示", () => {
  assert.equal(formatYen(0.93), "0.9円");
  assert.equal(formatYen(3720), "3,720円");
  assert.equal(formatYen(11160.4), "11,160円");
});
