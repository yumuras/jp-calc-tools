import { test } from "node:test";
import assert from "node:assert/strict";

import { addMonthsElapsed, classifyWorkType, grantSchedule, parseDate, statusOn } from "../src/lib/yukyu.js";

const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

test("6か月経過した日: 応当日がある場合", () => {
  assert.equal(ymd(addMonthsElapsed(new Date(2026, 3, 1), 6)), "2026-10-1");
});

test("6か月経過した日: 応当日がない場合は翌月1日", () => {
  assert.equal(ymd(addMonthsElapsed(new Date(2026, 7, 31), 6)), "2027-3-1");
});

test("年をまたぐ", () => {
  assert.equal(ymd(addMonthsElapsed(new Date(2026, 9, 15), 6)), "2027-4-15");
});

test("通常の労働者の付与日数", () => {
  const days = grantSchedule(new Date(2026, 3, 1), "full", 8).map((r) => r.days);
  assert.deepEqual(days, [10, 11, 12, 14, 16, 18, 20, 20]);
});

test("週3日の比例付与", () => {
  const days = grantSchedule(new Date(2026, 3, 1), "w3", 7).map((r) => r.days);
  assert.deepEqual(days, [5, 6, 6, 8, 9, 10, 11]);
});

test("入社前・6か月未満はまだ付与なし", () => {
  const s = statusOn(new Date(2026, 3, 1), "full", new Date(2026, 8, 30));
  assert.equal(s.lastGrant, null);
  assert.equal(s.nextGrant.days, 10);
  assert.equal(ymd(s.nextGrant.date), "2026-10-1");
  assert.equal(s.maxBalance, 0);
  assert.equal(s.fiveDayDuty, false);
});

test("付与日当日は付与済みとして数える", () => {
  const s = statusOn(new Date(2026, 3, 1), "full", new Date(2026, 9, 1));
  assert.equal(s.lastGrant.days, 10);
  assert.equal(s.nextGrant.days, 11);
});

test("最大保有日数は直近2回分（時効2年）", () => {
  const s = statusOn(new Date(2020, 3, 1), "full", new Date(2026, 9, 21));
  // 2025/10/1 に18日、2026/10/1 に20日
  assert.equal(s.lastGrant.days, 20);
  assert.equal(s.maxBalance, 38);
  assert.equal(s.fiveDayDuty, true);
  assert.equal(ymd(s.fiveDayDeadline), "2027-10-1");
});

test("週2日は10日未満なので5日取得義務の対象外", () => {
  const s = statusOn(new Date(2010, 3, 1), "w2", new Date(2026, 9, 21));
  assert.equal(s.lastGrant.days, 7);
  assert.equal(s.fiveDayDuty, false);
});

test("週4日は3年半で10日になり義務の対象", () => {
  const s = statusOn(new Date(2020, 3, 1), "w4", new Date(2024, 0, 1));
  assert.equal(s.lastGrant.days, 10);
  assert.equal(s.fiveDayDuty, true);
});

test("日付の読み取り", () => {
  assert.equal(ymd(parseDate("2026-04-01")), "2026-4-1");
  assert.equal(parseDate("2026-02-30"), null);
  assert.equal(parseDate("abc"), null);
});

test("働き方の判定: 週30時間以上なら日数が少なくても通常付与", () => {
  assert.equal(classifyWorkType(4, 32), "full");
  assert.equal(classifyWorkType(5, 20), "full");
  assert.equal(classifyWorkType(3, 18), "w3");
  assert.equal(classifyWorkType(1, 4), "w1");
  assert.equal(classifyWorkType(0, 0), null);
});
