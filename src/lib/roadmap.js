// Pure roadmap logic: data validation, filtering, and the edits behind /next.
// `today` is always passed in as "YYYY-MM-DD" so callers and tests are deterministic.

export const STATUSES = [
  { id: "backlog", label: "Backlog" },
  { id: "planned", label: "Planned" },
  { id: "in-dev", label: "In dev" },
  { id: "in-test", label: "In test" },
  { id: "ready", label: "Ready for next build" },
  { id: "released", label: "Released" },
];
export const BOARD_STATUSES = ["planned", "in-dev", "in-test", "ready"];
export const IN_PROGRESS = ["in-dev", "in-test", "ready"];

const TITLE_MAX = 120;
const NOTE_MAX = 500;
const VERSION_RE = /^\d+(\.\d+){0,2}$/;
const RELEASE_ERROR = "Use Ship build to release items.";

export function statusLabel(id) {
  return STATUSES.find((s) => s.id === id)?.label ?? id;
}

export function validateRoadmap(data) {
  const items = data?.items;
  if (!Array.isArray(items)) return ["items must be an array"];
  const errors = [];
  const seen = new Set();
  for (const item of items) {
    const id = item?.id;
    if (typeof id !== "string" || !id) {
      errors.push("An item has no id");
      continue;
    }
    if (seen.has(id)) errors.push(`${id}: duplicate id`);
    seen.add(id);
    if (!STATUSES.some((s) => s.id === item.status)) errors.push(`${id}: unknown status "${item.status}"`);
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!title) errors.push(`${id}: title is empty`);
    else if (title.length > TITLE_MAX) errors.push(`${id}: title is longer than ${TITLE_MAX} characters`);
    if (item.note != null && (typeof item.note !== "string" || item.note.length > NOTE_MAX)) {
      errors.push(`${id}: note must be at most ${NOTE_MAX} characters`);
    }
    if (item.status === "released" && !item.build) errors.push(`${id}: released item has no build`);
    if (item.status !== "released" && item.build) errors.push(`${id}: only released items can have a build`);
  }
  return errors;
}

export function filterItems(items, { query = "", statuses = [], build = "" } = {}) {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (q && !`${item.title} ${item.note ?? ""}`.toLowerCase().includes(q)) return false;
    if (statuses.length && !statuses.includes(item.status)) return false;
    if (build && item.build !== build) return false;
    return true;
  });
}

export function sortNewestFirst(items) {
  // Array.prototype.sort is stable, so ties keep file order.
  return [...items].sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0));
}

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

export function listBuilds(items) {
  const builds = [...new Set(items.filter((i) => i.build).map((i) => i.build))];
  return builds.sort((a, b) => compareVersions(b, a));
}

export function summarize(items) {
  const current = items.filter((i) => IN_PROGRESS.includes(i.status));
  return {
    total: items.length,
    released: items.filter((i) => i.status === "released").length,
    inProgress: current.length,
    current,
  };
}

function checkText(title, note) {
  if (!title) return "Title is required.";
  if (title.length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters.`;
  if (note.length > NOTE_MAX) return `Note must be at most ${NOTE_MAX} characters.`;
  return "";
}

function nextId(items) {
  const max = items.reduce((m, i) => Math.max(m, Number(i.id.replace(/^r-/, "")) || 0), 0);
  return `r-${String(max + 1).padStart(4, "0")}`;
}

export function addItem(items, { title, note = "", status }, today) {
  const t = (title ?? "").trim();
  const n = (note ?? "").trim();
  if (!STATUSES.some((s) => s.id === status)) return { items, error: "Unknown status." };
  if (status === "released") return { items, error: RELEASE_ERROR };
  const error = checkText(t, n);
  if (error) return { items, error };
  const item = { id: nextId(items), title: t, note: n, status, updated: today };
  return { items: [...items, item] };
}

export function updateItem(items, id, patch, today) {
  const current = items.find((i) => i.id === id);
  if (!current) return { items, error: "Item not found." };
  const title = (patch.title ?? current.title).trim();
  const note = (patch.note ?? current.note ?? "").trim();
  const status = patch.status ?? current.status;
  if (!STATUSES.some((s) => s.id === status)) return { items, error: "Unknown status." };
  if (status === "released" && current.status !== "released") return { items, error: RELEASE_ERROR };
  const error = checkText(title, note);
  if (error) return { items, error };
  const changed = status !== current.status;
  const next = { ...current, title, note, status, updated: changed ? today : current.updated };
  if (status !== "released") delete next.build;
  return { items: items.map((i) => (i.id === id ? next : i)) };
}

export function removeItem(items, id) {
  return items.filter((i) => i.id !== id);
}

export function moveItem(items, id, status, beforeId, today) {
  const item = items.find((i) => i.id === id);
  if (!item || !STATUSES.some((s) => s.id === status) || status === "released") return items;
  if (beforeId === id) return items;
  if (beforeId != null && items.find((i) => i.id === beforeId)?.status !== status) return items;

  const changed = item.status !== status;
  const moved = { ...item, status, updated: changed ? today : item.updated };
  if (changed) delete moved.build;

  const rest = items.filter((i) => i.id !== id);
  let index;
  if (beforeId != null) {
    index = rest.findIndex((i) => i.id === beforeId);
  } else {
    const last = rest.findLastIndex((i) => i.status === status);
    index = last === -1 ? rest.length : last + 1;
  }
  return [...rest.slice(0, index), moved, ...rest.slice(index)];
}

export function shipBuild(items, version, today) {
  const v = (version ?? "").trim();
  if (!VERSION_RE.test(v)) return { items, error: "Version must look like 1.2 or 1.2.3." };
  if (items.some((i) => i.build === v)) return { items, error: `Build ${v} already exists.` };
  if (!items.some((i) => i.status === "ready")) return { items, error: "Nothing is Ready for the next build." };
  return {
    items: items.map((i) => (i.status === "ready" ? { ...i, status: "released", build: v, updated: today } : i)),
  };
}
