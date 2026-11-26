import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { SiteNav } from "../components/SiteNav";
import { SiteFooter } from "../components/SiteFooter";
import { RoadmapItemForm } from "../components/RoadmapItemForm";
import { useRoadmap } from "../lib/useRoadmap";
import { BOARD_STATUSES, statusLabel } from "../lib/roadmap";
import "../css/noplan.css";
import "../css/roadmap.css";

function CardBody({ item }) {
  return (
    <>
      <span className="np-rm-item-title">{item.title}</span>
      {item.note && <span className="np-rm-item-note">{item.note}</span>}
    </>
  );
}

CardBody.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    note: PropTypes.string,
  }).isRequired,
};

export function Board() {
  const { items, editable: canEdit, error, add, update, remove, move, ship } = useRoadmap();
  // Literal DEV check so the bundler drops the editing UI from production builds
  const editable = import.meta.env.DEV && canEdit;
  const [editing, setEditing] = useState(null); // null | "new" | item id
  const [dragId, setDragId] = useState(null);
  const [overCard, setOverCard] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [shipError, setShipError] = useState("");

  useEffect(() => {
    document.title = "Next build — noplan";
  }, []);

  const hasReady = items.some((i) => i.status === "ready");

  const clearDrag = () => {
    setDragId(null);
    setOverCard(null);
    setOverCol(null);
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

  const handleShip = () => {
    const version = window.prompt("Version for this build (for example 1.1)");
    if (version === null) return;
    setShipError(ship(version) || "");
  };

  const cardDragOver = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (id === dragId) return;
    setOverCard(id);
    setOverCol(null);
  };
  const colDragOver = (e, status) => {
    e.preventDefault();
    setOverCol(status);
    setOverCard(null);
  };
  const leave = (e, clear) => {
    if (!e.currentTarget.contains(e.relatedTarget)) clear();
  };
  const dropOn = (e, status, beforeId) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain");
    clearDrag();
    if (!id || id === beforeId) return;
    move(id, status, beforeId);
  };

  return (
    <div className="np-root">
      <SiteNav />

      <main className="np-section np-rm">
        <div className="np-board">
          <header className="np-rm-head">
            <h1 className="np-heading">Next build</h1>
            <p className="np-body">What is planned, in development, in testing and ready for the next app build.</p>
            {editable && (
              <div className="np-board-tools">
                <button
                  type="button"
                  className="np-pill np-pill--solid"
                  disabled={!hasReady}
                  onClick={handleShip}
                >
                  Ship build
                </button>
              </div>
            )}
          </header>

          {editable && (error || shipError) && (
            <p className="np-rm-form-error" role="alert">
              {error || shipError}
            </p>
          )}

          <div className="np-board-cols">
            {BOARD_STATUSES.map((status) => {
              const col = items.filter((i) => i.status === status);
              const headId = `np-board-h-${status}`;
              return (
                <section
                  key={status}
                  className={`np-board-col${overCol === status ? " np-board-col--over" : ""}`}
                  aria-labelledby={headId}
                  onDragOver={editable ? (e) => colDragOver(e, status) : undefined}
                  onDragLeave={editable ? (e) => leave(e, () => setOverCol(null)) : undefined}
                  onDrop={editable ? (e) => dropOn(e, status, null) : undefined}
                >
                  <div className="np-board-col-head">
                    <h2 id={headId} className="np-board-col-title">
                      {statusLabel(status)} <span className="np-board-count">{col.length}</span>
                    </h2>
                    {editable && status === "planned" && (
                      <button
                        type="button"
                        className="np-rm-clear"
                        onClick={() => setEditing("new")}
                      >
                        + New
                      </button>
                    )}
                  </div>

                  {editable && status === "planned" && editing === "new" && (
                    <RoadmapItemForm
                      item={null}
                      defaultStatus="planned"
                      onSave={handleSave("new")}
                      onCancel={() => setEditing(null)}
                    />
                  )}

                  {col.length === 0 ? (
                    <p className="np-board-empty">Nothing here yet.</p>
                  ) : (
                    <ul className="np-board-list">
                      {col.map((item) =>
                        editable && editing === item.id ? (
                          <li key={item.id}>
                            <RoadmapItemForm
                              item={item}
                              onSave={handleSave(item.id)}
                              onDelete={handleDelete}
                              onCancel={() => setEditing(null)}
                            />
                          </li>
                        ) : (
                          <li
                            key={item.id}
                            className={`np-rm-item np-board-card${
                              overCard === item.id ? " np-board-card--drop-before" : ""
                            }`}
                            draggable={editable || undefined}
                            onDragStart={
                              editable
                                ? (e) => {
                                    e.dataTransfer.setData("text/plain", item.id);
                                    e.dataTransfer.effectAllowed = "move";
                                    setDragId(item.id);
                                  }
                                : undefined
                            }
                            onDragEnd={editable ? clearDrag : undefined}
                            onDragOver={editable ? (e) => cardDragOver(e, item.id) : undefined}
                            onDragLeave={editable ? (e) => leave(e, () => setOverCard(null)) : undefined}
                            onDrop={editable ? (e) => dropOn(e, status, item.id) : undefined}
                          >
                            {editable ? (
                              <button
                                type="button"
                                className="np-rm-item-btn"
                                onClick={() => setEditing(item.id)}
                              >
                                <CardBody item={item} />
                              </button>
                            ) : (
                              <div className="np-rm-item-static">
                                <CardBody item={item} />
                              </div>
                            )}
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          {!editable && (
            <p className="np-board-more">
              Looking for everything else? See the <Link to="/roadmap">full roadmap</Link>.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
