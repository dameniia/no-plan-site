import test from "node:test";
import assert from "node:assert/strict";
import { parseRoadmapBody, isAllowedOrigin } from "./roadmap-dev-store.js";

const validItem = {
  id: "r-0001", title: "Thing", note: "", status: "planned", updated: "2026-01-01",
};

test("invalid JSON gives 400", () => {
  const r = parseRoadmapBody("{nope");
  assert.equal(r.status, 400);
  assert.deepEqual(r.body, { ok: false, error: "invalid_json" });
});

test("oversized body gives 413", () => {
  const r = parseRoadmapBody(" ".repeat(1_000_001));
  assert.equal(r.status, 413);
  assert.deepEqual(r.body, { ok: false, error: "too_large" });
});

test("invalid roadmap gives 422 with details", () => {
  const r = parseRoadmapBody(JSON.stringify({ items: [{ id: "x" }] }));
  assert.equal(r.status, 422);
  assert.equal(r.body.error, "invalid_roadmap");
  assert.ok(r.body.details.length > 0);
});

test("valid roadmap gives 200 with data", () => {
  const data = { items: [validItem] };
  const r = parseRoadmapBody(JSON.stringify(data));
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true });
  assert.deepEqual(r.data, data);
});

test("isAllowedOrigin", () => {
  assert.equal(isAllowedOrigin(undefined, "localhost:5174"), true);
  assert.equal(isAllowedOrigin("http://localhost:5174", "localhost:5174"), true);
  assert.equal(isAllowedOrigin("https://evil.example", "localhost:5174"), false);
  assert.equal(isAllowedOrigin("not a url", "localhost:5174"), false);
});
