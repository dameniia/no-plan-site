import { Link } from "react-router-dom";
import { APP_STORE_URL } from "../lib/appStore";

const CONTACT = "admin@no-plan.app";

// Shared footer on every page: what noplan is, where to get it, and the
// product / support / legal links in columns.
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="np-footer">
      <div className="np-footer-inner">
        <div className="np-footer-brand">
          <Link to="/" className="np-footer-logo">
            <img className="np-logo-icon" src="/images/noplan-icon-128.png" alt="" width="128" height="128" />
            noplan
          </Link>
          <p className="np-footer-tagline">App as a tool</p>
          <a href={APP_STORE_URL} className="np-footer-store">Download on the App Store</a>
        </div>

        <nav className="np-footer-cols" aria-label="Footer">
          <div className="np-footer-col">
            <h2>Product</h2>
            <a href={APP_STORE_URL}>App Store</a>
            <a href="/#highlights">Highlights</a>
            <Link to="/roadmap">Roadmap</Link>
            <Link to="/next">Next build</Link>
            <Link to="/faq">FAQ</Link>
          </div>
          <div className="np-footer-col">
            <h2>Support</h2>
            <Link to="/feedback">Send feedback</Link>
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
          </div>
          <div className="np-footer-col">
            <h2>Legal</h2>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </nav>
      </div>

      <div className="np-footer-base">
        <p>© {year} noplan</p>
        <a href="https://adameniia.com">Portfolio</a>
      </div>
    </footer>
  );
}
