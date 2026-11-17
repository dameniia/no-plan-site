import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NoPlan } from "./pages/NoPlan";
import { NoPlanPost } from "./pages/NoPlanPost";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NoPlan />} />
        <Route path="/post" element={<NoPlanPost />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
