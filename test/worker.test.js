import assert from "node:assert/strict";
import test from "node:test";
import { route } from "../src/index.js";

const originalFetch = globalThis.fetch;
const bingData = {
  images: [{ startdate: "20260721", title: "Test", copyright: "Copyright", url: "/th?id=test_1920x1080.jpg", urlbase: "/th?id=test" }],
};

function context() {
  return { waitUntil(promise) { void promise; } };
}

function mockFetch() {
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("HPImageArchive.aspx")) return Response.json(bingData);
    if (url.includes("bing.com")) return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), { headers: { "Content-Type": "image/jpeg" } });
    throw new Error(`Unexpected URL ${url}`);
  };
}

test.beforeEach(mockFetch);
test.after(() => { globalThis.fetch = originalFetch; });

test("homepage preserves the complete original PHP template markers", async () => {
  const response = await route(new Request("https://example.test/"), {}, context());
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const marker of [
    "Daily Visual Collection",
    "近 7 天壁纸",
    "推荐接口",
    "尺寸接口",
    "参数用法",
    "CDN: Cloudflare CDN",
    "workers-usage-card",
    "https://worker.wuw.li/api/usage",
    "Workers 今日请求量（UTC）",
    "wallpaperData",
    "copyCode",
  ]) assert.ok(html.includes(marker), `missing homepage marker: ${marker}`);
  assert.ok(!html.includes("<?php"));
  assert.ok(!html.includes("moe-counter.wuw.li"));
  assert.ok(!html.includes("bing-img 访问计数"));
  assert.match(html, /https:\/\/bing-img\.wuw\.li\/auto_302\.php/);
  assert.match(html, /https:\/\/bing-img\.wuw\.li\/download\.php\?url=/);
  assert.match(html, /20260721 \| Copyright/);
  assert.equal((html.match(/class="weekly-item /g) || []).length, 8);
});

test("all redirect compatibility routes return Bing URLs", async () => {
  const routes = ["auto_302.php", "m_302.php", "1920x1080_302.php", "1366x768_302.php"];
  for (const path of routes) {
    const response = await route(new Request(`https://example.test/${path}`), {}, context());
    assert.equal(response.status, 302);
    assert.match(response.headers.get("location"), /^https:\/\/www\.bing\.com\/th\?id=test_/);
  }
});

test("auto.php streams an image", async () => {
  const response = await route(new Request("https://example.test/auto.php", { headers: { "User-Agent": "iPhone Mobile" } }), {}, context());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(response.headers.get("vary"), "User-Agent");
});

test("func.php preserves JSON shape and public CDN origin", async () => {
  const response = await route(new Request("https://worker.example/func.php?n=1"), {}, context());
  const body = await response.json();
  assert.equal(body.code, 200);
  assert.equal(body.count, 1);
  assert.equal(body.data[0].api_pc, "https://bing-img.wuw.li/1920x1080_302.php?idx=0");
});

test("download.php rejects non-Bing hosts", async () => {
  const response = await route(new Request("https://example.test/download.php?url=https://evil.test/a.jpg"), {}, context());
  assert.equal(response.status, 400);
});

test("random.php redirects to the Worker-hosted R2 object and scopes listing to bing-img", async () => {
  let prefix;
  const env = { BING_IMAGES: { async list(options) { prefix = options.prefix; return { objects: [{ key: "bing-img/2026-07-20.jpg", size: 3752109 }] }; } } };
  const response = await route(new Request("https://example.test/random.php"), env, context());
  assert.equal(prefix, "bing-img/");
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://example.test/bing-img/2026-07-20.jpg");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("stored R2 images are served through the Worker", async () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const env = { BING_IMAGES: { async get(key) {
    assert.equal(key, "bing-img/2026-07-20.jpg");
    return {
      body: bytes,
      httpEtag: '"test-etag"',
      writeHttpMetadata(headers) { headers.set("Content-Type", "image/jpeg"); },
    };
  } } };
  const response = await route(new Request("https://example.test/bing-img/2026-07-20.jpg"), env, context());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(response.headers.get("etag"), '"test-etag"');
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
});

test("random.php redirects to current Bing image when R2 is absent or empty", async () => {
  for (const env of [{}, { BING_IMAGES: { async list() { return { objects: [] }; } } }]) {
    const response = await route(new Request("https://example.test/random.php"), env, context());
    assert.equal(response.status, 302);
    assert.match(response.headers.get("location"), /^https:\/\/www\.bing\.com\//);
  }
});

test("unknown route is 404 and POST is 405", async () => {
  assert.equal((await route(new Request("https://example.test/nope"), {}, context())).status, 404);
  assert.equal((await route(new Request("https://example.test/", { method: "POST" }), {}, context())).status, 405);
});
