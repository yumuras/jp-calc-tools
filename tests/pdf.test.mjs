import { test } from "node:test";
import assert from "node:assert/strict";

import { PDFDocument } from "../assets/vendor/pdf-lib.esm.min.js";
import { extractPages, mergePdfs, pageCountOf, parsePageRanges, splitEachPage } from "../assets/pdf.js";

// 幅でページを見分けられるテスト用PDF（幅 = 100 + ページ番号）
async function makePdf(count, offset = 0) {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= count; i++) doc.addPage([100 + offset + i, 200]);
  return doc.save();
}
async function widths(bytes) {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p) => p.getWidth());
}

test("ページ指定：範囲・単独・最後まで", () => {
  assert.deepEqual(parsePageRanges("1-3, 5", 10), [0, 1, 2, 4]);
  assert.deepEqual(parsePageRanges("8-", 10), [7, 8, 9]);
  assert.deepEqual(parsePageRanges("3,1", 5), [2, 0]);
});

test("ページ指定：全角・読点・波ダッシュも読める", () => {
  assert.deepEqual(parsePageRanges("１〜２、４", 5), [0, 1, 3]);
  assert.deepEqual(parsePageRanges(" 2 - 3 ", 5), [1, 2]);
});

test("ページ指定：範囲外や読めない指定はエラー", () => {
  assert.throws(() => parsePageRanges("0", 5), /範囲外/);
  assert.throws(() => parsePageRanges("4-6", 5), /範囲外/);
  assert.throws(() => parsePageRanges("3-1", 5), /範囲外/);
  assert.throws(() => parsePageRanges("a", 5), /読み取れません/);
  assert.throws(() => parsePageRanges("", 5), /指定してください/);
});

test("結合：渡した順にページが並ぶ", async () => {
  const a = await makePdf(2, 0);
  const b = await makePdf(3, 10);
  const merged = await mergePdfs([{ name: "a.pdf", bytes: a }, { name: "b.pdf", bytes: b }]);
  assert.deepEqual(await widths(merged), [101, 102, 111, 112, 113]);
  assert.equal(await pageCountOf(merged), 5);
});

test("抜き出し：指定したページだけ、その順で", async () => {
  const src = await makePdf(5);
  const out = await extractPages(src, parsePageRanges("4, 1-2", 5));
  assert.deepEqual(await widths(out), [104, 101, 102]);
});

test("分割：1ページずつのPDFになる", async () => {
  const parts = await splitEachPage(await makePdf(3));
  assert.equal(parts.length, 3);
  assert.deepEqual(await widths(parts[2]), [103]);
});

test("PDFでないファイルは分かりやすいエラー", async () => {
  await assert.rejects(pageCountOf(new TextEncoder().encode("hello"), "memo.txt"), /「memo.txt」はPDFとして読み込めませんでした/);
});

test("パスワード付きPDFは扱えないと伝える", async () => {
  const doc = await PDFDocument.create();
  doc.addPage();
  const text = Buffer.from(await doc.save({ useObjectStreams: false })).toString("latin1");
  const encrypted = Buffer.from(text.replace("trailer\n<<", "trailer\n<<\n/Encrypt 1 0 R"), "latin1");
  await assert.rejects(pageCountOf(encrypted, "secret.pdf"), /パスワードで保護/);
});
