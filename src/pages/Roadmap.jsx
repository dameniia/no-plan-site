import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { SiteNav } from "../components/SiteNav";
import { SiteFooter } from "../components/SiteFooter";
import { RoadmapItemForm } from "../components/RoadmapItemForm";
import { useRoadmap } from "../lib/useRoadmap";
import { STATUSES, statusLabel, filterItems, sortNewestFirst, listBuilds } from "../lib/roadmap";
import "../css/noplan.css";
import "../css/roadmap.css";

const BADGE = {
  released: "np-badge--done",
  "in-dev": "np-badge--active",
  "in-test": "np-badge--active",
  ready: "np-badge--active",
  backlog: "np-badge--upcoming",
  planned: "np-badge--upcoming",
};

function ItemBody({ item }) {
  return (
    <>
      <span className="np-rm-item-head">
        <span className="np-rm-item-title">{item.title}</span>
        <span className={`np-badge ${BADGE[item.status] || ""}`}>{statusLabel(item.status)}</span>
      </span>
      {item.note && <span className="np-rm-item-note">{item.note}</span>}
      {item.status === "released" && item.build && (
        <span className="np-rm-item-build">Released in {item.build}</span>
      )}
    </>
  );
}

ItemBody.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    note: PropTypes.string,
    status: PropTypes.string.isRequired,
    build: PropTypes.string,
  }).isRequired,
};

export function Roadmap() {
  const { items, editable: canEdit, error, add, update, remove } = useRoadmap();
  // Literal DEV check so the bundler drops the editing UI from production builds
  const editable = import.meta.env.DEV && canEdit;
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [build, setBuild] = useState("");
  const [synced, setSynced] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | item id

  useEffect(() => {
    document.title = "Roadmap — noplan";
  }, []);

  // Read the query string once after mount (never during render, so SSR matches).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const known = new Set(STATUSES.map((s) => s.id));
    setQuery(params.get("q") || "");
    setStatuses((params.get("status") || "").split(",").filter((s) => known.has(s)));
    const b = params.get("build") || "";
    setBuild(listBuilds(items).includes(b) ? b : "");
    setSynced(true);
    // Mount only: later list changes must not reset the filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write filters back to the URL on change, once the initial read has landed.
  useEffect(() => {
    if (!synced) return;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statuses.length) params.set("status", statuses.join(","));
    if (build) params.set("build", build);
    const search = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + (search ? `?${search}` : "") + window.location.hash,
    );
  }, [synced, query, statuses, build]);

  const builds = useMemo(() => listBuilds(items), [items]);
  const visible = useMemo(
    () => sortNewestFirst(filterItems(items, { query, statuses, build })),
    [items, query, statuses, build],
  );
  const filtered = query !== "" || statuses.length > 0 || build !== "";

  const toggleStatus = (id) =>
    setStatuses((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const clearFilters = () => {
    setQuery("");
    setStatuses([]);
    setBuild("");
  };

  const handleSave = (id) => (fields) => {
    const message = id === "new" ? add(fields) : update(id, fields);
    if (!message) setEditing(null);
    return message;
  };
  const handleDelete = (id) => {
    remove(id);
    setEditing(null);
  };

  return (
    <div className="np-root">
      <SiteNav />

      <main className="np-section np-rm">
        <div className="np-rm-inner">
          <header className="np-rm-head">
            <p className="np-eyebrow">Roadmap</p>
            <h1 className="np-heading">Roadmap</h1>
            <p className="np-body">Everything planned, in progress and released.</p>
          </header>

          <div className="np-rm-controls">
            <label className="np-rm-search">
              <span className="np-rm-label">Search the roadmap</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
              />
            </label>
            <div className="np-rm-chips" role="group" aria-label="Filter by status">
              {STATUSES.map((s) => {
                const on = statuses.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    className={`np-rm-chip${on ? " np-rm-chip--on" : ""}`}
                    onClick={() => toggleStatus(s.id)}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <label className="np-rm-build">
              <span className="np-rm-label">Build</span>
              <select value={build} onChange={(e) => setBuild(e.target.value)}>
                <option value="">All builds</option>
                {builds.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="np-rm-meta">
            <p className="np-rm-count" aria-live="polite">
              {visible.length} of {items.length} items
            </p>
            {editable && (
              <button
                type="button"
                className="np-pill np-pill--solid"
                onClick={() => setEditing("new")}
              >
                + New item
              </button>
            )}
          </div>

          {editable && error && (
            <p className="np-rm-form-error" role="alert">
              {error}
            </p>
          )}

          {editable && editing === "new" && (
            <RoadmapItemForm
              item={null}
              onSave={handleSave("new")}
              onCancel={() => setEditing(null)}
            />
          )}

          {visible.length === 0 ? (
            <div className="np-rm-empty">
              <p className="np-body">Nothing matches these filters.</p>
              <button type="button" className="np-pill np-pill--ghost" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="np-rm-list">
              {visible.map((item) => (
                <li key={item.id} className="np-rm-item">
                  {editable && editing === item.id ? (
                    <RoadmapItemForm
                      item={item}
                      onSave={handleSave(item.id)}
                      onDelete={handleDelete}
                      onCancel={() => setEditing(null)}
                    />
                  ) : editable ? (
                    <button
                      type="button"
                      className="np-rm-item-btn"
                      onClick={() => setEditing(item.id)}
                    >
                      <ItemBody item={item} />
                    </button>
                  ) : (
                    <div className="np-rm-item-static">
                      <ItemBody item={item} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {filtered && visible.length > 0 && (
            <button type="button" className="np-rm-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
