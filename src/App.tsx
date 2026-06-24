import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dictation from "@/pages/Dictation";
import DictationResult from "@/pages/DictationResult";
import Units from "@/pages/Units";
import Words from "@/pages/Words";
import Classes from "@/pages/Classes";
import ClassDetail from "@/pages/ClassDetail";
import Profile from "@/pages/Profile";
import Preset from "@/pages/Preset";
import OCR from "@/pages/OCR";
import WrongWords from "@/pages/WrongWords";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toast } from "@/components/Toast";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dictation" element={<ProtectedRoute><Dictation /></ProtectedRoute>} />
          <Route path="/dictation/result" element={<ProtectedRoute><DictationResult /></ProtectedRoute>} />
          <Route path="/units" element={<ProtectedRoute><Units /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/preset" element={<ProtectedRoute><Preset /></ProtectedRoute>} />
          <Route path="/ocr" element={<ProtectedRoute><OCR /></ProtectedRoute>} />
          <Route path="/wrong-words" element={<ProtectedRoute><WrongWords /></ProtectedRoute>} />
          <Route path="/units/:unitId/words" element={<ProtectedRoute><Words /></ProtectedRoute>} />
          <Route path="/classes/:id" element={<ProtectedRoute><ClassDetail /></ProtectedRoute>} />
        </Routes>
      </Router>
      <Toast />
    </>
  );
}
