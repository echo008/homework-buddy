import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Dictation from "@/pages/Dictation";
import Units from "@/pages/Units";
import Words from "@/pages/Words";
import Presets from "@/pages/Presets";
import OCR from "@/pages/OCR";
import ImportPage from "@/pages/Import";
import Settings from "@/pages/Settings";
import { Toast } from "@/components/Toast";
import { storage } from "@/lib/storage";

storage.initializeDefaultData()

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dictation" element={<Dictation />} />
          <Route path="/units" element={<Units />} />
          <Route path="/units/:unitId/words" element={<Words />} />
          <Route path="/presets" element={<Presets />} />
          <Route path="/ocr" element={<OCR />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toast />
    </>
  );
}
