import type { TournamentRole, TournamentStatus } from "./statuses";

export type TournamentRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: TournamentStatus;
  default_ruleset: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  registrations_open: number;
  recent_games_days: number | null;
};

export type TournamentAdminRow = {
  tournament_id: number;
  user_id: number;
  role: TournamentRole;
};