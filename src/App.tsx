import { Routes, Route } from "react-router";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Composer from "./pages/Composer";
import Calendar from "./pages/Calendar";
import Accounts from "./pages/Accounts";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/composer" element={<Composer />} />
              <Route path="/composer/:id" element={<Composer />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        }
      />
    </Routes>
  );
}
