import { Navigate, Route, Routes } from "react-router-dom";
import { BoardPage } from "../pages/Board/BoardPage";
import { ReportsPage } from "../pages/Reports/ReportsPage";
import { SettingsPage } from "../pages/Settings/SettingsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BoardPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
