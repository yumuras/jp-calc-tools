import { test } from "node:test";
import assert from "node:assert/strict";

import { holidaysOf, holidayName } from "../assets/holidays.js";

test("2026年の祝日・休日（内閣府の一覧と同じ18日）", () => {
  assert.deepEqual([...holidaysOf(2026).keys()], [
    "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20", "2026-04-29",
    "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-07-20", "2026-08-11",
    "2026-09-21", "2026-09-22", "2026-09-23", "2026-10-12", "2026-11-03", "2026-11-23",
  ]);
});

test("振替休日：憲法記念日が日曜だと、祝日が続いた後の5/6が休み", () => {
  assert.equal(holidayName(new Date(2026, 4, 6)), "振替休日");
});

test("国民の休日：敬老の日と秋分の日に挟まれた日", () => {
  assert.equal(holidayName(new Date(2026, 8, 22)), "国民の休日");
});

test("オリンピック特例（2021年）", () => {
  assert.equal(holidayName(new Date(2021, 6, 22)), "海の日");
  assert.equal(holidayName(new Date(2021, 6, 23)), "スポーツの日");
  assert.equal(holidayName(new Date(2021, 7, 8)), "山の日");
  assert.equal(holidayName(new Date(2021, 7, 9)), "振替休日");
  assert.equal(holidayName(new Date(2021, 9, 11)), null);
});

test("春分・秋分の日", () => {
  assert.equal(holidayName(new Date(2027, 2, 21)), "春分の日");
  assert.equal(holidayName(new Date(2027, 8, 23)), "秋分の日");
});

test("対応範囲外の年はエラー", () => {
  assert.throws(() => holidaysOf(2019), RangeError);
});
