import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteNav } from "../components/SiteNav";
import { SiteFooter } from "../components/SiteFooter";
import "../css/noplan.css";
import "../css/privacy.css";

// Shown for any unknown path. On production Apache already answers these with a
// real 404 status (see public/.htaccess); this is just what people see.
export function NotFound() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Page not found — noplan";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="np-root">
      <SiteNav />
      <main className="np-section np-legal">
        <article className="np-legal-inner">
          <h1 className="np-heading">Page not found</h1>
          <p className="np-body">
            There&apos;s nothing at this address. Try the <Link to="/">home page</Link> or the{" "}
            <Link to="/faq">FAQ</Link>.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
