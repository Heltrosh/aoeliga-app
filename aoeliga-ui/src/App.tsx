import { Routes, Route, Navigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./auth/AuthContext";

import AppLayout from "./layouts/AppLayout";
import LandingPage from "./pages/LandingPage";
import TournamentDashboard from "./pages/TournamentDashboard";
import TournamentDivisions from "./pages/TournamentDivisions";
import TournamentSchedule from "./pages/TournamentSchedule";
import TournamentPlayers from "./pages/TournamentPlayers";

export type AuthedUser = {
  id: number;
  discord_id: string;
  discord_name: string | null;
  display_name: string | null;
  avatar: string | null;
  is_admin: number;
};

type MeResponse = { user: AuthedUser | null };

export default function App() {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as MeResponse;
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  return (
    <AuthContext.Provider value={{ user, authLoading, refreshMe}}>
    <Routes>
      <Route element={<AppLayout user={user} authLoading={authLoading} refreshMe={refreshMe} />}>
        <Route path="/" element={<LandingPage />} />

        <Route path="/t/:slug/dashboard" element={<TournamentDashboard />} />
        <Route path="/t/:slug/divisions" element={<TournamentDivisions />} />
        <Route path="/t/:slug/schedule" element={<TournamentSchedule />} />
        <Route path="/t/:slug/players" element={<TournamentPlayers />} />

        <Route path="/t/:slug" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AuthContext.Provider>
  );
}