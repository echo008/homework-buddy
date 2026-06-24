import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Dictation from "@/pages/Dictation";
import Units from "@/pages/Units";
import Words from "@/pages/Words";
import { Toast } from "@/components/Toast";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dictation" element={<Dictation />} />
          <Route path="/units" element={<Units />} />
          <Route path="/units/:unitId/words" element={<Words />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toast />
    </>
  );
}
