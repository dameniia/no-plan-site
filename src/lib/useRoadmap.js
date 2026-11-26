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

export function useRoadmap() {
  const editable = import.meta.env.DEV;
  const [items, setItems] = useState(data.items);
  const [error, setError] = useState("");
  const itemsRef = useRef(items);
  const chain = useRef(Promise.resolve());

  // Apply a new list, then save it after any earlier saves. On failure,
  // restore the list from before this action.
  const commit = useCallback((next) => {
    const previous = itemsRef.current;
    itemsRef.current = next;
    setItems(next);
    setError("");
    chain.current = chain.current.then(async () => {
      const ok = await putItems(next);
      if (!ok) {
        itemsRef.current = previous;
        setItems(previous);
        setError(SAVE_ERROR);
      }
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
