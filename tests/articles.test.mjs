import { test } from "node:test";
import assert from "node:assert/strict";

import { hourlyTable } from "../src/lib/kyuyo.js";
import { GRANT_TABLE, fiveDayDutyStartYears, formatYears } from "../src/lib/yukyu.js";
import { PRESETS, applianceCost } from "../src/lib/denkidai.js";

// 解説記事の早見表はビルド時にこれらの関数から作る。代表値をここで確かめる。

test("時給1,200円・1日8時間・週5日 → 月208,000円・年2,496,000円", () => {
  const [r] = hourlyTable([1200], { hoursPerDay: 8, daysList: [3, 4, 5] });
  assert.equal(Math.round(r.monthly[5]), 208000);
  assert.equal(Math.round(r.annual[5]), 2496000);
  assert.equal(Math.round(r.monthly[3]), 124800);
});

test("時給1,000円・1日6時間・週4日 → 月104,000円", () => {
  const [r] = hourlyTable([1000], { hoursPerDay: 6, daysList: [4] });
  assert.equal(Math.round(r.monthly[4]), 104000);
});

test("年5日の取得義務が始まる勤続年数", () => {
  assert.equal(fiveDayDutyStartYears("full"), 0.5);
  assert.equal(fiveDayDutyStartYears("w4"), 3.5);
  assert.equal(fiveDayDutyStartYears("w3"), 5.5);
  assert.equal(fiveDayDutyStartYears("w2"), null);
  assert.equal(fiveDayDutyStartYears("w1"), null);
});

test("勤続年数の表示", () => {
  assert.equal(formatYears(0.5), "6か月");
  assert.equal(formatYears(3.5), "3年6か月");
  assert.equal(GRANT_TABLE.w3[0], 5);
});

test("冷蔵庫（35W・24時間）は1か月約781円", () => {
  const p = PRESETS.find((x) => x.name.startsWith("冷蔵庫"));
  const c = applianceCost({ watts: p.watts, hoursPerDay: p.hours, daysPerMonth: 30 });
  assert.equal(Math.round(c.perMonth), 781);
});
