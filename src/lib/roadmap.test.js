import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  STATUSES, BOARD_STATUSES, IN_PROGRESS, statusLabel, validateRoadmap, filterItems,
  sortNewestFirst, listBuilds, summarize, addItem, updateItem, removeItem, moveItem, shipBuild,
} from "./roadmap.js";

const it_ = (id, title, status, updated, build) => ({
  id, title, note: "", status, ...(build ? { build } : {}), updated,
});
const fixture = () => [
  it_("r-0001", "Better audio signals and cues", "backlog", "2026-01-01"),
  it_("r-0002", "Superset UX", "planned", "2026-01-02"),
  it_("r-0003", "Cardio fix", "in-dev", "2026-01-03"),
  it_("r-0004", "Swap UX", "in-dev", "2026-01-03"),
  it_("r-0005", "Widgets", "in-test", "2026-01-04"),
  it_("r-0006", "Nudge", "ready", "2026-01-05"),
  it_("r-0007", "Old thing", "released", "2025-12-01", "1.0"),
  it_("r-0008", "Another old", "released", "2025-12-02", "1.10"),
  it_("r-0009", "Middle", "released", "2025-12-03", "1.2"),
];
const ids = (items) => items.map((i) => i.id);

test("statuses and helpers", () => {
  assert.equal(STATUSES.length, 6);
  assert.deepEqual(BOARD_STATUSES, ["planned", "in-dev", "in-test", "ready"]);
  assert.deepEqual(IN_PROGRESS, ["in-dev", "in-test", "ready"]);
  assert.equal(statusLabel("ready"), "Ready for next build");
});

test("validateRoadmap accepts the real roadmap.json", async () => {
  const data = JSON.parse(await readFile(new URL("../data/roadmap.json", import.meta.url), "utf8"));
  assert.deepEqual(validateRoadmap(data), []);
  const { items } = data;
  assert.equal(items.length, 27);
  const released = items.filter((i) => i.status === "released");
  assert.equal(released.length, 21);
  assert.ok(released.every((i) => i.build === "1.0"));
  assert.equal(items.find((i) => i.title === "Cardio exercises UI/UX fix").status, "in-test");
  assert.equal(items.filter((i) => i.status === "backlog").length, 5);
});

test("validateRoadmap reports each problem with the item id", () => {
  const base = it_("r-0001", "ok", "backlog", "2026-01-01");
  const cases = [
    [{ ...base, id: "r-0002", status: "nope" }, "r-0002"],
    [{ ...base, status: "released" }, "r-0001"],
    [{ ...base, build: "1.0" }, "r-0001"],
    [{ ...base, title: "  " }, "r-0001"],
    [{ ...base, title: "x".repeat(121) }, "r-0001"],
    [{ ...base, note: "x".repeat(501) }, "r-0001"],
    [{ ...base, status: "released", build: "v1" }, "r-0001"],
    [{ ...base, status: "released", build: "1.2.3.4" }, "r-0001"],
    [{ ...base, updated: "2026-1-1" }, "r-0001"],
    [{ ...base, updated: undefined }, "r-0001"],
  ];
  for (const [item, id] of cases) {
    const errs = validateRoadmap({ items: [item] });
    assert.equal(errs.length, 1, JSON.stringify(item));
    assert.ok(errs[0].includes(id));
  }
  const dup = validateRoadmap({ items: [base, { ...base }] });
  assert.equal(dup.length, 1);
  assert.ok(dup[0].includes("r-0001"));
});

test("filterItems", () => {
  const f = fixture();
  assert.deepEqual(ids(filterItems(f, { query: "  AUDIO " })), ["r-0001"]);
  for (const q of ["c++", "(", "*"]) assert.deepEqual(filterItems(f, { query: q }), []);
  assert.deepEqual(ids(filterItems(f, { statuses: ["in-dev", "in-test"] })), ["r-0003", "r-0004", "r-0005"]);
  assert.deepEqual(ids(filterItems(f, { build: "1.0" })), ["r-0007"]);
  assert.deepEqual(ids(filterItems(f, { query: "old", statuses: ["released"], build: "1.10" })), ["r-0008"]);
  assert.equal(filterItems(f, {}).length, f.length);
});

test("sortNewestFirst sorts by updated, newest first", () => {
  assert.deepEqual(ids(sortNewestFirst(fixture())),
    ["r-0006", "r-0005", "r-0003", "r-0004", "r-0002", "r-0001", "r-0009", "r-0008", "r-0007"]);
});

test("sortNewestFirst breaks same-day ties by stage", () => {
  const sameDay = fixture().map((i) => ({ ...i, updated: "2026-01-01" }));
  // In progress (file order), planned, backlog, then released in reverse file order.
  assert.deepEqual(ids(sortNewestFirst(sameDay)),
    ["r-0003", "r-0004", "r-0005", "r-0006", "r-0002", "r-0001", "r-0009", "r-0008", "r-0007"]);
});

test("sortNewestFirst on the real roadmap.json starts with current work", async () => {
  const { items } = JSON.parse(await readFile(new URL("../data/roadmap.json", import.meta.url), "utf8"));
  const sorted = sortNewestFirst(items);
  assert.equal(sorted[0].title, "Cardio exercises UI/UX fix");
  const backlog = items.filter((i) => i.status === "backlog");
  assert.deepEqual(ids(sorted.slice(1, 6)), ids(backlog));
  assert.equal(sorted[6].title, "App Store release");
  assert.ok(sorted.slice(6).every((i) => i.status === "released"));
});

