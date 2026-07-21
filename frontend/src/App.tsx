import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import Dashboard from "./pages/Dashboard";
import Circulars from "./pages/Circulars";
import Lessons from "./pages/Lessons";  // ✅ AGGIUNTO
import Calendar from "./pages/Calendar";
import Hours from "./pages/Hours";
import AIChat from "./pages/AIChat";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout
        sidebar={<Sidebar />}
        header={<Header />}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/circulars"
            element={<Circulars />}
          />

          <Route
            path="/lessons"
            element={<Lessons />}
          />

          <Route
            path="/calendar"
            element={<Calendar />}
          />

          <Route
            path="/hours"
            element={<Hours />}
          />

          <Route
            path="/chat"
            element={<AIChat />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}