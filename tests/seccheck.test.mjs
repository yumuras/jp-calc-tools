import { test } from "node:test";
import assert from "node:assert/strict";

import { parseBrowser, expectedVersion, parseOs, classifyCandidates, evaluate, score, grade } from "../assets/seccheck.js";

const UA = {
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0",
  safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
  chromeIos: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1",
  samsung: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
  oldWin: "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
};

test("ブラウザの判定", () => {
  assert.deepEqual(parseBrowser(UA.chrome), { name: "chrome", version: 141, cadence: "chrome" });
  assert.deepEqual(parseBrowser(UA.edge), { name: "edge", version: 141, cadence: "chrome" });
  assert.deepEqual(parseBrowser(UA.firefox), { name: "firefox", version: 144, cadence: "firefox" });
  assert.deepEqual(parseBrowser(UA.safariMac), { name: "safari", version: 26, cadence: "safari" });
  assert.deepEqual(parseBrowser(UA.safariIphone), { name: "safari", version: 26, cadence: "safari" });
  assert.deepEqual(parseBrowser(UA.chromeIos), { name: "chrome", version: 141, cadence: "chrome" });
  assert.equal(parseBrowser(UA.samsung).name, "samsung");
  assert.equal(parseBrowser("curl/8.0").name, "other");
});

test("期待バージョンはリリース周期から計算する", () => {
  assert.equal(expectedVersion("chrome", new Date("2025-09-30T00:00:00Z")), 141);
  assert.equal(expectedVersion("chrome", new Date("2025-11-01T00:00:00Z")), 142);
  assert.equal(expectedVersion("chrome", new Date("2026-10-28T00:00:00Z")), 153);
  assert.equal(expectedVersion("firefox", new Date("2025-11-12T00:00:00Z")), 145);
  assert.equal(expectedVersion("safari", new Date("2026-09-20T00:00:00Z")), 27);
  assert.equal(expectedVersion("safari", new Date("2026-03-01T00:00:00Z")), 26);
  assert.equal(expectedVersion("unknown", new Date()), null);
});

test("OSの判定とサポート切れ", () => {
  assert.deepEqual(parseOs(UA.chrome), { name: "Windows 10/11", unsupported: false });
  assert.deepEqual(parseOs(UA.oldWin), { name: "Windows 7", unsupported: true });
  assert.equal(parseOs(UA.safariIphone).name, "iOS");
  assert.equal(parseOs(UA.safariMac).name, "macOS");
  assert.equal(parseOs(UA.samsung).name, "Android");
});

test("WebRTC：.local なら隠れている、IPがそのままなら見えている", () => {
  assert.deepEqual(classifyCandidates(["candidate:1 1 udp 2113937151 3f9a2b1c-1234-4cde-8f00-123456789abc.local 54321 typ host generation 0"]), { status: "masked", addresses: [] });
  assert.deepEqual(classifyCandidates(["a=candidate:1 1 udp 2113937151 192.168.1.23 54321 typ host"]), { status: "exposed", addresses: ["192.168.1.23"] });
  assert.equal(classifyCandidates(["candidate:2 1 udp 2113937151 fe80::1 5000 typ host"]).status, "exposed");
  assert.deepEqual(classifyCandidates([]), { status: "none", addresses: [] });
});

const env = (ua, extra = {}) => ({ userAgent: ua, protocol: "https:", isSecureContext: true, webrtc: { status: "masked", addresses: [] }, ...extra });
const now = new Date("2025-10-28T00:00:00Z"); // Chrome の期待版は 141、Firefox は 144

test("最新のブラウザ・HTTPS なら満点", () => {
  const items = evaluate(env(UA.chrome), now);
  assert.ok(items.every((i) => i.status === "pass"), JSON.stringify(items));
  assert.equal(score(items), 100);
  assert.equal(grade(100).label, "とても安全");
});

test("古いブラウザと古いOSは減点", () => {
  const items = evaluate(env(UA.oldWin), now);
  const byId = Object.fromEntries(items.map((i) => [i.id, i.status]));
  assert.equal(byId.browser, "fail");
  assert.equal(byId.os, "fail");
  assert.equal(score(items), 40);
  assert.equal(grade(40).level, "danger");
});

test("少し古いブラウザは注意", () => {
  const ua = UA.chrome.replace("Chrome/141", "Chrome/135");
  assert.equal(evaluate(env(ua), now).find((i) => i.id === "browser").status, "warn");
});

test("HTTP と IP 漏れ", () => {
  const items = evaluate(env(UA.chrome, { protocol: "http:", isSecureContext: false, webrtc: { status: "exposed", addresses: ["10.0.0.5"] } }), now);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  assert.equal(byId.https.status, "fail");
  assert.equal(byId.webrtc.status, "warn");
  assert.match(byId.webrtc.detail, /10\.0\.0\.5/);
  assert.equal(score(items), 70);
});

test("判定できないブラウザは注意扱い", () => {
  assert.equal(evaluate(env(UA.samsung), now).find((i) => i.id === "browser").status, "warn");
});
