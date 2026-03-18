import type { TournamentRegistrationStatus } from "./statuses";

export type TournamentRegistrationRow = {
  id: number;
  tournament_id: number;
  user_id: number;
  aoe_id: string;
  aoe_name: string;
  signup_rating: number | null;
  signup_max_rating: number | null;
  signup_team_rating: number | null;
  signup_max_team_rating: number | null;
  current_rating: number | null;
  current_max_rating: number | null;
  current_team_rating: number | null;
  current_max_team_rating: number | null;
  current_data_fetched_at: string | null;
  total_games: number | null;
  recent_games: number | null;
  status: TournamentRegistrationStatus;
  submitted_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  note: string | null;
  review_note: string | null;
};

export type TournamentRegistrationSelfDto = {
  id: number;
  tournament_id: number;
  user_id: number;
  aoe_id: string;
  aoe_name: string;
  status: TournamentRegistrationStatus;
  submitted_at: string;
  updated_at: string;
  note: string | null;
};

export type TournamentRegistrationSelfCapabilities = {
  can_create: boolean;
  can_edit: boolean;
  can_withdraw: boolean;
};

export type TournamentRegistrationStaffRow = TournamentRegistrationRow & {
  discord_id: string | null;
  discord_name: string | null;
  display_name: string | null;
  avatar: string | null;
};