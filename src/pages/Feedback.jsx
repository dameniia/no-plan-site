import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/noplan.css";
import "../css/feedback.css";
import { sendFeedback, FEEDBACK_ERRORS } from "../lib/sendFeedback";

const MAX_MESSAGE = 4000;

const CATEGORIES = [
  { value: "idea", label: "Idea" },
  { value: "bug", label: "Something's broken" },
  { value: "praise", label: "What works" },
  { value: "other", label: "Other" },
];

export function Feedback() {
  const [category, setCategory] = useState("idea");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, hidden from people
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const previous = document.title;
    document.title = "Feedback — noplan";
    return () => {
      document.title = previous;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorText("");
    try {
      await sendFeedback({ category, message, email, website });
      setStatus("sent");
    } catch (error) {
      setErrorText(FEEDBACK_ERRORS[error.code] ?? FEEDBACK_ERRORS.send_failed);
      setStatus("error");
    }
  }

  function reset() {
    setMessage("");
    setEmail("");
    setCategory("idea");
    setStatus("idle");
  }

  return (
    <div className="np-root">
      <nav className="np-nav">
        <Link to="/" className="np-nav-logo">noplan</Link>
        <div className="np-nav-actions">
          <Link to="/" className="np-pill np-pill--ghost">Back to noplan</Link>
        </div>
      </nav>

      <main className="np-section np-feedback">
        <div className="np-feedback-inner">
          {status === "sent" ? (
            <div className="np-feedback-done" role="status">
              <h1 className="np-heading">Thank you.</h1>
              <p className="np-body">
                Your message is on its way. Every note is read by the person building noplan.
                {email ? " If a reply makes sense, it will go to the email you gave." : ""}
              </p>
              <button type="button" className="np-pill np-pill--ghost np-pill--lg" onClick={reset}>
                Send another
              </button>
            </div>
          ) : (
            <>
              <h1 className="np-heading">Tell us how it&apos;s going.</h1>
              <p className="np-body">
                What works, what doesn&apos;t, what&apos;s missing. Messages go straight to the
                person building noplan. No account needed.
              </p>

              <form className="np-form" onSubmit={handleSubmit} noValidate>
                <fieldset className="np-field np-field--chips" disabled={status === "sending"}>
                  <legend className="np-label">What kind of feedback?</legend>
                  <div className="np-chips">
                    {CATEGORIES.map(({ value, label }) => (
                      <label key={value} className={`np-chip${category === value ? " np-chip--on" : ""}`}>
                        <input
                          type="radio"
                          name="category"
                          value={value}
                          checked={category === value}
                          onChange={() => setCategory(value)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="np-field">
                  <label className="np-label" htmlFor="np-message">Your message</label>
                  <textarea
                    id="np-message"
                    className="np-input np-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={MAX_MESSAGE}
                    rows={7}
                    required
                    disabled={status === "sending"}
                    placeholder="What happened, or what would you change?"
                  />
                  <span className="np-hint">{message.length} / {MAX_MESSAGE}</span>
                </div>

                <div className="np-field">
                  <label className="np-label" htmlFor="np-email">
                    Email <span className="np-optional">(optional, only so I can reply)</span>
                  </label>
                  <input
                    id="np-email"
                    className="np-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "sending"}
                  />
                </div>

                {/* Honeypot: invisible to people, tempting to bots. */}
                <div className="np-hp" aria-hidden="true">
                  <label htmlFor="np-website">Website</label>
                  <input
                    id="np-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <p className="np-error" role="alert" hidden={status !== "error"}>{errorText}</p>

                <div className="np-form-actions">
                  <button
                    type="submit"
                    className="np-pill np-pill--solid np-pill--lg"
                    disabled={status === "sending" || message.trim().length === 0}
                  >
                    {status === "sending" ? "Sending…" : "Send feedback"}
                  </button>
                  <p className="np-fineprint">
                    Your message and, if you add it, your email are sent to a private inbox and
                    used only to improve noplan. Nothing is stored on this site.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
