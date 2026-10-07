"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { cleanUrl } = require("../core.js");
const { buildBundle } = require("../tools/build-browser-e2e.cjs");

test("removes utm parameters and the documented common click ids", () => {
  const result = cleanUrl("https://shop.example/item?utm_source=mail&gclid=abc&fbclid=def");
  assert.equal(result.cleanedUrl, "https://shop.example/item");
  assert.deepEqual(result.removedParameters, ["utm_source", "gclid", "fbclid"]);
});

test("keeps unknown parameters and their original encoding", () => {
  const url = "https://example.test/?campaign=summer%2Fsale&x=a+b&other=%E3%81%82";
  assert.deepEqual(cleanUrl(url), { cleanedUrl: url, removedParameters: [] });
});

test("cleans a mixed query without changing the order of kept parameters", () => {
  const result = cleanUrl("https://example.test/p?first=1&utm_medium=email&last=2");
  assert.equal(result.cleanedUrl, "https://example.test/p?first=1&last=2");
  assert.deepEqual(result.removedParameters, ["utm_medium"]);
});

test("preserves the fragment exactly", () => {
  const result = cleanUrl("https://example.test/p?utm_campaign=x&mode=full#section%202");
  assert.equal(result.cleanedUrl, "https://example.test/p?mode=full#section%202");
});

test("uses parsed URL boundaries around encoded userinfo, path, query, and fragment delimiters", () => {
  const input = "https://user%3Futm_source%3Dfake:pass%23utm_medium%3Dfake@EXAMPLE.test/a%3Fb%23c?gclid=real&keep=a%3Fb%23c#frag?utm_id=not-query";
  const result = cleanUrl(input);

  assert.equal(result.cleanedUrl, "https://user%3Futm_source%3Dfake:pass%23utm_medium%3Dfake@example.test/a%3Fb%23c?keep=a%3Fb%23c#frag?utm_id=not-query");
  assert.deepEqual(result.removedParameters, ["gclid"]);

  const parsed = new URL(result.cleanedUrl);
  assert.equal(parsed.username, "user%3Futm_source%3Dfake");
  assert.equal(parsed.password, "pass%23utm_medium%3Dfake");
  assert.equal(parsed.pathname, "/a%3Fb%23c");
  assert.equal(parsed.search, "?keep=a%3Fb%23c");
  assert.equal(parsed.hash, "#frag?utm_id=not-query");
});

test("removes tracking keys only from the parser's actual query with userinfo present", () => {
  const input = "https://user:password@host.example/path?utm_source=x&keep=%2f%3f%23#fragment";
  const result = cleanUrl(input);

  assert.equal(result.cleanedUrl, "https://user:password@host.example/path?keep=%2f%3f%23#fragment");
  assert.deepEqual(result.removedParameters, ["utm_source"]);
  assert.equal(new URL(result.cleanedUrl).username, "user");
  assert.equal(new URL(result.cleanedUrl).password, "password");
});

test("preserves repeated unknown parameters and counts repeated tracking keys", () => {
  const result = cleanUrl("https://example.test/?tag=a&tag=b&utm_source=x&utm_source=y&tag=c");
  assert.equal(result.cleanedUrl, "https://example.test/?tag=a&tag=b&tag=c");
  assert.deepEqual(result.removedParameters, ["utm_source", "utm_source"]);
});

test("does not decode, reorder, or rewrite encoded values", () => {
  const result = cleanUrl("https://example.test/?q=%2F%2B%3D%26&keep=%252F&utm_term=%E3%81%82");
  assert.equal(result.cleanedUrl, "https://example.test/?q=%2F%2B%3D%26&keep=%252F");
});

test("recognizes an encoded tracking key while preserving encoded unknown keys", () => {
  const result = cleanUrl("https://example.test/?%75tm_source=x&%63ustom=y");
  assert.equal(result.cleanedUrl, "https://example.test/?%63ustom=y");
  assert.deepEqual(result.removedParameters, ["utm_source"]);
});

test("keeps unknown plus-bearing parameter names", () => {
  const url = "https://example.test/?utm_source=x&custom+key=value";
  assert.equal(cleanUrl(url).cleanedUrl, "https://example.test/?custom+key=value");
});

test("rejects malformed, incomplete, and relative input", () => {
  for (const input of ["", "not a URL", "/relative/path", "https://[::1", "https://example.test/a b"]) {
    assert.throws(() => cleanUrl(input), TypeError);
  }
});

test("accepts HTTP and HTTPS only", () => {
  assert.equal(cleanUrl("http://example.test/?utm_source=x").cleanedUrl, "http://example.test/");
  assert.equal(cleanUrl("https://example.test/").cleanedUrl, "https://example.test/");
  assert.throws(() => cleanUrl("ftp://example.test/file"), /Only HTTP and HTTPS/);
  assert.throws(() => cleanUrl("javascript:alert(1)"), /Only HTTP and HTTPS/);
});

test("keeps empty query pairs and a bare query delimiter when unknown data remains", () => {
  assert.equal(cleanUrl("https://example.test/?&utm_id=x&").cleanedUrl, "https://example.test/?&");
  assert.equal(cleanUrl("https://example.test/?utm_id=x").cleanedUrl, "https://example.test/");
});

test("rejects non-string input and control characters", () => {
  assert.throws(() => cleanUrl(null), TypeError);
  assert.throws(() => cleanUrl("https://example.test/?a=1\n&utm_source=x"), /whitespace or control/);
});

test("downloadable browser E2E page is a single offline file matching the app sources", () => {
  const bundle = fs.readFileSync(path.join(__dirname, "..", "browser-e2e.html"), "utf8").replace(/\r\n?/g, "\n");
  assert.equal(bundle, buildBundle());
  assert.match(bundle, /default-src 'none'/);
  assert.match(bundle, /script-src 'sha256-[A-Za-z0-9+/]+=*' 'sha256-[A-Za-z0-9+/]+=*'/);
  assert.doesNotMatch(bundle, /<script\s+src=/i);
  const inlineScripts = [...bundle.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  assert.equal(inlineScripts.length, 2);
  const expectedHashes = inlineScripts.map((source) => crypto.createHash("sha256").update(source, "utf8").digest("base64"));
  const policyHashes = [...bundle.match(/script-src ([^;]+)/)[1].matchAll(/'sha256-([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(policyHashes, expectedHashes);
});
