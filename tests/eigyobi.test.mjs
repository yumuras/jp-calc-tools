import { test } from "node:test";
import assert from "node:assert/strict";

import { addBusinessDays, countBusinessDays, isBusinessDay } from "../src/lib/eigyobi.js";

const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

test("金曜の1営業日後は月曜", () => {
  assert.equal(ymd(addBusinessDays(new Date(2026, 9, 16), 1).date), "2026-10-19");
});

test("0営業日後は基準日のまま", () => {
  assert.equal(ymd(addBusinessDays(new Date(2026, 9, 21), 0).date), "2026-10-21");
});

test("シルバーウィークをまたぐ：9/18(金)の1営業日後は9/24(木)", () => {
  const r = addBusinessDays(new Date(2026, 8, 18), 1);
  assert.equal(ymd(r.date), "2026-9-24");
  assert.deepEqual(r.skipped.map((s) => s.reason), ["敬老の日", "国民の休日", "秋分の日"]);
});

test("営業日前：5/7(木)の1営業日前はゴールデンウィーク前の5/1(金)", () => {
  assert.equal(ymd(addBusinessDays(new Date(2026, 4, 7), -1).date), "2026-5-1");
});

test("年末年始を休みにするかどうか", () => {
  const start = new Date(2026, 11, 28); // 月曜
  assert.equal(ymd(addBusinessDays(start, 1).date), "2026-12-29");
  assert.equal(ymd(addBusinessDays(start, 1, { yearEnd: true }).date), "2027-1-4");
  assert.equal(isBusinessDay(new Date(2026, 11, 30), { yearEnd: true }), false);
});

test("期間の営業日数：2026年10月は21営業日（スポーツの日を除く）", () => {
  const r = countBusinessDays(new Date(2026, 9, 1), new Date(2026, 9, 31));
  assert.equal(r.businessDays, 21);
  assert.equal(r.calendarDays, 31);
  assert.deepEqual(r.holidays.map((h) => h.reason), ["スポーツの日"]);
});

test("開始日を含めない・日付が逆順でも数えられる", () => {
  const r = countBusinessDays(new Date(2026, 9, 23), new Date(2026, 9, 19), { excludeStart: true });
  assert.equal(r.businessDays, 4); // 10/20〜10/23
});
