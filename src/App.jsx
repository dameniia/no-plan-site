import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NoPlan } from "./pages/NoPlan";
import { NoPlanPost } from "./pages/NoPlanPost";
import { Feedback } from "./pages/Feedback";
import { Privacy } from "./pages/Privacy";
import { Faq } from "./pages/Faq";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NoPlan />} />
        <Route path="/post" element={<NoPlanPost />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<Faq />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