test("listBuilds compares numerically", () => {
  assert.deepEqual(listBuilds(fixture()), ["1.10", "1.2", "1.0"]);
});

test("summarize", () => {
  const s = summarize(fixture());
  assert.equal(s.total, 9);
  assert.equal(s.released, 3);
  assert.equal(s.inProgress, 4);
  assert.deepEqual(ids(s.current), ["r-0003", "r-0004", "r-0005", "r-0006"]);
});

test("addItem", () => {
  const f = fixture();
  const bad = addItem(f, { title: "   ", note: "", status: "backlog" }, "2026-02-01");
  assert.ok(bad.error);
  assert.equal(bad.items, f);
  const ok = addItem(f, { title: "  New one ", note: " n ", status: "planned" }, "2026-02-01");
  assert.equal(ok.error, undefined);
  const added = ok.items.at(-1);
  assert.equal(added.id, "r-0010");
  assert.equal(added.title, "New one");
  assert.equal(added.status, "planned");
  assert.equal(added.updated, "2026-02-01");
  assert.equal(ok.items.length, f.length + 1);
});

test("addItem refuses released", () => {
  const f = fixture();
  const r = addItem(f, { title: "x", note: "", status: "released" }, "2026-02-01");
  assert.equal(r.error, "Use Ship build to release items.");
  assert.equal(r.items, f);
});

test("updateItem", () => {
  const f = fixture();
  const r = updateItem(f, "r-0001", { title: " Renamed ", note: "hi" }, "2026-02-01");
  assert.equal(r.error, undefined);
  const a = r.items.find((i) => i.id === "r-0001");
  assert.equal(a.title, "Renamed");
  assert.equal(a.note, "hi");
  assert.equal(a.updated, "2026-01-01");
  const s = updateItem(f, "r-0001", { status: "planned" }, "2026-02-01");
  assert.equal(s.items.find((i) => i.id === "r-0001").updated, "2026-02-01");
  assert.ok(updateItem(f, "r-0001", { title: "" }, "2026-02-01").error);
  assert.ok(updateItem(f, "r-9999", {}, "2026-02-01").error);
});

test("updateItem refuses released unless already released", () => {
  const f = fixture();
  const r = updateItem(f, "r-0001", { status: "released" }, "2026-02-01");
  assert.equal(r.error, "Use Ship build to release items.");
  assert.equal(r.items, f);
  const ok = updateItem(f, "r-0007", { title: "Renamed", status: "released" }, "2026-02-01");
  assert.equal(ok.error, undefined);
  assert.equal(ok.items.find((i) => i.id === "r-0007").updated, "2025-12-01");
});

test("removeItem", () => {
  assert.equal(removeItem(fixture(), "r-0001").length, 8);
});

test("moveItem", () => {
  const f = fixture();
  const a = moveItem(f, "r-0001", "in-dev", null, "2026-02-01");
  assert.deepEqual(ids(a).slice(0, 4), ["r-0002", "r-0003", "r-0004", "r-0001"]);
  const m = a.find((i) => i.id === "r-0001");
  assert.equal(m.status, "in-dev");
  assert.equal(m.updated, "2026-02-01");

  const b = moveItem(f, "r-0001", "in-dev", "r-0004", "2026-02-01");
  assert.deepEqual(ids(b).slice(0, 4), ["r-0002", "r-0003", "r-0001", "r-0004"]);

  const c = moveItem(f, "r-0004", "in-dev", "r-0003", "2026-02-01");
  assert.deepEqual(ids(c).slice(0, 4), ["r-0001", "r-0002", "r-0004", "r-0003"]);
  assert.equal(c.find((i) => i.id === "r-0004").updated, "2026-01-03");

  assert.equal(moveItem(f, "r-0001", "released", null, "2026-02-01"), f);
  assert.equal(moveItem(f, "r-0003", "in-dev", "r-0003", "2026-02-01"), f);
  assert.equal(moveItem(f, "r-0001", "in-dev", "r-0005", "2026-02-01"), f);
});

test("moveItem into an empty column goes to the end of the file", () => {
  const f = fixture().filter((i) => i.status !== "ready");
  const r = moveItem(f, "r-0001", "ready", null, "2026-02-01");
  assert.equal(r.at(-1).id, "r-0001");
});

test("shipBuild", () => {
  const none = fixture().filter((i) => i.status !== "ready");
  assert.equal(shipBuild(none, "1.3", "2026-02-01").error, "Nothing is Ready for the next build.");
  const f = fixture();
  assert.ok(shipBuild(f, "", "2026-02-01").error);
  assert.ok(shipBuild(f, "v1", "2026-02-01").error);
  assert.ok(shipBuild(f, "1.2", "2026-02-01").error);
  const r = shipBuild(f, "1.3", "2026-02-01");
  assert.equal(r.error, undefined);
  const shipped = r.items.find((i) => i.id === "r-0006");
  assert.equal(shipped.status, "released");
  assert.equal(shipped.build, "1.3");
  assert.equal(shipped.updated, "2026-02-01");
  assert.deepEqual(r.items.filter((i) => i.id !== "r-0006"), f.filter((i) => i.id !== "r-0006"));
});
