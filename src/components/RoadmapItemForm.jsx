import { useState } from "react";
import PropTypes from "prop-types";
import { STATUSES } from "../lib/roadmap.js";

export function RoadmapItemForm({ item, defaultStatus, onSave, onDelete, onCancel }) {
  const [title, setTitle] = useState(item ? item.title : "");
  const [note, setNote] = useState(item ? item.note : "");
  const [status, setStatus] = useState(item ? item.status : defaultStatus);
  const [error, setError] = useState("");
  const wasReleased = item?.status === "released";

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = onSave({ title, note, status });
    setError(message || "");
  };

  const handleDelete = () => {
    if (window.confirm("Delete this item?")) onDelete(item.id);
  };

  return (
    <form className="np-rm-form" onSubmit={handleSubmit}>
      <label className="np-rm-form-field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          maxLength={120}
          required
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="np-rm-form-field">
        <span>Note</span>
        <textarea value={note} maxLength={500} rows={3} onChange={(e) => setNote(e.target.value)} />
      </label>
      <label className="np-rm-form-field">
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id} disabled={s.id === "released" && !wasReleased}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="np-rm-form-error" role="alert">
          {error}
        </p>
      )}
      <div className="np-rm-form-actions">
        <button type="submit" className="np-pill np-pill--solid">
          Save
        </button>
        <button type="button" className="np-pill np-pill--ghost" onClick={onCancel}>
          Cancel
        </button>
        {onDelete && item && (
          <button type="button" className="np-pill np-pill--ghost" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

RoadmapItemForm.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    note: PropTypes.string,
    status: PropTypes.string.isRequired,
  }),
  defaultStatus: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
};
