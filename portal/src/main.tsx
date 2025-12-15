import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import HomePage from "./pages/HomePage.tsx";
import AutoPrescriptionWorkflow from "./pages/AutoPrescriptionWorkflow";
import AutoRequisitionWorkflow from "./pages/AutoRequisitionWorkflow";
import ManualPrescriptionWorkflow from "./pages/ManualPrescriptionWorkflow";
import ManualRequisitionWorkflow from "./pages/ManualRequisitionWorkflow";
import ComingSoon from "./pages/coming-soon.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<HomePage />} />
        <Route path="/workflow" element={<App />} />
        <Route path="/workflow/auto-prescription" element={<AutoPrescriptionWorkflow />} />
        <Route path="/workflow/auto-requisition" element={<AutoRequisitionWorkflow />} />
        <Route path="/workflow/manual-prescription" element={<ManualPrescriptionWorkflow />} />
        <Route path="/workflow/manual-requisition" element={<ManualRequisitionWorkflow />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
