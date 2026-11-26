import { Link, NavLink } from "react-router-dom";
import { APP_STORE_URL } from "../lib/appStore";

// Shared top bar: logo, text links, and one call to action (the App Store).
// "Roadmap" is a section of the home page, so it's a plain anchor; it hides on phones
// so Feedback always fits (the bottom bar with its feedback button is hidden there).
export function SiteNav() {
  return (
    <nav className="np-nav" aria-label="Main">
      <Link to="/" className="np-nav-logo">
        <img className="np-logo-icon" src="/images/noplan-icon-128.png" alt="" width="128" height="128" />
        noplan
      </Link>
      <div className="np-nav-links">
        <NavLink to="/faq" className="np-nav-link">FAQ</NavLink>
        <a href="/#roadmap" className="np-nav-link np-nav-link--wide">Roadmap</a>
        <NavLink to="/feedback" className="np-nav-link">Feedback</NavLink>
        <NavLink to="/privacy" className="np-nav-link np-nav-link--optional">Privacy</NavLink>
      </div>
      <a
        href={APP_STORE_URL}
        className="np-pill np-pill--solid np-nav-cta"
        aria-label="Download noplan on the App Store"
      >
        <span className="np-nav-cta-long">Download on the App Store</span>
        <span className="np-nav-cta-short" aria-hidden="true">Download</span>
      </a>
    </nav>
  );
}
