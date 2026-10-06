"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanUrl } = require("../core.js");

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
