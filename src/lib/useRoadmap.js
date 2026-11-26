import { useCallback, useEffect, useRef, useState } from "react";
import data from "../data/roadmap.json";
import { addItem, updateItem, removeItem, moveItem, shipBuild } from "./roadmap.js";

const SAVE_ERROR = "Couldn't save: is pnpm dev running?";
const CONFLICT_ERROR = "roadmap.json changed outside this page. It has been reloaded; redo your last change.";

// Local date as YYYY-MM-DD, computed at action time.
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const sameItems = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// GET the file as it is on disk: { items, version } or null if the dev server can't be reached.
async function getRoadmap() {
  try {
    const res = await fetch("/__roadmap", { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    return body.ok && Array.isArray(body.items) && body.version ? body : null;
  } catch {
    return null;
  }
}

// PUT the whole list on top of `baseVersion`: { status: "ok", version } | { status: "conflict" } | { status: "error" }.
async function putItems(items, baseVersion) {
  try {
    const res = await fetch("/__roadmap", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, baseVersion }),
    });
    if (res.status === 409) return { status: "conflict" };
    if (!res.ok) return { status: "error" };
    const body = await res.json();
    return body.version ? { status: "ok", version: body.version } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

function useEditableRoadmap() {
  const editable = true;
  const [items, setItems] = useState(data.items);
  const [error, setError] = useState("");
  const itemsRef = useRef(items);
  const savedRef = useRef(data.items); // last list confirmed on disk
  const versionRef = useRef(null); // sha1 of the file savedRef came from
  const pendingRef = useRef(0); // saves queued or in flight
  const failedRef = useRef(false);
  const chain = useRef(Promise.resolve());

  // Runs inside the chain. Loads the file and, when it changed outside this page and no
  // local edit is queued on top of savedRef, replaces the page's list with it.
  // Returns "synced" (versionRef matches the file), "stale" (file differs, kept local edits) or "offline".
  const sync = useCallback(async () => {
    const disk = await getRoadmap();
    if (!disk) return "offline";
    if (disk.version === versionRef.current) return "synced";
    if (sameItems(disk.items, savedRef.current)) {
      versionRef.current = disk.version;
      return "synced";
    }
    if (pendingRef.current > 0) return "stale";
    versionRef.current = disk.version;
    savedRef.current = disk.items;
    itemsRef.current = disk.items;
    setItems(disk.items);
    return "synced";
  }, []);

  const refresh = useCallback(() => {
    chain.current = chain.current.then(sync);
  }, [sync]);

  // Load the file on mount and whenever the window regains focus with nothing left to save.
  useEffect(() => {
    refresh();
    const onFocus = () => {
      if (pendingRef.current === 0) refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // Invariant: after a failure, state equals the last list confirmed on disk
  // (savedRef) and queued saves are dropped. Saves run in order, each on top of
  // the file version the page last saw; a failed save restores savedRef and skips
  // every save queued behind it. A conflict (the file changed outside this page)
  // fails the same way, then reloads the file so savedRef/versionRef match disk.
  // The next user action clears the flag and saves normally from the restored list.
  const commit = useCallback(
    (next) => {
      failedRef.current = false;
      itemsRef.current = next;
      setItems(next);
      setError("");
      pendingRef.current += 1;
      chain.current = chain.current.then(async () => {
        try {
          if (failedRef.current) return;
          let result;
          if (versionRef.current === null && (await sync()) === "stale") result = { status: "conflict" };
          else result = await putItems(next, versionRef.current);
          if (result.status === "ok") {
            savedRef.current = next;
            versionRef.current = result.version;
            return;
          }
          failedRef.current = true;
          itemsRef.current = savedRef.current;
          setItems(savedRef.current);
          if (result.status === "conflict") {
            setError(CONFLICT_ERROR);
            refresh();
          } else {
            setError(SAVE_ERROR);
          }
        } finally {
          pendingRef.current -= 1;
        }
      });
    },
    [sync, refresh],
  );

  const run = useCallback(
    (transform) => {
      if (!editable) return undefined;
      const result = transform(itemsRef.current, today());
      // Transforms return either an array or {items, error}.
      const next = Array.isArray(result) ? result : result.items;
      if (!Array.isArray(result) && result.error) return result.error;
      if (next === itemsRef.current) return undefined;
      commit(next);
      return undefined;
    },
    [editable, commit],
  );

  const add = useCallback((fields) => run((list, t) => addItem(list, fields, t)), [run]);
  const update = useCallback((id, patch) => run((list, t) => updateItem(list, id, patch, t)), [run]);
  const remove = useCallback((id) => run((list) => removeItem(list, id)), [run]);
  const move = useCallback(
    (id, status, beforeId) => run((list, t) => moveItem(list, id, status, beforeId, t)),
    [run],
  );
  const ship = useCallback((version) => run((list, t) => shipBuild(list, version, t)), [run]);

  return { items, editable, error, add, update, remove, move, ship };
}

const NOOP = () => undefined;

// Production: static data only, so the bundler drops the editing code and the dev endpoint call.
function useReadonlyRoadmap() {
  return { items: data.items, editable: false, error: "", add: NOOP, update: NOOP, remove: NOOP, move: NOOP, ship: NOOP };
}

export const useRoadmap = import.meta.env.DEV ? useEditableRoadmap : useReadonlyRoadmap;
