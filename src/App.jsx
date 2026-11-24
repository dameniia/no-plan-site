import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NoPlan } from "./pages/NoPlan";
import { NoPlanPost } from "./pages/NoPlanPost";
import { Feedback } from "./pages/Feedback";
import { Privacy } from "./pages/Privacy";
import { Faq } from "./pages/Faq";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NoPlan />} />
        <Route path="/post" element={<NoPlanPost />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<Faq />} />
        {/* New routes also go in the RewriteRule list in public/.htaccess, or they 404 on production */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
