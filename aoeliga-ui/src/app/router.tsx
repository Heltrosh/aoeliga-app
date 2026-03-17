import { createBrowserRouter, Navigate } from "react-router-dom";

import RootLayout from "../layouts/RootLayout";
import TournamentLayout from "../layouts/TournamentLayout";

import LandingPage from "../pages/landing/tournaments/LandingPage";
import RulesetsPage from "../pages/landing/rulesets/RulesetsPage";
import GlobalAdminPage from "../pages/landing/admin/GlobalAdminPage";
import DashboardPage from "../pages/tournament/DashboardPage";
import DivisionsPage from "../pages/tournament/DivisionsPage";
import SchedulePage from "../pages/tournament/SchedulePage";
import PlayersPage from "../pages/tournament/PlayersPage";
import AdminPage from "../pages/tournament/AdminPage";
import AdminUsersPage from "../pages/landing/admin/AdminUsersPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/rulesets", element: <RulesetsPage /> },
      { path: "/admin", element: <GlobalAdminPage /> },
      { path: "/admin/users", element: <AdminUsersPage />},
      {
        path: "/t/:slug",
        element: <TournamentLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "divisions", element: <DivisionsPage /> },
          { path: "schedule", element: <SchedulePage /> },
          { path: "players", element: <PlayersPage /> },
          { path: "admin", element: <AdminPage /> }
        ],
      },
    ],
  },
]);