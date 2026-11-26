import { Routes, Route } from "react-router-dom";
import { NoPlan } from "./pages/NoPlan";
import { NoPlanPost } from "./pages/NoPlanPost";
import { Feedback } from "./pages/Feedback";
import { Privacy } from "./pages/Privacy";
import { Faq } from "./pages/Faq";
import { Roadmap } from "./pages/Roadmap";
import { NotFound } from "./pages/NotFound";

// The router itself lives in the entries: BrowserRouter in main.jsx (browser),
// StaticRouter in entry-server.jsx (build-time pre-render).
// A new route also goes in src/routes.js and public/.htaccess, or it 404s on production.
function App() {
  return (
    <Routes>
      <Route path="/" element={<NoPlan />} />
      <Route path="/post" element={<NoPlanPost />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
