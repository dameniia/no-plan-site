import { useCallback, useRef, useState } from "react";
import data from "../data/roadmap.json";
import { addItem, updateItem, removeItem, moveItem, shipBuild } from "./roadmap.js";

const SAVE_ERROR = "Couldn't save: is pnpm dev running?";

// Local date as YYYY-MM-DD, computed at action time.
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function putItems(items) {
  try {
    const res = await fetch("/__roadmap", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function useEditableRoadmap() {
  const editable = true;
  const [items, setItems] = useState(data.items);
  const [error, setError] = useState("");
  const itemsRef = useRef(items);
  const savedRef = useRef(data.items);
  const failedRef = useRef(false);
  const chain = useRef(Promise.resolve());

  // Invariant: after a failure, state equals the last saved list; queued
  // saves are dropped. Saves run in order; a failed save restores the last
  // list confirmed on disk and skips every save queued behind it. The next
  // user action clears the flag and saves normally from the restored list.
  const commit = useCallback((next) => {
    failedRef.current = false;
    itemsRef.current = next;
    setItems(next);
    setError("");
    chain.current = chain.current.then(async () => {
      if (failedRef.current) return;
      const ok = await putItems(next);
      if (ok) {
        savedRef.current = next;
        return;
      }
      failedRef.current = true;
      itemsRef.current = savedRef.current;
      setItems(savedRef.current);
      setError(SAVE_ERROR);
    });
  }, []);

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
