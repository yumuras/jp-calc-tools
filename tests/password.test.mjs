import { test } from "node:test";
import assert from "node:assert/strict";

import { CHARSETS, AMBIGUOUS, charsetSize, entropyBits, crackSeconds, formatDuration, checkPassword, generatePassword } from "../src/lib/password.js";

test("文字の種類の数", () => {
  assert.equal(charsetSize("abc"), 26);
  assert.equal(charsetSize("abcXYZ"), 52);
  assert.equal(charsetSize("aB3"), 62);
  assert.equal(charsetSize("aB3!"), 94);
  assert.equal(charsetSize(""), 0);
});

test("強さ（ビット）= 長さ × log2(種類)", () => {
  assert.equal(entropyBits("aaaaaaaa"), 8 * Math.log2(26));
  assert.equal(entropyBits(""), 0);
  assert.equal(entropyBits("ab"), 2 * Math.log2(26));
});

test("破られるまでの時間は全体の半分を試す平均", () => {
  assert.equal(crackSeconds(10, 1), 512);
});

test("時間の表示", () => {
  assert.equal(formatDuration(0.5), "一瞬");
  assert.equal(formatDuration(30), "約30秒");
  assert.equal(formatDuration(90), "約1分");
  assert.equal(formatDuration(3 * 3600), "約3時間");
  assert.equal(formatDuration(3 * 86400), "約3日");
  assert.equal(formatDuration(5 * 365.25 * 86400), "約5年");
  assert.equal(formatDuration(1.2e6 * 365.25 * 86400), "約120万年");
  assert.equal(formatDuration(3e8 * 365.25 * 86400), "約3億年");
  assert.equal(formatDuration(1e30 * 365.25 * 86400), "1垓年以上");
});

test("よく使われるパスワードは弱い", () => {
  for (const pw of ["password", "Password123", "qwerty", "123456789"]) {
    const r = checkPassword(pw);
    assert.equal(r.common, true, pw);
    assert.equal(r.level, "weak", pw);
  }
});

test("長いランダムな文字列は強い", () => {
  const r = checkPassword("t7#Kq9!vRm2$Lx8w");
  assert.equal(r.common, false);
  assert.equal(r.level, "very-strong");
  assert.deepEqual(r.warnings, []);
});

test("連続・繰り返し・短さを指摘する", () => {
  const r = checkPassword("aaaabcd1");
  assert.ok(r.warnings.some((w) => w.includes("12文字未満")));
  assert.ok(r.warnings.some((w) => w.includes("3回以上")));
  assert.ok(r.warnings.some((w) => w.includes("並び")));
});

// 決まった順に値を返す乱数（テスト用）
const seq = (values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

test("生成：長さどおりで、選んだ種類が必ず入る", () => {
  const sets = { lower: true, upper: true, digit: true, symbol: true };
  for (let n = 0; n < 200; n++) {
    const pw = generatePassword(12, sets);
    assert.equal(pw.length, 12);
    for (const key of Object.keys(CHARSETS)) assert.ok([...pw].some((c) => CHARSETS[key].includes(c)), `${key}: ${pw}`);
  }
});

test("生成：選ばなかった種類と紛らわしい文字は入らない", () => {
  for (let n = 0; n < 200; n++) {
    const pw = generatePassword(20, { lower: true, upper: true, digit: true, symbol: false }, { excludeAmbiguous: true });
    assert.match(pw, /^[a-zA-Z0-9]+$/);
    assert.ok(![...pw].some((c) => AMBIGUOUS.includes(c)), pw);
  }
});

test("生成：乱数の偏りを避けるため、上限を超える値は捨てる", () => {
  // 数字だけ（10種類）。2^32 - 6 以上は捨てられ、次の値が使われる
  const pw = generatePassword(2, { digit: true }, { randomUint32: seq([2 ** 32 - 1, 3, 7]) });
  assert.equal(pw, "37");
});

test("生成：種類が足りないときは作り直す", () => {
  // 1回目は小文字だけ（0,0）→ 作り直し → 小文字 + 数字
  const pw = generatePassword(2, { lower: true, digit: true }, { randomUint32: seq([0, 0, 0, 26]) });
  assert.equal(pw, "a0");
});

test("生成：不正な指定はエラー", () => {
  assert.throws(() => generatePassword(10, {}));
  assert.throws(() => generatePassword(1, { lower: true, digit: true }));
});

test("ブラウザ用の乱数で動く", () => {
  assert.equal(generatePassword(16, { lower: true }).length, 16);
});
