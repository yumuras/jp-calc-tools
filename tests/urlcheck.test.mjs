import { test } from "node:test";
import assert from "node:assert/strict";

import { checkUrl, extractUrl, registrableDomain, toUnicodeHost } from "../src/lib/urlcheck.js";

const titles = (r) => r.findings.map((f) => `${f.level}:${f.title}`);

test("SMSの文面からURLを取り出す", () => {
  assert.equal(extractUrl("お荷物をお届けにあがりました。https://example.top/a?b=1 をご確認ください。").raw, "https://example.top/a?b=1");
  assert.equal(extractUrl("（https://example.com/x）").raw, "https://example.com/x");
  assert.deepEqual(extractUrl("詳しくは amazon-check.xyz/login へ"), { raw: "amazon-check.xyz/login", hadScheme: false });
  assert.equal(extractUrl("hxxps://evil.example/path").raw, "https://evil.example/path");
  assert.equal(extractUrl("URLはありません"), null);
});

test("登録ドメイン", () => {
  assert.equal(registrableDomain("www.amazon.co.jp"), "amazon.co.jp");
  assert.equal(registrableDomain("amazon.co.jp.secure-login.com"), "secure-login.com");
  assert.equal(registrableDomain("a.b.example.com"), "example.com");
  assert.equal(registrableDomain("192.168.0.1"), "192.168.0.1");
});

test("punycode を戻す", () => {
  assert.equal(toUnicodeHost("xn--wgv71a119e.jp"), "日本語.jp");
  assert.equal(toUnicodeHost(new URL("https://аmazon.com").hostname), "аmazon.com");
  assert.equal(toUnicodeHost("example.com"), "example.com");
});

test("公式ドメインは危険と判定しない", () => {
  for (const u of ["https://www.amazon.co.jp/gp/css/order-history", "https://www.rakuten.co.jp/", "https://www.kuronekoyamato.co.jp/", "https://jp-bank.japanpost.jp/"]) {
    const r = checkUrl(u);
    assert.equal(r.verdict, "none", `${u}: ${titles(r)}`);
  }
});

test("サブドメインに企業名を入れた偽装", () => {
  const r = checkUrl("https://amazon.co.jp.account-verify.com/login");
  assert.equal(r.verdict, "danger");
  assert.equal(r.domain, "account-verify.com");
  assert.ok(titles(r).some((t) => t.includes("Amazonの名前")));
});

test("「@」の前に企業名を書いた偽装", () => {
  const r = checkUrl("https://www.amazon.co.jp@evil.example/login");
  assert.equal(r.host, "evil.example");
  assert.ok(titles(r).some((t) => t.startsWith("danger:「@」")));
});

test("キリル文字の混在", () => {
  const r = checkUrl("https://аmazon.com/"); // 先頭の а はキリル文字
  assert.equal(r.verdict, "danger");
  assert.ok(titles(r).some((t) => t.includes("そっくりな別の文字")));
});

test("似せた綴り（0とo、rnとm）", () => {
  assert.ok(titles(checkUrl("https://amaz0n-jp.com")).some((t) => t.includes("似せた綴り")));
  assert.ok(titles(checkUrl("https://arnazon.co.jp")).some((t) => t.includes("似せた綴り")));
});

test("IPアドレス・http・ポート", () => {
  const r = checkUrl("http://203.0.113.5:8080/sagawa");
  assert.equal(r.verdict, "danger");
  const t = titles(r).join("\n");
  assert.match(t, /IPアドレス/);
  assert.match(t, /http/);
  assert.match(t, /8080/);
});

test("短縮URLと怪しい末尾は注意", () => {
  assert.equal(checkUrl("https://bit.ly/abc123").verdict, "warn");
  const r = checkUrl("https://delivery-info.top/");
  assert.equal(r.verdict, "warn");
  assert.ok(titles(r).some((t) => t.includes(".top")));
});

test("スキームなしなら http の指摘はしない", () => {
  const r = checkUrl("example.com");
  assert.equal(r.verdict, "none");
});

test("URLがなければ null", () => {
  assert.equal(checkUrl("こんにちは"), null);
  assert.equal(checkUrl(""), null);
});
