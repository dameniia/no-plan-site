import { Link, NavLink } from "react-router-dom";
import PropTypes from "prop-types";

// Shared top bar: logo, text links (stay visible on phones), and one call to action.
// "Roadmap" is a section of the home page, so it's a plain anchor rather than a route.
export function SiteNav({ showFeedback = true }) {
  return (
    <nav className="np-nav" aria-label="Main">
      <Link to="/" className="np-nav-logo">
        <img className="np-logo-icon" src="/images/noplan-icon-128.png" alt="" width="128" height="128" />
        noplan
      </Link>
      <div className="np-nav-links">
        <NavLink to="/faq" className="np-nav-link">FAQ</NavLink>
        <a href="/#roadmap" className="np-nav-link">Roadmap</a>
        <NavLink to="/privacy" className="np-nav-link np-nav-link--optional">Privacy</NavLink>
      </div>
      {showFeedback && (
        <Link to="/feedback" className="np-pill np-pill--solid np-nav-cta">
          <span className="np-nav-cta-long">Send feedback</span>
          <span className="np-nav-cta-short" aria-hidden="true">Feedback</span>
        </Link>
      )}
    </nav>
  );
}

SiteNav.propTypes = {
  showFeedback: PropTypes.bool,
};
