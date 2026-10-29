import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { DEFAULT_PRICE, applianceCost } from "../assets/denkidai.js";

// 記事の比較表（1日8時間・30日）が電気代ツールと同じ計算になっているか
const html = readFileSync(new URL("../denkidai/danbou/index.html", import.meta.url), "utf8");
const rows = [...html.matchAll(/<tr data-watts="(\d+)"><td>[^<]+<\/td><td>([\d,]+)W<\/td><td>([\d.]+)円<\/td><td>([\d,]+)円<\/td>/g)];

test("比較表に7行ある", () => {
  assert.equal(rows.length, 7);
});

test("比較表の1時間・1か月が計算と一致する", () => {
  for (const [, watts, shown, perHour, perMonth] of rows) {
    const c = applianceCost({ watts, hoursPerDay: 8, daysPerMonth: 30 }, DEFAULT_PRICE);
    assert.equal(shown.replace(/,/g, ""), watts);
    assert.equal(perHour, c.perHour.toFixed(1), `${watts}W の1時間`);
    assert.equal(perMonth, Math.round(c.perMonth).toLocaleString("ja-JP"), `${watts}W の1か月`);
  }
});
