import test from "node:test";
import assert from "node:assert/strict";
import { parseRoadmapBody, isAllowedOrigin, versionOf } from "./roadmap-dev-store.js";

const V = versionOf("current file bytes");
const body = (data, baseVersion = V) => JSON.stringify({ ...data, baseVersion });

const validItem = {
  id: "r-0001", title: "Thing", note: "", status: "planned", updated: "2026-01-01",
};

test("invalid JSON gives 400", () => {
  const r = parseRoadmapBody("{nope", V);
  assert.equal(r.status, 400);
  assert.deepEqual(r.body, { ok: false, error: "invalid_json" });
});

test("oversized body gives 413", () => {
  const r = parseRoadmapBody(" ".repeat(1_000_001), V);
  assert.equal(r.status, 413);
  assert.deepEqual(r.body, { ok: false, error: "too_large" });
});

test("invalid roadmap gives 422 with details", () => {
  const r = parseRoadmapBody(body({ items: [{ id: "x" }] }), V);
  assert.equal(r.status, 422);
  assert.equal(r.body.error, "invalid_roadmap");
  assert.ok(r.body.details.length > 0);
});

test("valid roadmap with matching baseVersion gives 200 with data", () => {
  const data = { items: [validItem] };
  const r = parseRoadmapBody(body(data), V);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true });
  assert.deepEqual(r.data, data);
});

test("stale baseVersion gives 409 conflict", () => {
  const r = parseRoadmapBody(body({ items: [validItem] }, versionOf("older bytes")), V);
  assert.equal(r.status, 409);
  assert.deepEqual(r.body, { ok: false, error: "conflict" });
  assert.equal(r.data, undefined);
});

test("missing baseVersion gives 400 invalid_request", () => {
  for (const raw of [JSON.stringify({ items: [validItem] }), JSON.stringify({ items: [validItem], baseVersion: 1 }), "null"]) {
    const r = parseRoadmapBody(raw, V);
    assert.equal(r.status, 400);
    assert.deepEqual(r.body, { ok: false, error: "invalid_request" });
  }
});

test("versionOf is the sha1 hex of the bytes", () => {
  assert.equal(versionOf(""), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
  assert.equal(versionOf(Buffer.from("a")), versionOf("a"));
});

test("isAllowedOrigin", () => {
  assert.equal(isAllowedOrigin(undefined, "localhost:5174"), true);
  assert.equal(isAllowedOrigin("http://localhost:5174", "localhost:5174"), true);
  assert.equal(isAllowedOrigin("https://evil.example", "localhost:5174"), false);
  assert.equal(isAllowedOrigin("not a url", "localhost:5174"), false);
});
