import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/store";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import AuthPage from "./pages/AuthPage";
import MarketsPage from "./pages/MarketsPage";
import AssetsPage from "./pages/AssetsPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SettingsPage from "./pages/SettingsPage";
import Tutorial from "./components/Tutorial";

export default function App() {
  const { token, user } = useAuth();

  if (!token) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1 pb-24 px-3 sm:px-6 max-w-5xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/markets" replace />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/markets" replace />} />
        </Routes>
      </main>
      <BottomNav />
      {user && !user.tutorialDone && <Tutorial />}
    </div>
  );
}
