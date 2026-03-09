import { createBrowserRouter, Navigate } from "react-router-dom";

import RootLayout from "../layouts/RootLayout";
import TournamentLayout from "../layouts/TournamentLayout";

import LandingPage from "../pages/landing/LandingPage";
import DashboardPage from "../pages/tournament/DashboardPage";
import DivisionsPage from "../pages/tournament/DivisionsPage";
import SchedulePage from "../pages/tournament/SchedulePage";
import PlayersPage from "../pages/tournament/PlayersPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      {
        path: "/t/:slug",
        element: <TournamentLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "divisions", element: <DivisionsPage /> },
          { path: "schedule", element: <SchedulePage /> },
          { path: "players", element: <PlayersPage /> },
        ],
      },
    ],
  },
]);